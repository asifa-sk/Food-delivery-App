package com.foodapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.foodapp.entity.enums.OrderStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Driver driver;

    @Column(name = "delivered_at")
    private java.time.LocalDateTime deliveredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "payment_reference")
    private String paymentReference;

    @Column(name = "customer_latitude", precision = 10, scale = 8)
    private BigDecimal customerLatitude;

    @Column(name = "customer_longitude", precision = 11, scale = 8)
    private BigDecimal customerLongitude;

    @Column(name = "restaurant_latitude", precision = 10, scale = 8)
    private BigDecimal restaurantLatitude;

    @Column(name = "restaurant_longitude", precision = 11, scale = 8)
    private BigDecimal restaurantLongitude;

    @Column(name = "delivery_distance_km", precision = 10, scale = 2)
    private BigDecimal deliveryDistanceKm;

    @Column(name = "delivery_charge", precision = 10, scale = 2)
    private BigDecimal deliveryCharge;

    @Column(name = "estimated_delivery_minutes")
    private Integer estimatedDeliveryMinutes;

    @Column(name = "driver_last_latitude", precision = 10, scale = 8)
    private BigDecimal driverLastLatitude;

    @Column(name = "driver_last_longitude", precision = 11, scale = 8)
    private BigDecimal driverLastLongitude;

    @Column(name = "driver_location_updated_at")
    private LocalDateTime driverLocationUpdatedAt;

    @Column(name = "driver_nearby_notified", nullable = false)
    private boolean driverNearbyNotified;

    @CreationTimestamp
    @Column(name = "order_date", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> orderItems = new ArrayList<>();

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }

    public Driver getDriver() { return driver; }
    public void setDriver(Driver driver) { this.driver = driver; }

    public java.time.LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(java.time.LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public BigDecimal getCustomerLatitude() { return customerLatitude; }
    public void setCustomerLatitude(BigDecimal customerLatitude) { this.customerLatitude = customerLatitude; }

    public BigDecimal getCustomerLongitude() { return customerLongitude; }
    public void setCustomerLongitude(BigDecimal customerLongitude) { this.customerLongitude = customerLongitude; }

    public BigDecimal getRestaurantLatitude() { return restaurantLatitude; }
    public void setRestaurantLatitude(BigDecimal restaurantLatitude) { this.restaurantLatitude = restaurantLatitude; }

    public BigDecimal getRestaurantLongitude() { return restaurantLongitude; }
    public void setRestaurantLongitude(BigDecimal restaurantLongitude) { this.restaurantLongitude = restaurantLongitude; }

    public BigDecimal getDeliveryDistanceKm() { return deliveryDistanceKm; }
    public void setDeliveryDistanceKm(BigDecimal deliveryDistanceKm) { this.deliveryDistanceKm = deliveryDistanceKm; }

    public BigDecimal getDeliveryCharge() { return deliveryCharge; }
    public void setDeliveryCharge(BigDecimal deliveryCharge) { this.deliveryCharge = deliveryCharge; }

    public Integer getEstimatedDeliveryMinutes() { return estimatedDeliveryMinutes; }
    public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) { this.estimatedDeliveryMinutes = estimatedDeliveryMinutes; }

    public BigDecimal getDriverLastLatitude() { return driverLastLatitude; }
    public void setDriverLastLatitude(BigDecimal driverLastLatitude) { this.driverLastLatitude = driverLastLatitude; }

    public BigDecimal getDriverLastLongitude() { return driverLastLongitude; }
    public void setDriverLastLongitude(BigDecimal driverLastLongitude) { this.driverLastLongitude = driverLastLongitude; }

    public LocalDateTime getDriverLocationUpdatedAt() { return driverLocationUpdatedAt; }
    public void setDriverLocationUpdatedAt(LocalDateTime driverLocationUpdatedAt) { this.driverLocationUpdatedAt = driverLocationUpdatedAt; }

    public boolean isDriverNearbyNotified() { return driverNearbyNotified; }
    public void setDriverNearbyNotified(boolean driverNearbyNotified) { this.driverNearbyNotified = driverNearbyNotified; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<OrderItem> getOrderItems() { return orderItems; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
}

