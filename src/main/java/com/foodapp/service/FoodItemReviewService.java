package com.foodapp.service;

import com.foodapp.dto.FoodItemReviewRequest;
import com.foodapp.dto.FoodItemReviewResponse;
import com.foodapp.entity.FoodItem;
import com.foodapp.entity.FoodItemReview;
import com.foodapp.entity.Order;
import com.foodapp.entity.OrderItem;
import com.foodapp.entity.Restaurant;
import com.foodapp.entity.User;
import com.foodapp.entity.enums.OrderStatus;
import com.foodapp.repository.FoodItemRepository;
import com.foodapp.repository.FoodItemReviewRepository;
import com.foodapp.repository.OrderItemRepository;
import com.foodapp.repository.OrderRepository;
import com.foodapp.repository.RestaurantRepository;
import com.foodapp.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class FoodItemReviewService {

    private final FoodItemReviewRepository foodItemReviewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final FoodItemRepository foodItemRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;

    public FoodItemReviewService(
            FoodItemReviewRepository foodItemReviewRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            FoodItemRepository foodItemRepository,
            RestaurantRepository restaurantRepository,
            UserRepository userRepository) {
        this.foodItemReviewRepository = foodItemReviewRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.foodItemRepository = foodItemRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public FoodItemReviewResponse saveReview(FoodItemReviewRequest request) {
        if (request.getCustomerId() == null || request.getOrderId() == null || request.getOrderItemId() == null) {
            throw new IllegalArgumentException("customerId, orderId, and orderItemId are required.");
        }
        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new EntityNotFoundException("Customer not found with id: " + request.getCustomerId()));

        Order order = orderRepository.findByIdAndCustomerId(request.getOrderId(), request.getCustomerId())
                .orElseThrow(() -> new EntityNotFoundException("Order not found for this customer."));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Reviews can only be added after delivery.");
        }

        OrderItem orderItem = orderItemRepository.findByIdAndOrderId(request.getOrderItemId(), order.getId())
                .orElseThrow(() -> new EntityNotFoundException("Order item not found for this order."));

        FoodItem foodItem = orderItem.getFoodItem();
        if (request.getFoodItemId() != null && !request.getFoodItemId().equals(foodItem.getId())) {
            throw new IllegalArgumentException("Selected food item does not match the order item.");
        }

        Restaurant restaurant = order.getRestaurant();

        FoodItemReview review = foodItemReviewRepository.findByOrderItemId(orderItem.getId())
                .orElseGet(FoodItemReview::new);
        review.setOrder(order);
        review.setOrderItem(orderItem);
        review.setFoodItem(foodItem);
        review.setRestaurant(restaurant);
        review.setCustomer(customer);
        review.setRating(request.getRating());
        review.setComment(normalizeComment(request.getComment()));

        FoodItemReview saved = foodItemReviewRepository.save(review);
        refreshAggregates(foodItem.getId(), restaurant.getId());
        return mapToResponse(saved);
    }

    public List<FoodItemReviewResponse> getReviewsByRestaurant(Long restaurantId) {
        return foodItemReviewRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<FoodItemReviewResponse> getReviewsByCustomer(Long customerId) {
        return foodItemReviewRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private String normalizeComment(String comment) {
        if (comment == null) return null;
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Transactional
    protected void refreshAggregates(Long foodItemId, Long restaurantId) {
        FoodItem foodItem = foodItemRepository.findById(foodItemId)
                .orElseThrow(() -> new EntityNotFoundException("Food item not found with id: " + foodItemId));
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new EntityNotFoundException("Restaurant not found with id: " + restaurantId));

        Double foodAverage = foodItemReviewRepository.findAverageRatingByFoodItemId(foodItemId);
        long foodReviewCount = foodItemReviewRepository.countByFoodItemId(foodItemId);
        foodItem.setRating(scaleRating(foodAverage));
        foodItem.setReviewCount((int) foodReviewCount);
        foodItemRepository.save(foodItem);

        Double restaurantAverage = foodItemReviewRepository.findAverageRatingByRestaurantId(restaurantId);
        restaurant.setRating(scaleRating(restaurantAverage));
        restaurantRepository.save(restaurant);
    }

    private BigDecimal scaleRating(Double value) {
        double safeValue = value == null ? 0D : value;
        return BigDecimal.valueOf(safeValue).setScale(2, RoundingMode.HALF_UP);
    }

    private FoodItemReviewResponse mapToResponse(FoodItemReview review) {
        FoodItemReviewResponse response = new FoodItemReviewResponse();
        response.setId(review.getId());
        response.setOrderId(review.getOrder().getId());
        response.setOrderItemId(review.getOrderItem().getId());
        response.setFoodItemId(review.getFoodItem().getId());
        response.setFoodItemName(review.getFoodItem().getName());
        response.setRestaurantId(review.getRestaurant().getId());
        response.setRestaurantName(review.getRestaurant().getName());
        response.setCustomerId(review.getCustomer().getId());
        response.setCustomerName(review.getCustomer().getName());
        response.setCustomerEmail(review.getCustomer().getEmail());
        response.setRating(review.getRating());
        response.setComment(review.getComment());
        response.setCreatedAt(review.getCreatedAt());
        response.setUpdatedAt(review.getUpdatedAt());
        return response;
    }
}
