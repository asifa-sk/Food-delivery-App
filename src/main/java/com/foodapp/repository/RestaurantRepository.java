package com.foodapp.repository;

import com.foodapp.entity.Restaurant;
import com.foodapp.entity.enums.RestaurantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    List<Restaurant> findByActiveTrue();

    Optional<Restaurant> findByNameIgnoreCase(String name);

    List<Restaurant> findByOwnerId(Long ownerId);

    List<Restaurant> findByStatus(RestaurantStatus status);
}
