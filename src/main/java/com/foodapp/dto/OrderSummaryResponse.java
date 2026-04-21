package com.foodapp.dto;

import java.math.BigDecimal;

public class OrderSummaryResponse {

    private long totalOrders;
    private long activeOrders;
    private long deliveredOrders;
    private BigDecimal totalAmount;
    private BigDecimal totalSaved;
    private BigDecimal pendingAmount;

    public OrderSummaryResponse() {
    }

    public OrderSummaryResponse(long totalOrders,
                                long activeOrders,
                                long deliveredOrders,
                                BigDecimal totalAmount,
                                BigDecimal totalSaved,
                                BigDecimal pendingAmount) {
        this.totalOrders = totalOrders;
        this.activeOrders = activeOrders;
        this.deliveredOrders = deliveredOrders;
        this.totalAmount = totalAmount;
        this.totalSaved = totalSaved;
        this.pendingAmount = pendingAmount;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getActiveOrders() {
        return activeOrders;
    }

    public void setActiveOrders(long activeOrders) {
        this.activeOrders = activeOrders;
    }

    public long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(long deliveredOrders) {
        this.deliveredOrders = deliveredOrders;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getTotalSaved() {
        return totalSaved;
    }

    public void setTotalSaved(BigDecimal totalSaved) {
        this.totalSaved = totalSaved;
    }

    public BigDecimal getPendingAmount() {
        return pendingAmount;
    }

    public void setPendingAmount(BigDecimal pendingAmount) {
        this.pendingAmount = pendingAmount;
    }
}
