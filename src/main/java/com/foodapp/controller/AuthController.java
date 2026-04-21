package com.foodapp.controller;

import com.foodapp.dto.AuthResponse;
import com.foodapp.dto.EmailRequest;
import com.foodapp.dto.LoginRequest;
import com.foodapp.dto.RegisterRequest;
import com.foodapp.dto.RestaurantRegisterRequest;
import com.foodapp.dto.ResetPasswordRequest;
import com.foodapp.dto.VerifyOtpRequest;
import com.foodapp.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.CREATED : HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(response);
    }


    @PostMapping("/customer/register")
    public ResponseEntity<AuthResponse> registerCustomer(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerCustomer(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.CREATED : HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(response);
    }

   
    @PostMapping("/restaurant/register")
    public ResponseEntity<AuthResponse> registerRestaurant(@RequestBody RestaurantRegisterRequest request) {
        AuthResponse response = authService.registerRestaurant(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.CREATED : HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@RequestBody VerifyOtpRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank() || request.getOtp() == null || request.getOtp().isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.fail("Email and OTP are required."));
        }
        AuthResponse response = authService.verifyOtp(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

  
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank() || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.fail("Email and password are required."));
        }
        AuthResponse response = authService.login(request);
        if (!response.isSuccess()) {
            boolean notVerified = response.getMessage() != null
                && response.getMessage().contains("not verified");
            HttpStatus status = notVerified ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
            return ResponseEntity.status(status).body(response);
        }
        return ResponseEntity.ok(response);
    }

   
    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.fail("Email is required."));
        }
        AuthResponse response = authService.resendOtp(email);
        return ResponseEntity.ok(response);
    }

  
    @PostMapping("/login-otp/request")
    public ResponseEntity<AuthResponse> requestLoginOtp(@RequestBody EmailRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.fail("Email is required."));
        }
        AuthResponse response = authService.requestLoginOtp(request.getEmail());
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/login-otp/verify")
    public ResponseEntity<AuthResponse> verifyLoginOtp(@RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.loginWithOtp(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    
    @PostMapping("/forgot-password/request")
    public ResponseEntity<AuthResponse> requestForgotPasswordOtp(@RequestBody EmailRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.fail("Email is required."));
        }
        AuthResponse response = authService.requestPasswordResetOtp(request.getEmail());
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

  
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<AuthResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.resetPasswordWithOtp(request);
        HttpStatus status = response.isSuccess() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }
}
