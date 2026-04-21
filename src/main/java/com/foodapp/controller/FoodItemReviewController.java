package com.foodapp.controller;

import com.foodapp.dto.FoodItemReviewRequest;
import com.foodapp.dto.FoodItemReviewResponse;
import com.foodapp.service.FoodItemReviewService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class FoodItemReviewController {

    private final FoodItemReviewService foodItemReviewService;

    public FoodItemReviewController(FoodItemReviewService foodItemReviewService) {
        this.foodItemReviewService = foodItemReviewService;
    }

    @PostMapping
    public ResponseEntity<FoodItemReviewResponse> saveReview(@RequestBody FoodItemReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(foodItemReviewService.saveReview(request));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<FoodItemReviewResponse>> getReviewsByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(foodItemReviewService.getReviewsByCustomer(customerId));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<FoodItemReviewResponse>> getReviewsByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(foodItemReviewService.getReviewsByRestaurant(restaurantId));
    }
}
