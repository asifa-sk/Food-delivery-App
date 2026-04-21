package com.foodapp.controller;

import com.foodapp.dto.AddRestaurantRequest;
import com.foodapp.dto.AdminStatsResponse;
import com.foodapp.dto.FoodItemReviewResponse;
import com.foodapp.dto.UpdateRestaurantRequest;
import com.foodapp.entity.Restaurant;
import com.foodapp.service.FoodItemReviewService;
import com.foodapp.service.OrderService;
import com.foodapp.service.RestaurantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;
    private final OrderService orderService;
    private final FoodItemReviewService foodItemReviewService;

    public RestaurantController(RestaurantService restaurantService, OrderService orderService, FoodItemReviewService foodItemReviewService) {
        this.restaurantService = restaurantService;
        this.orderService = orderService;
        this.foodItemReviewService = foodItemReviewService;
    }

    @GetMapping
    public ResponseEntity<List<Restaurant>> getActiveRestaurants() {
        return ResponseEntity.ok(restaurantService.getActiveRestaurants());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantService.getAllRestaurants());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Restaurant> getRestaurantById(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Restaurant> addRestaurant(@RequestBody AddRestaurantRequest request) {
        Restaurant created = restaurantService.addRestaurant(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<Restaurant> approveRestaurant(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.approveRestaurant(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Restaurant> rejectRestaurant(@PathVariable Long id) {
        return ResponseEntity.ok(restaurantService.rejectRestaurant(id));
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Restaurant>> getRestaurantsByOwner(@PathVariable Long ownerId) {
        return ResponseEntity.ok(restaurantService.getRestaurantsByOwner(ownerId));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<FoodItemReviewResponse>> getRestaurantReviews(@PathVariable Long id) {
        return ResponseEntity.ok(foodItemReviewService.getReviewsByRestaurant(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Restaurant> updateRestaurant(
            @PathVariable Long id,
            @RequestBody UpdateRestaurantRequest request) {
        return ResponseEntity.ok(restaurantService.updateRestaurant(id, request));
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats() {
        List<Restaurant> all = restaurantService.getAllRestaurants();
        long approved = all.stream().filter(r -> "APPROVED".equals(String.valueOf(r.getStatus()))).count();
        long pending = all.stream().filter(r -> "PENDING".equals(String.valueOf(r.getStatus()))).count();
        List<?> orders = orderService.getAllOrders();
        long delivered = orders.stream()
            .filter(o -> {
                try {
                    var status = o.getClass().getMethod("getStatus").invoke(o);
                    return "DELIVERED".equals(String.valueOf(status));
                } catch (Exception e) { return false; }
            }).count();
        BigDecimal revenue = orders.stream()
            .map(o -> {
                try {
                    Object v = o.getClass().getMethod("getTotalPrice").invoke(o);
                    return v instanceof BigDecimal bd ? bd : BigDecimal.ZERO;
                } catch (Exception e) { return BigDecimal.ZERO; }
            }).reduce(BigDecimal.ZERO, BigDecimal::add);
        AdminStatsResponse stats = new AdminStatsResponse(
            0L,
            all.size(),
            approved,
            pending,
            orders.size(),
            revenue,
            delivered,
            orders.size() - delivered
        );
        return ResponseEntity.ok(stats);
    }
}

