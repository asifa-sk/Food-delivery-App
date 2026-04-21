package com.foodapp.dto;

public class AuthResponse {

    private boolean success;
    private String message;
    private String email;
    private String name;
    private Long userId;
    private boolean isVerified;
    private String role;
    // Placeholder — replace with real JWT token once JWT lib is added
    private String token;

    // Populated only when app.expose-otp-in-response=true (local dev/QA only)
    private String otp;
    private String debugMessage;

    public AuthResponse() {}

    // Factory helpers
    public static AuthResponse ok(String message) {
        AuthResponse r = new AuthResponse();
        r.success = true;
        r.message = message;
        return r;
    }

    public static AuthResponse fail(String message) {
        AuthResponse r = new AuthResponse();
        r.success = false;
        r.message = message;
        return r;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public boolean isVerified() { return isVerified; }
    public void setVerified(boolean verified) { isVerified = verified; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public String getDebugMessage() { return debugMessage; }
    public void setDebugMessage(String debugMessage) { this.debugMessage = debugMessage; }
}
