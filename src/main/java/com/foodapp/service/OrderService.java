package com.foodapp.service;

import com.foodapp.dto.OrderItemRequest;
import com.foodapp.dto.OrderSummaryResponse;
import com.foodapp.dto.PlaceOrderRequest;
import com.foodapp.dto.QuickOrderRequest;
import com.foodapp.entity.*;
import com.foodapp.entity.enums.OrderStatus;
import com.foodapp.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final FoodItemRepository foodItemRepository;

    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        UserRepository userRepository,
                        RestaurantRepository restaurantRepository,
                        FoodItemRepository foodItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.foodItemRepository = foodItemRepository;
    }

    /**
     * Places a new order.
     * The Order row is inserted first (generating the primary key), then every
     * OrderItem row is inserted referencing that key. If any step fails the
     * entire transaction is rolled back.
     */
    @Transactional
    public Order placeOrder(PlaceOrderRequest request) {

        // Step 1: Validate customer
        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Customer not found with id: " + request.getCustomerId()));

        // Step 2: Validate restaurant
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Restaurant not found with id: " + request.getRestaurantId()));

        // Step 3: Persist the Order first to generate the order_id
        Order order = new Order();
        order.setCustomer(customer);
        order.setRestaurant(restaurant);
        order.setDeliveryAddress(request.getDeliveryAddress());
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(normalizePaymentMethod(request.getPaymentMethod()));
        order.setPaymentStatus(
                request.getPaymentStatus() == null || request.getPaymentStatus().isBlank()
                        ? "PENDING"
                        : request.getPaymentStatus().trim().toUpperCase(Locale.ROOT)
        );
        order.setPaymentReference(request.getPaymentReference());
        order.setCustomerLatitude(request.getCustomerLatitude());
        order.setCustomerLongitude(request.getCustomerLongitude());
        order.setRestaurantLatitude(restaurant.getLatitude());
        order.setRestaurantLongitude(restaurant.getLongitude());
        applyDeliveryMetrics(order, request, restaurant);
        order.setTotalPrice(BigDecimal.ZERO);

        Order savedOrder = orderRepository.save(order);   // INSERT -> order_id is now available

        // Step 4: Build OrderItems using the generated order_id
        BigDecimal totalPrice = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequest itemRequest : request.getItems()) {
            FoodItem foodItem = foodItemRepository.findById(itemRequest.getFoodItemId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Food item not found with id: " + itemRequest.getFoodItemId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);               // foreign key = generated order_id
            orderItem.setFoodItem(foodItem);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(foodItem.getPrice());

            orderItems.add(orderItem);
            totalPrice = totalPrice.add(
                    foodItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
        }

        orderItemRepository.saveAll(orderItems);          // INSERT all OrderItems

        // Step 5: Update total price on the saved order
        savedOrder.setTotalPrice(totalPrice);
        savedOrder.setOrderItems(orderItems);

        return orderRepository.save(savedOrder);          // UPDATE total_price
    }

    private String normalizePaymentMethod(String paymentMethod) {
        if (paymentMethod == null || paymentMethod.isBlank()) {
            return "cash_on_delivery";
        }

        String normalized = paymentMethod.trim().toLowerCase(Locale.ROOT);
        if ("upi".equals(normalized)) {
            // Persist UPI under the broader online bucket to stay compatible with older schema/data expectations.
            return "online";
        }
        if ("cash".equals(normalized) || "cod".equals(normalized)) {
            return "cash_on_delivery";
        }
        return normalized;
    }

        @Transactional
        public Order placeQuickOrder(QuickOrderRequest request) {
                if (request.getCustomerId() == null) {
                        throw new IllegalArgumentException("customerId is required.");
                }

                User customer = userRepository.findById(request.getCustomerId())
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Customer not found with id: " + request.getCustomerId()));

                String restaurantName = request.getRestaurantName() == null
                                ? "Unknown Restaurant"
                                : request.getRestaurantName().trim();

                Restaurant restaurant = restaurantRepository.findByNameIgnoreCase(restaurantName)
                                .orElseGet(() -> {
                                        Restaurant newRestaurant = new Restaurant();
                                        newRestaurant.setName(restaurantName.isEmpty() ? "Unknown Restaurant" : restaurantName);
                                        newRestaurant.setAddress("Not provided");
                                        newRestaurant.setContactNumber("NA");
                                        newRestaurant.setActive(true);
                                        // owner required by DB — use customer as placeholder owner
                                        newRestaurant.setOwner(customer);
                                        return restaurantRepository.save(newRestaurant);
                                });

                Order order = new Order();
                order.setCustomer(customer);
                order.setRestaurant(restaurant);
                order.setDeliveryAddress(
                                request.getDeliveryAddress() == null || request.getDeliveryAddress().isBlank()
                                                ? "Home"
                                                : request.getDeliveryAddress().trim());
                order.setStatus(OrderStatus.PENDING);
                order.setPaymentMethod("cash_on_delivery");
                order.setPaymentStatus("PENDING");
                order.setTotalPrice(request.getTotalPrice() == null ? BigDecimal.ZERO : request.getTotalPrice());
                order.setRestaurantLatitude(restaurant.getLatitude());
                order.setRestaurantLongitude(restaurant.getLongitude());

                return orderRepository.save(order);
        }

        private void applyDeliveryMetrics(Order order, PlaceOrderRequest request, Restaurant restaurant) {
                BigDecimal restaurantLatitude = restaurant.getLatitude();
                BigDecimal restaurantLongitude = restaurant.getLongitude();
                BigDecimal customerLatitude = request.getCustomerLatitude();
                BigDecimal customerLongitude = request.getCustomerLongitude();

                BigDecimal computedDistance = null;
                if (restaurantLatitude != null && restaurantLongitude != null && customerLatitude != null && customerLongitude != null) {
                        computedDistance = calculateDistanceKm(restaurantLatitude, restaurantLongitude, customerLatitude, customerLongitude);
                } else if (request.getDeliveryDistanceKm() != null) {
                        computedDistance = request.getDeliveryDistanceKm().setScale(2, RoundingMode.HALF_UP);
                }

                if (computedDistance != null) {
                        order.setDeliveryDistanceKm(computedDistance);
                        order.setDeliveryCharge(calculateDeliveryCharge(computedDistance));
                        order.setEstimatedDeliveryMinutes(estimateDeliveryMinutes(computedDistance));
                } else {
                        order.setDeliveryDistanceKm(null);
                        order.setDeliveryCharge(request.getDeliveryCharge());
                        order.setEstimatedDeliveryMinutes(request.getEstimatedDeliveryMinutes());
                }
        }

        private BigDecimal calculateDistanceKm(BigDecimal startLat, BigDecimal startLng, BigDecimal endLat, BigDecimal endLng) {
                double earthRadiusKm = 6371.0d;
                double latDistance = Math.toRadians(endLat.doubleValue() - startLat.doubleValue());
                double lngDistance = Math.toRadians(endLng.doubleValue() - startLng.doubleValue());
                double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                                + Math.cos(Math.toRadians(startLat.doubleValue()))
                                * Math.cos(Math.toRadians(endLat.doubleValue()))
                                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
                double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return BigDecimal.valueOf(earthRadiusKm * c).setScale(2, RoundingMode.HALF_UP);
        }

        private BigDecimal calculateDeliveryCharge(BigDecimal distanceKm) {
                if (distanceKm == null) {
                        return BigDecimal.valueOf(10).setScale(2, RoundingMode.HALF_UP);
                }
                BigDecimal base = BigDecimal.valueOf(10);
                BigDecimal extraDistance = distanceKm.subtract(BigDecimal.valueOf(5)).max(BigDecimal.ZERO);
                BigDecimal extraCharge = extraDistance.multiply(BigDecimal.ONE, MathContext.DECIMAL64);
                return base.add(extraCharge).setScale(2, RoundingMode.HALF_UP);
        }

        private Integer estimateDeliveryMinutes(BigDecimal distanceKm) {
                if (distanceKm == null) {
                        return 30;
                }
                double averageSpeedKmPerHour = 22.0d;
                int minutes = (int) Math.ceil((distanceKm.doubleValue() / averageSpeedKmPerHour) * 60.0d);
                return Math.max(minutes, 8);
        }

        public List<Order> getOrdersByCustomer(Long customerId) {
                return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        }

        public Order getOrderByIdAndCustomer(Long orderId, Long customerId) {
                return orderRepository.findByIdAndCustomerId(orderId, customerId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Order not found with id: " + orderId + " for customer: " + customerId));
        }

        @Transactional
        public Order updateOrderStatus(Long orderId, Long customerId, String status) {
                Order order = getOrderByIdAndCustomer(orderId, customerId);
                try {
                        order.setStatus(OrderStatus.valueOf(status.trim().toUpperCase()));
                } catch (Exception ex) {
                        throw new IllegalArgumentException("Invalid status: " + status);
                }
                return orderRepository.save(order);
        }

        public OrderSummaryResponse getOrderSummaryByCustomer(Long customerId) {
                List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);

                long totalOrders = orders.size();
                long deliveredOrders = orders.stream()
                                .filter(order -> order.getStatus() == OrderStatus.DELIVERED)
                                .count();
                long activeOrders = totalOrders - deliveredOrders;

                BigDecimal totalAmount = orders.stream()
                                .map(order -> order.getTotalPrice() == null ? BigDecimal.ZERO : order.getTotalPrice())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal pendingAmount = orders.stream()
                                .filter(order -> order.getStatus() != OrderStatus.DELIVERED)
                                .map(order -> order.getTotalPrice() == null ? BigDecimal.ZERO : order.getTotalPrice())
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal totalSaved = totalAmount
                                .multiply(BigDecimal.valueOf(0.10))
                                .setScale(2, RoundingMode.HALF_UP);

                return new OrderSummaryResponse(
                                totalOrders,
                                activeOrders,
                                deliveredOrders,
                                totalAmount,
                                totalSaved,
                                pendingAmount);
        }

        public List<Order> getOrdersByRestaurant(Long restaurantId) {
                return orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        }

        public List<Order> getAllOrders() {
                return orderRepository.findAll();
        }

        @Transactional
        public Order updateOrderStatusAdmin(Long orderId, String status) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + orderId));
                try {
                        OrderStatus newStatus = OrderStatus.valueOf(status.trim().toUpperCase());
                        if (newStatus == OrderStatus.ACCEPTED_BY_DRIVER
                                        || newStatus == OrderStatus.OUT_FOR_DELIVERY
                                        || newStatus == OrderStatus.DELIVERED) {
                                throw new IllegalArgumentException("Driver-owned delivery statuses can only be set by driver");
                        }
                        order.setStatus(newStatus);
                } catch (Exception ex) {
                        throw new IllegalArgumentException("Invalid status: " + status);
                }
                return orderRepository.save(order);
        }
}
