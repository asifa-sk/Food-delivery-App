package com.foodapp.service;

import com.foodapp.dto.AddFoodItemRequest;
import com.foodapp.entity.FoodItem;
import com.foodapp.entity.Restaurant;
import com.foodapp.repository.FoodItemRepository;
import com.foodapp.repository.RestaurantRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodItemService {

    private final FoodItemRepository foodItemRepository;
    private final RestaurantRepository restaurantRepository;

    public FoodItemService(FoodItemRepository foodItemRepository, RestaurantRepository restaurantRepository) {
        this.foodItemRepository = foodItemRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public List<FoodItem> getMenuByRestaurant(Long restaurantId) {
        return foodItemRepository.findByRestaurantIdAndAvailableTrue(restaurantId);
    }

    public List<FoodItem> getAllByRestaurant(Long restaurantId) {
        return foodItemRepository.findByRestaurantId(restaurantId);
    }

    public FoodItem addFoodItem(Long restaurantId, AddFoodItemRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));

        FoodItem item = new FoodItem();
        item.setRestaurant(restaurant);
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setCategory(request.getCategory());
        item.setImageUrl(request.getImageUrl());
        item.setAvailable(true);

        return foodItemRepository.save(item);
    }

    public FoodItem getById(Long id) {
        return foodItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Food item not found with id: " + id));
    }

    public void deleteFoodItem(Long id) {
        foodItemRepository.deleteById(id);
    }
}
