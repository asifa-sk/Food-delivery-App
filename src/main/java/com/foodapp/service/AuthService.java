package com.foodapp.service;

import com.foodapp.dto.AuthResponse;
import com.foodapp.dto.ResetPasswordRequest;
import com.foodapp.dto.LoginRequest;
import com.foodapp.dto.RegisterRequest;
import com.foodapp.dto.RestaurantRegisterRequest;
import com.foodapp.dto.VerifyOtpRequest;
import com.foodapp.entity.Restaurant;
import com.foodapp.entity.User;
import com.foodapp.entity.enums.RestaurantStatus;
import com.foodapp.entity.enums.Role;
import com.foodapp.repository.RestaurantRepository;
import com.foodapp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final int OTP_LENGTH = 6;
    private static final long OTP_TTL_MILLIS = 10 * 60 * 1000;

    private enum OtpPurpose {
        VERIFY_EMAIL,
        LOGIN_EMAIL,
        RESET_PASSWORD
    }

    private static class OtpEntry {
        private final String otp;
        private final OtpPurpose purpose;
        private final long expiresAt;

        private OtpEntry(String otp, OtpPurpose purpose, long expiresAt) {
            this.otp = otp;
            this.purpose = purpose;
            this.expiresAt = expiresAt;
        }
    }

    // In-memory OTP store: email -> OTP entry
    // Replace with Redis or DB-backed store in production
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private com.foodapp.service.DriverService driverService;

    @Value("${app.expose-otp-in-response:false}")
    private boolean exposeOtpInResponse;

    public AuthService(UserRepository userRepository, RestaurantRepository restaurantRepository,
                       PasswordEncoder passwordEncoder, EmailService emailService) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    // Setter for DriverService to avoid circular constructor injection
    @Autowired(required = false)
    public void setDriverService(com.foodapp.service.DriverService driverService) {
        this.driverService = driverService;
    }

    // ── Register Customer ─────────────────────────────────────────────────────
    public AuthResponse registerCustomer(RegisterRequest req) {
        req.setRole("CUSTOMER");
        return register(req);
    }

    // ── Register Restaurant ───────────────────────────────────────────────────
    public AuthResponse registerRestaurant(RestaurantRegisterRequest req) {
        String email = normalizeEmail(req.getEmail());
        Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent() && existing.get().isVerified()) {
            return AuthResponse.fail("An account with this email already exists.");
        }

        if (req.getRestaurantName() == null || req.getRestaurantName().isBlank()) {
            return AuthResponse.fail("Restaurant name is required.");
        }
        if (req.getAddress() == null || req.getAddress().isBlank()) {
            return AuthResponse.fail("Address is required.");
        }
        if (req.getPhone() == null || req.getPhone().isBlank()) {
            return AuthResponse.fail("Phone number is required.");
        }

        // Create or reuse the User account
        User user = existing.orElse(new User());
        user.setName(req.getOwnerName() != null ? req.getOwnerName() : req.getRestaurantName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(Role.RESTAURANT);
        user.setVerified(false);
        try {
            user = userRepository.save(user);
        } catch (DataAccessException e) {
            log.error("Database error during restaurant registration for {}: {}", email, e.getMessage(), e);
            return AuthResponse.fail("Unable to save restaurant account. Please verify your details and try again.");
        }

        // Create pending Restaurant record linked to this user
        boolean restaurantExists = !restaurantRepository.findByOwnerId(user.getId()).isEmpty();
        if (!restaurantExists) {
            Restaurant restaurant = new Restaurant();
            restaurant.setName(req.getRestaurantName());
            restaurant.setAddress(req.getAddress());
            restaurant.setContactNumber(req.getPhone());
            restaurant.setImageUrl(req.getImageUrl());
            restaurant.setStatus(RestaurantStatus.PENDING);
            restaurant.setActive(false);
            restaurant.setOwner(user);
            restaurantRepository.save(restaurant);
        }

        String otp = generateOtp();
        storeOtp(email, otp, OtpPurpose.VERIFY_EMAIL);

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (RuntimeException e) {
            log.error("Email send failed during restaurant register for {}: {}", email, e.getMessage());
            AuthResponse err = AuthResponse.fail("Registration saved but email could not be sent. Use 'Resend OTP'.");
            err.setEmail(email);
            if (exposeOtpInResponse) err.setOtp(otp);
            return err;
        }

        AuthResponse response = AuthResponse.ok("Restaurant registered. Verify your email — admin approval required before login.");
        response.setEmail(email);
        if (exposeOtpInResponse) {
            response.setOtp(otp);
            log.warn("[DEV MODE] OTP exposed in response for {}: {}", email, otp);
        }
        return response;
    }

    // ── Register ──────────────────────────────────────────────────────────────
    public AuthResponse register(RegisterRequest req) {
        String email = normalizeEmail(req.getEmail());
        java.util.Optional<User> existing = userRepository.findByEmail(email);

        if (existing.isPresent() && existing.get().isVerified()) {
            return AuthResponse.fail("An account with this email already exists.");
        }

        // If unverified account exists, reuse it (allow re-registration)
        User user = existing.orElse(new User());
        user.setName(req.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        Role role = Role.CUSTOMER;
        if (req.getRole() != null) {
            if (req.getRole().equalsIgnoreCase("restaurant")) {
                role = Role.RESTAURANT;
            } else if (req.getRole().equalsIgnoreCase("driver")) {
                role = Role.DRIVER;
            }
        }
        user.setRole(role);
        user.setVerified(false);
        try {
            userRepository.save(user);
        } catch (DataAccessException e) {
            log.error("Database error during customer registration for {}: {}", email, e.getMessage(), e);
            return AuthResponse.fail("Unable to save account. Please verify your details and try again.");
        }

        String otp = generateOtp();
        storeOtp(email, otp, OtpPurpose.VERIFY_EMAIL);

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (RuntimeException e) {
            log.error("Email send failed during register for {}: {}", email, e.getMessage());
            AuthResponse err = AuthResponse.fail("Registration saved but email could not be sent. Use 'Resend OTP' to try again.");
            err.setEmail(email);
            if (exposeOtpInResponse) err.setOtp(otp);
            return err;
        }

        AuthResponse response = AuthResponse.ok("Registration successful. Check your email for the OTP.");
        response.setEmail(email);
        if (exposeOtpInResponse) {
            response.setOtp(otp);
            log.warn("[DEV MODE] OTP exposed in response for {}: {}", email, otp);
        }
        return response;
    }

    // ── Verify OTP ────────────────────────────────────────────────────────────
    public AuthResponse verifyOtp(VerifyOtpRequest req) {
        String email = normalizeEmail(req.getEmail());
        AuthResponse otpValidation = validateAndConsumeOtp(
            email,
            req.getOtp(),
            OtpPurpose.VERIFY_EMAIL,
            "OTP expired or not found. Please register again.",
            "Invalid OTP. Please check and try again."
        );
        if (!otpValidation.isSuccess()) {
            return otpValidation;
        }

        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            return AuthResponse.fail("User not found.");
        }

        User user = optUser.get();
        user.setVerified(true);
        userRepository.save(user);

        // If the verified user is a driver, finalize pending driver record
        try {
            if (user.getRole() == Role.DRIVER && this.driverService != null) {
                com.foodapp.entity.Driver created = this.driverService.finalizePendingDriver(user.getEmail());
                if (created != null) {
                    log.info("Finalized pending driver record for {} (id={})", user.getEmail(), created.getId());
                }
            }
        } catch (Exception ex) {
            log.error("Failed to finalize pending driver for {}: {}", user.getEmail(), ex.getMessage(), ex);
        }

        AuthResponse response = AuthResponse.ok("Email verified successfully. You can now log in.");
        response.setEmail(user.getEmail());
        response.setVerified(true);
        return response;
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest req) {
        if (req == null || req.getEmail() == null || req.getEmail().isBlank() || req.getPassword() == null || req.getPassword().isBlank()) {
            return AuthResponse.fail("Email and password are required.");
        }

        try {
            Optional<User> optUser = userRepository.findByEmail(normalizeEmail(req.getEmail()));
            if (optUser.isEmpty()) {
                return AuthResponse.fail("Invalid email or password.");
            }

            User user = optUser.get();
            if (user.getPassword() == null || user.getPassword().isBlank()) {
                return AuthResponse.fail("Invalid email or password.");
            }

            boolean passwordMatches;
            try {
                passwordMatches = passwordEncoder.matches(req.getPassword(), user.getPassword());
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid password hash for {}: {}", user.getEmail(), ex.getMessage());
                return AuthResponse.fail("Invalid email or password.");
            }

            if (!passwordMatches) {
                return AuthResponse.fail("Invalid email or password.");
            }

            if (!user.isVerified()) {
                AuthResponse response = AuthResponse.fail("Account not verified. Please verify your email first.");
                response.setVerified(false);
                response.setEmail(user.getEmail());
                return response;
            }

            String roleName = user.getRole() != null ? user.getRole().name() : Role.CUSTOMER.name();
            if (user.getRole() == null) {
                user.setRole(Role.CUSTOMER);
                userRepository.save(user);
            }

            // TODO: generate a real JWT token here
            String mockToken = "mock-token-" + user.getId() + "-" + System.currentTimeMillis();

            AuthResponse response = AuthResponse.ok("Login successful.");
            response.setEmail(user.getEmail());
            response.setName(user.getName());
            response.setUserId(user.getId());
            response.setRole(roleName);
            response.setVerified(true);
            response.setToken(mockToken);
            return response;
        } catch (Exception ex) {
            log.error("Login failed for {}: {}", req.getEmail(), ex.getMessage(), ex);
            AuthResponse response = AuthResponse.fail("Unable to login right now. Please try again.");
            if (exposeOtpInResponse) {
                String debug = ex.getMessage();
                if (debug == null || debug.isBlank()) {
                    debug = ex.getClass().getSimpleName();
                }
                response.setDebugMessage(debug);
            }
            return response;
        }
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────
    public AuthResponse resendOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return AuthResponse.fail("No account found with this email.");
        }
        if (userOpt.get().isVerified()) {
            return AuthResponse.fail("Account is already verified. Please log in.");
        }

        String otp = generateOtp();
        storeOtp(normalizedEmail, otp, OtpPurpose.VERIFY_EMAIL);

        try {
            emailService.sendOtpEmail(normalizedEmail, otp);
        } catch (RuntimeException e) {
            log.error("Email send failed during resendOtp for {}: {}", normalizedEmail, e.getMessage());
            AuthResponse err = AuthResponse.fail("Could not send OTP email. Please try again later.");
            if (exposeOtpInResponse) err.setOtp(otp);
            return err;
        }

        AuthResponse response = AuthResponse.ok("OTP resent. Please check your email.");
        if (exposeOtpInResponse) {
            response.setOtp(otp);
            log.warn("[DEV MODE] OTP exposed in response for {}: {}", normalizedEmail, otp);
        }
        return response;
    }

    // ── Login with Email OTP ──────────────────────────────────────────────────
    public AuthResponse requestLoginOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return AuthResponse.fail("No account found with this email.");
        }
        if (!userOpt.get().isVerified()) {
            return AuthResponse.fail("Account not verified. Please verify your email first.");
        }

        String otp = generateOtp();
        storeOtp(normalizedEmail, otp, OtpPurpose.LOGIN_EMAIL);
        try {
            emailService.sendLoginOtpEmail(normalizedEmail, otp);
        } catch (RuntimeException e) {
            log.error("Email send failed during requestLoginOtp for {}: {}", normalizedEmail, e.getMessage());
            AuthResponse err = AuthResponse.fail("Could not send login OTP email. Please try again later.");
            if (exposeOtpInResponse) err.setOtp(otp);
            return err;
        }

        AuthResponse response = AuthResponse.ok("Login OTP sent. Please check your email.");
        response.setEmail(normalizedEmail);
        if (exposeOtpInResponse) {
            response.setOtp(otp);
            log.warn("[DEV MODE] Login OTP exposed in response for {}: {}", normalizedEmail, otp);
        }
        return response;
    }

    public AuthResponse loginWithOtp(VerifyOtpRequest req) {
        String email = normalizeEmail(req.getEmail());
        AuthResponse otpValidation = validateAndConsumeOtp(
            email,
            req.getOtp(),
            OtpPurpose.LOGIN_EMAIL,
            "OTP expired or not found. Request a new login OTP.",
            "Invalid OTP. Please check and try again."
        );
        if (!otpValidation.isSuccess()) {
            return otpValidation;
        }

        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            return AuthResponse.fail("User not found.");
        }

        User user = optUser.get();
        if (!user.isVerified()) {
            return AuthResponse.fail("Account not verified. Please verify your email first.");
        }

        String roleName = user.getRole() != null ? user.getRole().name() : Role.CUSTOMER.name();
        if (user.getRole() == null) {
            user.setRole(Role.CUSTOMER);
            userRepository.save(user);
        }

        String mockToken = "mock-token-" + user.getId() + "-" + System.currentTimeMillis();

        AuthResponse response = AuthResponse.ok("Login successful.");
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setUserId(user.getId());
        response.setRole(roleName);
        response.setVerified(true);
        response.setToken(mockToken);
        return response;
    }

    // ── Forgot Password with OTP ──────────────────────────────────────────────
    public AuthResponse requestPasswordResetOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return AuthResponse.fail("No account found with this email.");
        }

        String otp = generateOtp();
        storeOtp(normalizedEmail, otp, OtpPurpose.RESET_PASSWORD);
        try {
            emailService.sendPasswordResetOtpEmail(normalizedEmail, otp);
        } catch (RuntimeException e) {
            log.error("Email send failed during requestPasswordResetOtp for {}: {}", normalizedEmail, e.getMessage());
            AuthResponse err = AuthResponse.fail("Could not send password reset OTP email. Please try again later.");
            if (exposeOtpInResponse) err.setOtp(otp);
            return err;
        }

        AuthResponse response = AuthResponse.ok("Password reset OTP sent. Please check your email.");
        response.setEmail(normalizedEmail);
        if (exposeOtpInResponse) {
            response.setOtp(otp);
            log.warn("[DEV MODE] Password-reset OTP exposed in response for {}: {}", normalizedEmail, otp);
        }
        return response;
    }

    public AuthResponse resetPasswordWithOtp(ResetPasswordRequest req) {
        String email = normalizeEmail(req.getEmail());
        String newPassword = req.getNewPassword() == null ? "" : req.getNewPassword();

        if (!isValidPassword(newPassword)) {
            return AuthResponse.fail("Password must be at least 8 characters with at least 1 letter and 1 number.");
        }

        AuthResponse otpValidation = validateAndConsumeOtp(
            email,
            req.getOtp(),
            OtpPurpose.RESET_PASSWORD,
            "OTP expired or not found. Request a new password reset OTP.",
            "Invalid OTP. Please check and try again."
        );
        if (!otpValidation.isSuccess()) {
            return otpValidation;
        }

        Optional<User> optUser = userRepository.findByEmail(email);
        if (optUser.isEmpty()) {
            return AuthResponse.fail("User not found.");
        }

        User user = optUser.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return AuthResponse.ok("Password reset successful. You can now log in.");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otpValue = 100000 + random.nextInt(900000);
        return String.valueOf(otpValue);
    }

    private void storeOtp(String email, String otp, OtpPurpose purpose) {
        long expiresAt = System.currentTimeMillis() + OTP_TTL_MILLIS;
        otpStore.put(email, new OtpEntry(otp, purpose, expiresAt));
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setOtpCode(otp);
            userRepository.save(user);
        });
    }

    private AuthResponse validateAndConsumeOtp(
        String email,
        String otp,
        OtpPurpose expectedPurpose,
        String missingMessage,
        String invalidMessage
    ) {
        OtpEntry entry = otpStore.get(email);
        if (entry == null || entry.purpose != expectedPurpose) {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (otp != null && otp.trim().equals(user.getOtpCode())) {
                    clearOtpForUser(user);
                    if (entry != null) {
                        otpStore.remove(email);
                    }
                    return AuthResponse.ok("OTP verified.");
                }
            }
            return AuthResponse.fail(missingMessage);
        }
        if (System.currentTimeMillis() > entry.expiresAt) {
            otpStore.remove(email);
            return AuthResponse.fail("OTP expired. Please request a new OTP.");
        }
        if (otp == null || !entry.otp.equals(otp.trim())) {
            return AuthResponse.fail(invalidMessage);
        }
        otpStore.remove(email);
        userRepository.findByEmail(email).ifPresent(this::clearOtpForUser);
        return AuthResponse.ok("OTP verified.");
    }

    private void clearOtpForUser(User user) {
        if (user.getOtpCode() != null) {
            user.setOtpCode(null);
            userRepository.save(user);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private boolean isValidPassword(String password) {
        return password.matches("^(?=.*[A-Za-z])(?=.*\\d).{8,}$");
    }
}
