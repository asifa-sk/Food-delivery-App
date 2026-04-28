package com.foodapp.service;

import com.foodapp.dto.DeliveryTrackingResponse;
import com.foodapp.dto.TrackingLocation;
import com.foodapp.entity.Order;
import com.foodapp.entity.enums.OrderStatus;
import com.foodapp.repository.OrderRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
public class DeliveryTrackingService {

    private static final BigDecimal NEARBY_THRESHOLD_KM = BigDecimal.valueOf(0.80d);
    private static final int DEFAULT_ETA_MINUTES = 30;

    private final OrderRepository orderRepository;
    private final RedisDeliveryTrackingStore redisDeliveryTrackingStore;
    private final DeliveryTrackingBroadcaster deliveryTrackingBroadcaster;

    public DeliveryTrackingService(
            OrderRepository orderRepository,
            RedisDeliveryTrackingStore redisDeliveryTrackingStore,
            DeliveryTrackingBroadcaster deliveryTrackingBroadcaster) {
        this.orderRepository = orderRepository;
        this.redisDeliveryTrackingStore = redisDeliveryTrackingStore;
        this.deliveryTrackingBroadcaster = deliveryTrackingBroadcaster;
    }

    public DeliveryTrackingResponse getTrackingSnapshotForCustomer(Long customerId, Long orderId) {
        Order order = orderRepository.findByIdAndCustomerId(orderId, customerId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Order not found with id: " + orderId + " for customer: " + customerId));

        DeliveryTrackingResponse redisSnapshot = redisDeliveryTrackingStore.getSnapshot(orderId);
        if (redisSnapshot != null) {
            DeliveryTrackingResponse refreshedSnapshot = refreshSnapshotStaticLocations(redisSnapshot, order);
            if (refreshedSnapshot != redisSnapshot) {
                redisDeliveryTrackingStore.saveSnapshot(refreshedSnapshot);
            }
            return refreshedSnapshot;
        }

        DeliveryTrackingResponse fallbackSnapshot = buildTrackingResponse(order, null);
        redisDeliveryTrackingStore.saveSnapshot(fallbackSnapshot);
        return fallbackSnapshot;
    }

    public DeliveryTrackingResponse buildTrackingResponse(Order order, String notificationMessage) {
        DeliveryTrackingResponse response = new DeliveryTrackingResponse();
        response.setOrderId(order.getId());
        response.setCustomerId(order.getCustomer() != null ? order.getCustomer().getId() : null);
        response.setDriverId(order.getDriver() != null ? order.getDriver().getId() : null);
        response.setDriverName(order.getDriver() != null ? order.getDriver().getName() : null);
        response.setRestaurantName(order.getRestaurant() != null ? order.getRestaurant().getName() : null);
        response.setDeliveryAddress(order.getDeliveryAddress());
        response.setStatus(order.getStatus());
        response.setDeliveryDistanceKm(scale(order.getDeliveryDistanceKm()));
        response.setDeliveryCharge(resolveDeliveryCharge(order));
        response.setEstimatedDeliveryMinutes(order.getEstimatedDeliveryMinutes());
        response.setDriverLocationUpdatedAt(order.getDriverLocationUpdatedAt());
        response.setDeliveredAt(order.getDeliveredAt());
        response.setRestaurantLocation(new TrackingLocation(
                resolveRestaurantLatitude(order),
                resolveRestaurantLongitude(order),
                "Restaurant"
        ));
        response.setCustomerLocation(new TrackingLocation(
                sanitizeCoordinate(order.getCustomerLatitude()),
                sanitizeCoordinate(order.getCustomerLongitude()),
                "Customer"
        ));
        response.setDriverLocation(new TrackingLocation(
                sanitizeCoordinate(order.getDriverLastLatitude()),
                sanitizeCoordinate(order.getDriverLastLongitude()),
                "Driver"
        ));

        BigDecimal remainingDistance = calculateRemainingDistance(order);
        response.setRemainingDistanceKm(remainingDistance);
        response.setRemainingEtaMinutes(estimateEtaMinutes(remainingDistance, order.getEstimatedDeliveryMinutes(), order.getStatus()));

        boolean nearby = remainingDistance != null
                && remainingDistance.compareTo(NEARBY_THRESHOLD_KM) <= 0
                && order.getStatus() == OrderStatus.OUT_FOR_DELIVERY;
        response.setNearby(nearby);
        response.setNotificationMessage(notificationMessage);
        return response;
    }

    public void publishTrackingUpdate(Order order, String notificationMessage) {
        DeliveryTrackingResponse response = buildTrackingResponse(order, notificationMessage);
        boolean cached = redisDeliveryTrackingStore.saveSnapshot(response);
        boolean published = redisDeliveryTrackingStore.publishSnapshot(response);

        if (!cached || !published) {
            deliveryTrackingBroadcaster.broadcast(response);
        }
    }

    private BigDecimal calculateRemainingDistance(Order order) {
        if (order.getStatus() == OrderStatus.DELIVERED) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (hasCoordinates(order.getDriverLastLatitude(), order.getDriverLastLongitude(), order.getCustomerLatitude(), order.getCustomerLongitude())) {
            return distanceKm(
                    order.getDriverLastLatitude(),
                    order.getDriverLastLongitude(),
                    order.getCustomerLatitude(),
                    order.getCustomerLongitude()
            );
        }

        BigDecimal restaurantLatitude = resolveRestaurantLatitude(order);
        BigDecimal restaurantLongitude = resolveRestaurantLongitude(order);

        if (hasCoordinates(restaurantLatitude, restaurantLongitude, order.getCustomerLatitude(), order.getCustomerLongitude())) {
            return distanceKm(
                    restaurantLatitude,
                    restaurantLongitude,
                    order.getCustomerLatitude(),
                    order.getCustomerLongitude()
            );
        }

        return scale(order.getDeliveryDistanceKm());
    }

    private Integer estimateEtaMinutes(BigDecimal remainingDistance, Integer fallbackEta, OrderStatus status) {
        if (status == OrderStatus.DELIVERED) {
            return 0;
        }
        if (remainingDistance == null) {
            return DEFAULT_ETA_MINUTES;
        }
        int minutes = (int) Math.ceil((remainingDistance.doubleValue() / 22.0d) * 60.0d);
        if (minutes <= 0 || minutes > 180) {
            return DEFAULT_ETA_MINUTES;
        }
        return Math.max(minutes, 2);
    }

    private BigDecimal resolveDeliveryCharge(Order order) {
        BigDecimal distanceKm = scale(order.getDeliveryDistanceKm());
        BigDecimal storedCharge = scale(order.getDeliveryCharge());
        BigDecimal computedCharge = calculateDeliveryCharge(distanceKm);

        if (storedCharge == null || storedCharge.compareTo(BigDecimal.ZERO) < 0 || storedCharge.compareTo(BigDecimal.valueOf(500)) > 0) {
            return computedCharge;
        }
        return storedCharge;
    }

    private BigDecimal calculateDeliveryCharge(BigDecimal distanceKm) {
        if (distanceKm == null || distanceKm.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.TEN.setScale(2, RoundingMode.HALF_UP);
        }
        if (distanceKm.compareTo(BigDecimal.valueOf(5)) <= 0) {
            return BigDecimal.TEN.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal extraDistance = distanceKm.subtract(BigDecimal.valueOf(5));
        return BigDecimal.TEN.add(extraDistance).setScale(2, RoundingMode.HALF_UP);
    }

    private boolean hasCoordinates(BigDecimal startLat, BigDecimal startLng, BigDecimal endLat, BigDecimal endLng) {
        return sanitizeCoordinate(startLat) != null
                && sanitizeCoordinate(startLng) != null
                && sanitizeCoordinate(endLat) != null
                && sanitizeCoordinate(endLng) != null;
    }

    private BigDecimal distanceKm(BigDecimal startLat, BigDecimal startLng, BigDecimal endLat, BigDecimal endLng) {
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

    private BigDecimal scale(BigDecimal value) {
        return value == null ? null : value.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal sanitizeCoordinate(BigDecimal value) {
        if (value == null || value.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return value;
    }

    private BigDecimal resolveRestaurantLatitude(Order order) {
        if (order.getRestaurant() != null) {
            BigDecimal restaurantValue = sanitizeCoordinate(order.getRestaurant().getLatitude());
            if (restaurantValue != null) {
                return restaurantValue;
            }
        }
        BigDecimal storedValue = sanitizeCoordinate(order.getRestaurantLatitude());
        if (storedValue != null) {
            return storedValue;
        }
        return null;
    }

    private BigDecimal resolveRestaurantLongitude(Order order) {
        if (order.getRestaurant() != null) {
            BigDecimal restaurantValue = sanitizeCoordinate(order.getRestaurant().getLongitude());
            if (restaurantValue != null) {
                return restaurantValue;
            }
        }
        BigDecimal storedValue = sanitizeCoordinate(order.getRestaurantLongitude());
        if (storedValue != null) {
            return storedValue;
        }
        return null;
    }

    private DeliveryTrackingResponse refreshSnapshotStaticLocations(DeliveryTrackingResponse snapshot, Order order) {
        BigDecimal restaurantLatitude = resolveRestaurantLatitude(order);
        BigDecimal restaurantLongitude = resolveRestaurantLongitude(order);
        BigDecimal customerLatitude = sanitizeCoordinate(order.getCustomerLatitude());
        BigDecimal customerLongitude = sanitizeCoordinate(order.getCustomerLongitude());

        boolean restaurantNeedsRefresh = restaurantLatitude != null
                && restaurantLongitude != null
                && !matches(snapshot.getRestaurantLocation(), restaurantLatitude, restaurantLongitude);
        boolean customerNeedsRefresh = customerLatitude != null
                && customerLongitude != null
                && !matches(snapshot.getCustomerLocation(), customerLatitude, customerLongitude);

        if (!restaurantNeedsRefresh && !customerNeedsRefresh) {
            return snapshot;
        }

        DeliveryTrackingResponse refreshed = copySnapshot(snapshot);
        if (restaurantNeedsRefresh) {
            refreshed.setRestaurantLocation(new TrackingLocation(
                    restaurantLatitude,
                    restaurantLongitude,
                    "Restaurant"
            ));
        }
        if (customerNeedsRefresh) {
            refreshed.setCustomerLocation(new TrackingLocation(
                    customerLatitude,
                    customerLongitude,
                    "Customer"
            ));
        }
        return refreshed;
    }

    private boolean matches(TrackingLocation location, BigDecimal latitude, BigDecimal longitude) {
        if (location == null) {
            return false;
        }

        BigDecimal currentLatitude = sanitizeCoordinate(location.getLatitude());
        BigDecimal currentLongitude = sanitizeCoordinate(location.getLongitude());
        if (currentLatitude == null || currentLongitude == null) {
            return false;
        }

        return currentLatitude.compareTo(latitude) == 0 && currentLongitude.compareTo(longitude) == 0;
    }

    private DeliveryTrackingResponse copySnapshot(DeliveryTrackingResponse snapshot) {
        DeliveryTrackingResponse copy = new DeliveryTrackingResponse();
        copy.setOrderId(snapshot.getOrderId());
        copy.setCustomerId(snapshot.getCustomerId());
        copy.setDriverId(snapshot.getDriverId());
        copy.setDriverName(snapshot.getDriverName());
        copy.setRestaurantName(snapshot.getRestaurantName());
        copy.setDeliveryAddress(snapshot.getDeliveryAddress());
        copy.setStatus(snapshot.getStatus());
        copy.setDeliveryDistanceKm(snapshot.getDeliveryDistanceKm());
        copy.setRemainingDistanceKm(snapshot.getRemainingDistanceKm());
        copy.setEstimatedDeliveryMinutes(snapshot.getEstimatedDeliveryMinutes());
        copy.setRemainingEtaMinutes(snapshot.getRemainingEtaMinutes());
        copy.setDriverLocationUpdatedAt(snapshot.getDriverLocationUpdatedAt());
        copy.setDeliveryCharge(snapshot.getDeliveryCharge());
        copy.setNearby(snapshot.isNearby());
        copy.setNotificationMessage(snapshot.getNotificationMessage());
        copy.setDeliveredAt(snapshot.getDeliveredAt());
        copy.setRestaurantLocation(snapshot.getRestaurantLocation());
        copy.setCustomerLocation(snapshot.getCustomerLocation());
        copy.setDriverLocation(snapshot.getDriverLocation());
        return copy;
    }
}
