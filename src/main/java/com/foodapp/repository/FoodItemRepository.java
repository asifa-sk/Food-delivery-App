package com.foodapp.repository;

import com.foodapp.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    List<FoodItem> findByRestaurantIdAndAvailableTrue(Long restaurantId);

    List<FoodItem> findByRestaurantId(Long restaurantId);

    Optional<FoodItem> findByIdAndRestaurantId(Long id, Long restaurantId);
}
