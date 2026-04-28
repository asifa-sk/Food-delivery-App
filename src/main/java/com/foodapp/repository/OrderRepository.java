package com.foodapp.repository;

import com.foodapp.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerId(Long customerId);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<Order> findByIdAndCustomerId(Long id, Long customerId);

    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);

    List<Order> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    List<Order> findByDriverIsNullAndStatus(com.foodapp.entity.enums.OrderStatus status);

    List<Order> findByDriverIsNullAndStatusIn(java.util.List<com.foodapp.entity.enums.OrderStatus> statuses);

    List<Order> findByDriverIsNullAndStatusNotIn(java.util.List<com.foodapp.entity.enums.OrderStatus> statuses);
}
