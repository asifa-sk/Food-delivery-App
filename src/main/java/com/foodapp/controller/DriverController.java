package com.foodapp.controller;

import com.foodapp.entity.Driver;
import com.foodapp.dto.RegisterRequest;
import com.foodapp.service.AuthService;
import com.foodapp.entity.Order;
import com.foodapp.service.DriverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;
    private final AuthService authService;

    public DriverController(DriverService driverService, AuthService authService) {
        this.driverService = driverService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Driver driver) {
        // Save pending driver details and trigger email OTP via AuthService
        try {
            driverService.savePendingDriver(driver);

            RegisterRequest req = new RegisterRequest();
            req.setName(driver.getName());
            req.setEmail(driver.getEmail());
            req.setPassword(driver.getPassword());
            req.setRole("driver");

            com.foodapp.dto.AuthResponse resp = authService.register(req);
            if (resp.isSuccess()) {
                return ResponseEntity.status(201).body(resp);
            } else {
                return ResponseEntity.status(409).body(resp);
            }
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Unable to process registration", "debugMessage", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            Driver d = driverService.login(req.getEmail(), req.getPassword());
            return ResponseEntity.ok(java.util.Map.of(
                "id", d.getId(),
                "name", d.getName(),
                "email", d.getEmail(),
                "phone", d.getPhone(),
                "vehicleDetails", d.getVehicleDetails(),
                "createdAt", d.getCreatedAt(),
                "approved", d.isApproved()
            ));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", iae.getMessage()));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", ise.getMessage()));
        }
    }

    @GetMapping("/{driverId}/available")
    public ResponseEntity<List<Order>> availableOrders(@PathVariable Long driverId) {
        return ResponseEntity.ok(driverService.getAvailableOrders(driverId));
    }

    @GetMapping("/{driverId}/orders")
    public ResponseEntity<?> driverOrders(@PathVariable Long driverId) {
        try {
            return ResponseEntity.ok(driverService.getDriverOrders(driverId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/{driverId}/orders/{orderId}/accept")
    public ResponseEntity<?> acceptOrder(@PathVariable Long driverId, @PathVariable Long orderId) {
        try {
            Order order = driverService.acceptOrder(driverId, orderId);
            return ResponseEntity.ok(java.util.Map.of(
                "id", order.getId(),
                "status", order.getStatus(),
                "driverId", order.getDriver() != null ? order.getDriver().getId() : null,
                "message", "Order accepted successfully"
            ));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.status(400).body(java.util.Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Internal server error", "debugMessage", ex.getMessage()));
        }
    }

    @PostMapping("/{driverId}/orders/{orderId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long driverId, @PathVariable Long orderId, @RequestBody StatusRequest req) {
        try {
            Order order = driverService.updateDeliveryStatus(driverId, orderId, req.getStatus());
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("id", order.getId());
            payload.put("status", order.getStatus());
            payload.put("driverId", order.getDriver() != null ? order.getDriver().getId() : null);
            payload.put("createdAt", order.getCreatedAt());
            payload.put("deliveredAt", order.getDeliveredAt());
            payload.put("totalAmount", order.getTotalPrice());
            payload.put("message", "Order status updated successfully");
            return ResponseEntity.ok(payload);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.status(400).body(java.util.Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Internal server error", "debugMessage", ex.getMessage()));
        }
    }

    @PostMapping("/{driverId}/orders/{orderId}/location")
    public ResponseEntity<?> updateLocation(@PathVariable Long driverId, @PathVariable Long orderId, @RequestBody LocationRequest req) {
        try {
            Order order = driverService.updateDriverLocation(driverId, orderId, req.getLatitude(), req.getLongitude());
            return ResponseEntity.ok(java.util.Map.of(
                "id", order.getId(),
                "driverId", driverId,
                "driverLastLatitude", order.getDriverLastLatitude(),
                "driverLastLongitude", order.getDriverLastLongitude(),
                "driverLocationUpdatedAt", order.getDriverLocationUpdatedAt(),
                "message", "Driver location updated successfully"
            ));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.status(400).body(java.util.Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Internal server error", "debugMessage", ex.getMessage()));
        }
    }

    public static class LoginRequest {
        private String email;
        private String password;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class StatusRequest {
        private String status;
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class LocationRequest {
        private java.math.BigDecimal latitude;
        private java.math.BigDecimal longitude;

        public java.math.BigDecimal getLatitude() { return latitude; }
        public void setLatitude(java.math.BigDecimal latitude) { this.latitude = latitude; }
        public java.math.BigDecimal getLongitude() { return longitude; }
        public void setLongitude(java.math.BigDecimal longitude) { this.longitude = longitude; }
    }
}
