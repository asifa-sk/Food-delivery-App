package com.foodapp.dto;

import java.util.List;

public class PlaceOrderRequest {

    private Long customerId;
    private Long restaurantId;
    private String deliveryAddress;
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

    public List<OrderItemRequest> getItems() { return items; }
    public void setItems(List<OrderItemRequest> items) { this.items = items; }
}

