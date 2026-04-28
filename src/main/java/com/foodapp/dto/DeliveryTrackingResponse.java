package com.foodapp.dto;

import com.foodapp.entity.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DeliveryTrackingResponse {

    private Long orderId;
    private Long customerId;
    private Long driverId;
    private String driverName;
    private String restaurantName;
    private String deliveryAddress;
    private OrderStatus status;
    private BigDecimal deliveryDistanceKm;
    private BigDecimal remainingDistanceKm;
    private BigDecimal deliveryCharge;
    private Integer estimatedDeliveryMinutes;
    private Integer remainingEtaMinutes;
    private boolean nearby;
    private String notificationMessage;
    private LocalDateTime driverLocationUpdatedAt;
    private LocalDateTime deliveredAt;
    private TrackingLocation restaurantLocation;
    private TrackingLocation customerLocation;
    private TrackingLocation driverLocation;

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getRestaurantName() {
        return restaurantName;
    }

    public void setRestaurantName(String restaurantName) {
        this.restaurantName = restaurantName;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getDeliveryDistanceKm() {
        return deliveryDistanceKm;
    }

    public void setDeliveryDistanceKm(BigDecimal deliveryDistanceKm) {
        this.deliveryDistanceKm = deliveryDistanceKm;
    }

    public BigDecimal getRemainingDistanceKm() {
        return remainingDistanceKm;
    }

    public void setRemainingDistanceKm(BigDecimal remainingDistanceKm) {
        this.remainingDistanceKm = remainingDistanceKm;
    }

    public BigDecimal getDeliveryCharge() {
        return deliveryCharge;
    }

    public void setDeliveryCharge(BigDecimal deliveryCharge) {
        this.deliveryCharge = deliveryCharge;
    }

    public Integer getEstimatedDeliveryMinutes() {
        return estimatedDeliveryMinutes;
    }

    public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) {
        this.estimatedDeliveryMinutes = estimatedDeliveryMinutes;
    }

    public Integer getRemainingEtaMinutes() {
        return remainingEtaMinutes;
    }

    public void setRemainingEtaMinutes(Integer remainingEtaMinutes) {
        this.remainingEtaMinutes = remainingEtaMinutes;
    }

    public boolean isNearby() {
        return nearby;
    }

    public void setNearby(boolean nearby) {
        this.nearby = nearby;
    }

    public String getNotificationMessage() {
        return notificationMessage;
    }

    public void setNotificationMessage(String notificationMessage) {
        this.notificationMessage = notificationMessage;
    }

    public LocalDateTime getDriverLocationUpdatedAt() {
        return driverLocationUpdatedAt;
    }

    public void setDriverLocationUpdatedAt(LocalDateTime driverLocationUpdatedAt) {
        this.driverLocationUpdatedAt = driverLocationUpdatedAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public TrackingLocation getRestaurantLocation() {
        return restaurantLocation;
    }

    public void setRestaurantLocation(TrackingLocation restaurantLocation) {
        this.restaurantLocation = restaurantLocation;
    }

    public TrackingLocation getCustomerLocation() {
        return customerLocation;
    }

    public void setCustomerLocation(TrackingLocation customerLocation) {
        this.customerLocation = customerLocation;
    }

    public TrackingLocation getDriverLocation() {
        return driverLocation;
    }

    public void setDriverLocation(TrackingLocation driverLocation) {
        this.driverLocation = driverLocation;
    }
}
