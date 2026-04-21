package com.foodapp.controller;

import com.foodapp.dto.AuthResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Value("${app.expose-otp-in-response:false}")
    private boolean exposeOtpInResponse;

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthResponse> handleAll(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        AuthResponse response = AuthResponse.fail("An unexpected error occurred. Please try again.");
        if (exposeOtpInResponse) {
            String debug = ex.getMessage();
            if (debug == null || debug.isBlank()) {
                debug = ex.getClass().getSimpleName();
            }
            response.setDebugMessage(debug);
        }
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AuthResponse> handleBadRequest(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        AuthResponse response = AuthResponse.fail(ex.getMessage());
        if (exposeOtpInResponse) {
            String debug = ex.getMessage();
            if (debug == null || debug.isBlank()) {
                debug = ex.getClass().getSimpleName();
            }
            response.setDebugMessage(debug);
        }
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(response);
    }
}
