package com.foodapp.service;

import com.foodapp.entity.Driver;
import com.foodapp.entity.Notification;
import com.foodapp.entity.Order;
import com.foodapp.entity.OrderHistory;
import com.foodapp.entity.enums.OrderStatus;
import com.foodapp.repository.DriverRepository;
import com.foodapp.repository.NotificationRepository;
import com.foodapp.repository.OrderHistoryRepository;
import com.foodapp.repository.OrderRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DriverService {

    private final DriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    private final OrderHistoryRepository orderHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final DeliveryTrackingService deliveryTrackingService;

    // In-memory store for pending driver details keyed by email.
    private final Map<String, Driver> pendingDrivers = new ConcurrentHashMap<>();

    public DriverService(DriverRepository driverRepository,
                         OrderRepository orderRepository,
                         NotificationRepository notificationRepository,
                         OrderHistoryRepository orderHistoryRepository,
                         PasswordEncoder passwordEncoder,
                         DeliveryTrackingService deliveryTrackingService) {
        this.driverRepository = driverRepository;
        this.orderRepository = orderRepository;
        this.notificationRepository = notificationRepository;
        this.orderHistoryRepository = orderHistoryRepository;
        this.passwordEncoder = passwordEncoder;
        this.deliveryTrackingService = deliveryTrackingService;
    }

    // Save pending driver details while waiting for email verification (OTP)
    public void savePendingDriver(Driver d) {
        if (d == null || d.getEmail() == null) return;
        pendingDrivers.put(d.getEmail().toLowerCase().trim(), d);
    }

    // Called after user email is verified to finalize driver creation
    public Driver finalizePendingDriver(String email) {
        if (email == null) return null;
        String key = email.toLowerCase().trim();
        Driver pending = pendingDrivers.remove(key);
        if (pending == null) return null;
        // ensure password is encoded
        if (pending.getPassword() != null && !pending.getPassword().isBlank()) {
            pending.setPassword(passwordEncoder.encode(pending.getPassword()));
        }
        pending.setApproved(false);
        return driverRepository.save(pending);
    }

    public Driver register(Driver driver) {
        driver.setPassword(passwordEncoder.encode(driver.getPassword()));
        // New drivers must be approved by admin before they can login
        driver.setApproved(false);
        return driverRepository.save(driver);
    }

    public Driver login(String email, String password) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        Driver d = driverRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(password, d.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        if (!d.isApproved()) {
            throw new IllegalStateException("Driver not approved");
        }
        return d;
    }

    public List<Order> getAvailableOrders(Long driverId) {
        // Surface any unassigned order that is still actionable for a driver.
        // This keeps the dashboard usable even if restaurant/admin flows moved
        // an order forward before driver pickup.
        java.util.List<OrderStatus> hiddenStatuses = java.util.Arrays.asList(
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED
        );
        return orderRepository.findByDriverIsNullAndStatusNotIn(hiddenStatuses);
    }

    public List<Order> getDriverOrders(Long driverId) {
        if (driverId == null) {
            throw new IllegalArgumentException("Driver id is required");
        }
        driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        return orderRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    @Transactional
    public Order acceptOrder(Long driverId, Long orderId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getDriver() != null) {
            throw new IllegalStateException("Order already assigned to a driver");
        }

        order.setDriver(driver);
        order.setStatus(OrderStatus.ACCEPTED_BY_DRIVER);
        Order saved = orderRepository.save(order);

        // history and notifications are best-effort and should not affect the main transaction.
        // Run them asynchronously so failures (e.g., missing tables) don't mark the current
        // transaction as rollback-only.
        new Thread(() -> {
            try {
                OrderHistory history = new OrderHistory();
                history.setOrder(saved);
                history.setStatus(OrderStatus.ACCEPTED_BY_DRIVER);
                history.setNote("Driver " + driver.getName() + " accepted the order");
                orderHistoryRepository.save(history);
            } catch (Exception hx) {
                System.err.println("Failed to save order history: " + hx.getMessage());
            }

            try {
                if (saved.getCustomer() != null && saved.getCustomer().getId() != null) {
                    Notification n1 = new Notification();
                    n1.setRecipientType("CUSTOMER");
                    n1.setRecipientId(saved.getCustomer().getId());
                    n1.setMessage("Driver has accepted your order");
                    notificationRepository.save(n1);
                }
            } catch (Exception nx) {
                System.err.println("Failed to save customer notification: " + nx.getMessage());
            }

            try {
                if (saved.getRestaurant() != null && saved.getRestaurant().getId() != null) {
                    Notification n2 = new Notification();
                    n2.setRecipientType("RESTAURANT");
                    n2.setRecipientId(saved.getRestaurant().getId());
                    n2.setMessage("Driver has accepted your order");
                    notificationRepository.save(n2);
                }
            } catch (Exception nx) {
                System.err.println("Failed to save restaurant notification: " + nx.getMessage());
            }
        }).start();

        deliveryTrackingService.publishTrackingUpdate(saved, "Driver has accepted your order.");
        return saved;
    }

    @Transactional
    public Order updateDeliveryStatus(Long driverId, Long orderId, String status) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getDriver() == null || !order.getDriver().getId().equals(driverId)) {
            throw new IllegalStateException("Driver is not assigned to this order");
        }

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        if (newStatus != OrderStatus.OUT_FOR_DELIVERY && newStatus != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Driver can only update status to OUT_FOR_DELIVERY or DELIVERED");
        }
        if (newStatus == OrderStatus.OUT_FOR_DELIVERY && order.getStatus() != OrderStatus.ACCEPTED_BY_DRIVER) {
            throw new IllegalStateException("Order must be accepted by the driver before starting delivery");
        }
        if (newStatus == OrderStatus.DELIVERED && order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new IllegalStateException("Order must be out for delivery before it can be delivered");
        }

        order.setStatus(newStatus);
        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        Order saved = orderRepository.save(order);

        String msg = "Driver " + driver.getName() + " updated order status to " + newStatus;
        if (newStatus == OrderStatus.DELIVERED) {
            msg += " at " + saved.getDeliveredAt();
        }
        final Order savedOrder = saved;
        final OrderStatus statusForHistory = newStatus;
        final String notificationMessage = msg;

        // Keep delivery status update resilient even if history/notification tables are out of sync.
        new Thread(() -> {
            saveOrderHistory(savedOrder, statusForHistory, "Driver " + driver.getName() + " marked status: " + statusForHistory);
            saveNotification("CUSTOMER", savedOrder.getCustomer() != null ? savedOrder.getCustomer().getId() : null, notificationMessage);
            saveNotification("RESTAURANT", savedOrder.getRestaurant() != null ? savedOrder.getRestaurant().getId() : null, notificationMessage);
        }).start();

        deliveryTrackingService.publishTrackingUpdate(saved, notificationMessage);
        return saved;
    }

    @Transactional
    public Order updateDriverLocation(Long driverId, Long orderId, BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        if (latitude.compareTo(BigDecimal.valueOf(-90)) < 0 || latitude.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (longitude.compareTo(BigDecimal.valueOf(-180)) < 0 || longitude.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (isZeroCoordinate(latitude, longitude)) {
            throw new IllegalArgumentException("Driver GPS location is not ready yet");
        }

        driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("Driver not found"));
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (order.getDriver() == null || !order.getDriver().getId().equals(driverId)) {
            throw new IllegalStateException("Driver is not assigned to this order");
        }
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY && order.getStatus() != OrderStatus.ACCEPTED_BY_DRIVER) {
            throw new IllegalStateException("Live location can only be updated for active deliveries");
        }

        order.setDriverLastLatitude(latitude);
        order.setDriverLastLongitude(longitude);
        order.setDriverLocationUpdatedAt(LocalDateTime.now());
        String trackingMessage = null;
        if (shouldNotifyNearby(order, latitude, longitude)) {
            order.setDriverNearbyNotified(true);
            trackingMessage = "Your delivery partner is nearby.";
        }

        Order saved = orderRepository.save(order);
        if (trackingMessage != null) {
            saveNotification("CUSTOMER", saved.getCustomer() != null ? saved.getCustomer().getId() : null, trackingMessage);
        }
        try {
            deliveryTrackingService.publishTrackingUpdate(saved, trackingMessage);
        } catch (Exception ex) {
            System.err.println("Failed to publish tracking update: " + ex.getMessage());
        }
        return saved;
    }

    private boolean shouldNotifyNearby(Order order, BigDecimal latitude, BigDecimal longitude) {
        if (order.isDriverNearbyNotified() || order.getCustomerLatitude() == null || order.getCustomerLongitude() == null) {
            return false;
        }
        return haversineDistanceKm(
                latitude.doubleValue(),
                longitude.doubleValue(),
                order.getCustomerLatitude().doubleValue(),
                order.getCustomerLongitude().doubleValue()
        ) <= 0.80d;
    }

    private boolean isZeroCoordinate(BigDecimal latitude, BigDecimal longitude) {
        return latitude.compareTo(BigDecimal.ZERO) == 0 && longitude.compareTo(BigDecimal.ZERO) == 0;
    }

    private double haversineDistanceKm(double startLat, double startLng, double endLat, double endLng) {
        double earthRadiusKm = 6371.0d;
        double latDistance = Math.toRadians(endLat - startLat);
        double lngDistance = Math.toRadians(endLng - startLng);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(startLat))
                * Math.cos(Math.toRadians(endLat))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private void saveOrderHistory(Order order, OrderStatus status, String note) {
        try {
            OrderHistory history = new OrderHistory();
            history.setOrder(order);
            history.setStatus(status);
            history.setNote(note);
            orderHistoryRepository.save(history);
        } catch (Exception ex) {
            System.err.println("Failed to save order history: " + ex.getMessage());
        }
    }

    private void saveNotification(String recipientType, Long recipientId, String message) {
        if (recipientId == null) {
            return;
        }

        try {
            Notification notification = new Notification();
            notification.setRecipientType(recipientType);
            notification.setRecipientId(recipientId);
            notification.setMessage(message);
            notificationRepository.save(notification);
        } catch (Exception ex) {
            System.err.println("Failed to save " + recipientType + " notification: " + ex.getMessage());
        }
    }
}
