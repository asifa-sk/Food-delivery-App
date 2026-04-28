package com.foodapp.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PlaceOrderRequest {

    private Long customerId;
    private Long restaurantId;
    private String deliveryAddress;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentReference;
    private BigDecimal customerLatitude;
    private BigDecimal customerLongitude;
    private BigDecimal restaurantLatitude;
    private BigDecimal restaurantLongitude;
    private BigDecimal deliveryDistanceKm;
    private BigDecimal deliveryCharge;
    private Integer estimatedDeliveryMinutes;
    private List<OrderItemRequest> items;

    public PlaceOrderRequest() {}

    public PlaceOrderRequest(Long customerId, Long restaurantId, String deliveryAddress, List<OrderItemRequest> items) {
        this.customerId = customerId;
        this.restaurantId = restaurantId;
        this.deliveryAddress = deliveryAddress;
        this.items = items;
    }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }

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

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}

