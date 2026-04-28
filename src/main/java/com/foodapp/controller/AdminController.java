package com.foodapp.controller;

import com.foodapp.entity.Order;
import com.foodapp.entity.OrderHistory;
import com.foodapp.repository.DriverRepository;
import com.foodapp.repository.OrderHistoryRepository;
import com.foodapp.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final OrderRepository orderRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final DriverRepository driverRepository;

    public AdminController(OrderRepository orderRepository, OrderHistoryRepository orderHistoryRepository, DriverRepository driverRepository) {
        this.orderRepository = orderRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.driverRepository = driverRepository;
    }

    @GetMapping("/drivers/pending")
    public ResponseEntity<java.util.List<Object>> getPendingDrivers() {
        try {
            java.util.List<com.foodapp.entity.Driver> list = driverRepository.findAll().stream().filter(d -> !d.isApproved()).collect(java.util.stream.Collectors.toList());
            java.util.List<Object> out = new java.util.ArrayList<>();
            for (com.foodapp.entity.Driver d : list) {
                out.add(new java.util.HashMap<String, Object>() {{ put("id", d.getId()); put("name", d.getName()); put("email", d.getEmail()); put("phone", d.getPhone()); put("createdAt", d.getCreatedAt()); }});
            }
            return ResponseEntity.ok(out);
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.List.of(java.util.Map.of("message", "Failed to fetch pending drivers", "error", ex.getMessage())));
        }
    }

    @PostMapping("/drivers/{driverId}/approve")
    public ResponseEntity<?> approveDriver(@PathVariable Long driverId) {
        try {
            com.foodapp.entity.Driver d = driverRepository.findById(driverId).orElse(null);
            if (d == null) return ResponseEntity.notFound().build();
            d.setApproved(true);
            driverRepository.save(d);
            return ResponseEntity.ok(java.util.Map.of("message", "Driver approved"));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Unable to approve driver", "error", ex.getMessage()));
        }
    }

    @GetMapping("/delivery-tracking")
    public ResponseEntity<List<Object>> getDeliveryTracking() {
        List<Order> orders = orderRepository.findAll();
        List<Object> rows = orders.stream()
                .filter(o -> o.getStatus() != null)
                .map(o -> {
                    return new java.util.HashMap<String, Object>() {{
                        put("orderId", o.getId());
                        put("customer", o.getCustomer() != null ? o.getCustomer().getName() : null);
                        put("restaurant", o.getRestaurant() != null ? o.getRestaurant().getName() : null);
                        put("driver", o.getDriver() != null ? o.getDriver().getName() : null);
                        put("status", o.getStatus());
                        put("deliveredAt", o.getDeliveredAt());
                    }};
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(rows);
    }

    @GetMapping("/order/{orderId}/history")
    public ResponseEntity<List<OrderHistory>> getOrderHistory(@PathVariable Long orderId) {
        List<OrderHistory> history = orderHistoryRepository.findByOrderIdOrderByChangedAtAsc(orderId);
        return ResponseEntity.ok(history);
    }
}
