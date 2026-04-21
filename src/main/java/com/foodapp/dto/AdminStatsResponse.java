package com.foodapp.dto;

import java.math.BigDecimal;

public class AdminStatsResponse {
    private long totalUsers;
    private long totalRestaurants;
    private long approvedRestaurants;
    private long pendingRestaurants;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long deliveredOrders;
    private long activeOrders;

    public AdminStatsResponse(long totalUsers, long totalRestaurants, long approvedRestaurants,
                              long pendingRestaurants, long totalOrders, BigDecimal totalRevenue,
                              long deliveredOrders, long activeOrders) {
        this.totalUsers = totalUsers;
        this.totalRestaurants = totalRestaurants;
        this.approvedRestaurants = approvedRestaurants;
        this.pendingRestaurants = pendingRestaurants;
        this.totalOrders = totalOrders;
        this.totalRevenue = totalRevenue;
        this.deliveredOrders = deliveredOrders;
        this.activeOrders = activeOrders;
    }

    public long getTotalUsers() { return totalUsers; }
    public long getTotalRestaurants() { return totalRestaurants; }
    public long getApprovedRestaurants() { return approvedRestaurants; }
    public long getPendingRestaurants() { return pendingRestaurants; }
    public long getTotalOrders() { return totalOrders; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public long getDeliveredOrders() { return deliveredOrders; }
    public long getActiveOrders() { return activeOrders; }
}
