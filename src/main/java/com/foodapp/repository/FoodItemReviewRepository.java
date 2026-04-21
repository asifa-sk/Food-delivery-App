package com.foodapp.repository;

import com.foodapp.entity.FoodItemReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodItemReviewRepository extends JpaRepository<FoodItemReview, Long> {

    List<FoodItemReview> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<FoodItemReview> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<FoodItemReview> findByOrderItemId(Long orderItemId);

    @Query("select coalesce(avg(r.rating), 0) from FoodItemReview r where r.foodItem.id = :foodItemId")
    Double findAverageRatingByFoodItemId(Long foodItemId);

    long countByFoodItemId(Long foodItemId);

    @Query("select coalesce(avg(r.rating), 0) from FoodItemReview r where r.restaurant.id = :restaurantId")
    Double findAverageRatingByRestaurantId(Long restaurantId);

    long countByRestaurantId(Long restaurantId);
}
