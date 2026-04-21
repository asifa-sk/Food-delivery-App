package com.foodapp.dto;

public class OrderItemRequest {

    private Long foodItemId;
    private int quantity;

    public OrderItemRequest() {}

    public OrderItemRequest(Long foodItemId, int quantity) {
        this.foodItemId = foodItemId;
        this.quantity = quantity;
    }

    public Long getFoodItemId() { return foodItemId; }
    public void setFoodItemId(Long foodItemId) { this.foodItemId = foodItemId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}

