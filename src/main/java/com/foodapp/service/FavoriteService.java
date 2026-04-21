package com.foodapp.service;

import com.foodapp.entity.FavoriteRestaurant;
import com.foodapp.entity.Restaurant;
import com.foodapp.entity.User;
import com.foodapp.repository.FavoriteRestaurantRepository;
import com.foodapp.repository.RestaurantRepository;
import com.foodapp.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteService {

    private final FavoriteRestaurantRepository favoriteRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;

    public FavoriteService(FavoriteRestaurantRepository favoriteRepository, UserRepository userRepository, RestaurantRepository restaurantRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public List<Restaurant> getFavoritesForUser(Long userId) {
        return favoriteRepository.findByUserId(userId).stream().map(FavoriteRestaurant::getRestaurant).collect(Collectors.toList());
    }

    public FavoriteRestaurant addFavorite(Long userId, Long restaurantId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Restaurant rest = restaurantRepository.findById(restaurantId).orElseThrow(() -> new IllegalArgumentException("Restaurant not found"));
        return favoriteRepository.findByUserIdAndRestaurantId(userId, restaurantId)
                .orElseGet(() -> {
                    FavoriteRestaurant fav = new FavoriteRestaurant();
                    fav.setUser(user);
                    fav.setRestaurant(rest);
                    return favoriteRepository.save(fav);
                });
    }

    public void removeFavorite(Long userId, Long restaurantId) {
        favoriteRepository.deleteByUserIdAndRestaurantId(userId, restaurantId);
    }
}
