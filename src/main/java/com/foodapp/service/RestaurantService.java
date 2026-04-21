package com.foodapp.service;

import com.foodapp.dto.AddRestaurantRequest;
import com.foodapp.dto.UpdateRestaurantRequest;
import com.foodapp.entity.Restaurant;
import com.foodapp.entity.User;
import com.foodapp.entity.enums.RestaurantStatus;
import com.foodapp.repository.RestaurantRepository;
import com.foodapp.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public RestaurantService(RestaurantRepository restaurantRepository, UserRepository userRepository) {
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    public List<Restaurant> getActiveRestaurants() {
        return restaurantRepository.findByActiveTrue();
    }

    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    public Restaurant getById(Long id) {
        return restaurantRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + id));
    }

    public Restaurant addRestaurant(AddRestaurantRequest request) {
        Restaurant restaurant = new Restaurant();
        restaurant.setName(request.getName());
        restaurant.setAddress(request.getAddress());
        restaurant.setContactNumber(request.getContactNumber());
        restaurant.setImageUrl(request.getImageUrl());
        restaurant.setLatitude(request.getLatitude());
        restaurant.setLongitude(request.getLongitude());
        restaurant.setCuisineType(request.getCuisineType());
        restaurant.setActive(true);
        restaurant.setStatus(RestaurantStatus.PENDING);

        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId())
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + request.getOwnerId()));
            restaurant.setOwner(owner);
        }

        return restaurantRepository.save(restaurant);
    }

    public Restaurant approveRestaurant(Long id) {
        Restaurant restaurant = getById(id);
        restaurant.setStatus(RestaurantStatus.APPROVED);
        restaurant.setActive(true);
        return restaurantRepository.save(restaurant);
    }

    public Restaurant rejectRestaurant(Long id) {
        Restaurant restaurant = getById(id);
        restaurant.setStatus(RestaurantStatus.REJECTED);
        restaurant.setActive(false);
        return restaurantRepository.save(restaurant);
    }

    public List<Restaurant> getRestaurantsByOwner(Long ownerId) {
        return restaurantRepository.findByOwnerId(ownerId);
    }

    public List<Restaurant> getApprovedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.APPROVED);
    }

    public List<Restaurant> getPendingRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.PENDING);
    }

    public Restaurant updateRestaurant(Long id, UpdateRestaurantRequest request) {
        Restaurant restaurant = getById(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            restaurant.setName(request.getName());
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            restaurant.setAddress(request.getAddress());
        }
        if (request.getContactNumber() != null && !request.getContactNumber().isBlank()) {
            restaurant.setContactNumber(request.getContactNumber());
        }
        if (request.getImageUrl() != null) {
            restaurant.setImageUrl(request.getImageUrl());
        }
        if (request.getLatitude() != null) {
            restaurant.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            restaurant.setLongitude(request.getLongitude());
        }
        if (request.getCuisineType() != null) {
            restaurant.setCuisineType(request.getCuisineType());
        }
        return restaurantRepository.save(restaurant);
    }
}

