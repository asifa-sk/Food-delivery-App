package com.foodapp.controller;

import com.foodapp.entity.Restaurant;
import com.foodapp.service.FavoriteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public ResponseEntity<List<Restaurant>> listFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(favoriteService.getFavoritesForUser(userId));
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(@PathVariable Long userId, @RequestBody FavoriteRequest req) {
        try {
            favoriteService.addFavorite(userId, req.getRestaurantId());
            return ResponseEntity.status(201).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{restaurantId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long userId, @PathVariable Long restaurantId) {
        favoriteService.removeFavorite(userId, restaurantId);
        return ResponseEntity.noContent().build();
    }

    public static class FavoriteRequest {
        private Long restaurantId;
        public Long getRestaurantId() { return restaurantId; }
        public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    }
}
