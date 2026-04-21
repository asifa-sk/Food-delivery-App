package com.foodapp.controller;

import com.foodapp.dto.PlaceOrderRequest;
import com.foodapp.dto.QuickOrderRequest;
import com.foodapp.dto.OrderSummaryResponse;
import com.foodapp.dto.UpdateOrderStatusRequest;
import com.foodapp.entity.Order;
import com.foodapp.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * POST /api/orders
     * Places a new order and returns the created Order with HTTP 201.
     *
     * Example request body:
     * {
     *   "customerId": 1,
     *   "restaurantId": 2,
     *   "deliveryAddress": "123 Main St",
     *   "items": [
     *     { "foodItemId": 5, "quantity": 2 },
     *     { "foodItemId": 8, "quantity": 1 }
     *   ]
     * }
     */
    @PostMapping
    public ResponseEntity<Order> placeOrder(@RequestBody PlaceOrderRequest request) {
        if (request == null) throw new IllegalArgumentException("Request body is required.");
        if (request.getCustomerId() == null) throw new IllegalArgumentException("customerId is required.");
        if (request.getRestaurantId() == null) throw new IllegalArgumentException("restaurantId is required.");
        if (request.getItems() == null || request.getItems().isEmpty()) throw new IllegalArgumentException("items must be provided and non-empty.");

        // Ensure deliveryAddress is not null to satisfy DB not-null constraint
        if (request.getDeliveryAddress() == null || request.getDeliveryAddress().isBlank()) {
            request.setDeliveryAddress("Home");
        }

        Order createdOrder = orderService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @PostMapping("/quick")
    public ResponseEntity<Order> placeQuickOrder(@RequestBody QuickOrderRequest request) {
        Order createdOrder = orderService.placeQuickOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrder);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Order>> getOrdersByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId));
    }

    @GetMapping("/customer/{customerId}/summary")
    public ResponseEntity<OrderSummaryResponse> getOrderSummaryByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(orderService.getOrderSummaryByCustomer(customerId));
    }

    @GetMapping("/customer/{customerId}/track/{orderId}")
    public ResponseEntity<Order> getOrderByIdAndCustomer(@PathVariable Long customerId, @PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getOrderByIdAndCustomer(orderId, customerId));
    }

    @PatchMapping("/customer/{customerId}/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long customerId,
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(orderId, customerId, request.getStatus()));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Order>> getOrdersByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(orderService.getOrdersByRestaurant(restaurantId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatusAdmin(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatusAdmin(orderId, request.getStatus()));
    }
}

