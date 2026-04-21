package com.foodapp.controller;

import com.foodapp.dto.AddFoodItemRequest;
import com.foodapp.entity.FoodItem;
import com.foodapp.service.FoodItemService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food")
public class FoodItemController {

    private final FoodItemService foodItemService;

    public FoodItemController(FoodItemService foodItemService) {
        this.foodItemService = foodItemService;
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<FoodItem>> getMenuByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(foodItemService.getMenuByRestaurant(restaurantId));
    }

    @GetMapping("/restaurant/{restaurantId}/all")
    public ResponseEntity<List<FoodItem>> getAllByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(foodItemService.getAllByRestaurant(restaurantId));
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<FoodItem> addFoodItem(
            @PathVariable Long restaurantId,
            @RequestBody AddFoodItemRequest request) {
        FoodItem created = foodItemService.addFoodItem(restaurantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFoodItem(@PathVariable Long id) {
        foodItemService.deleteFoodItem(id);
        return ResponseEntity.noContent().build();
    }
}
