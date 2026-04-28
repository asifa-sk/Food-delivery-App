package com.foodapp.service;

import com.foodapp.dto.DeliveryTrackingResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RedisDeliveryTrackingStore {

    private final RedisTemplate<String, Object> redisTemplate;
    private final String trackingKeyPrefix;
    private final String trackingChannel;
    private final Duration trackingTtl;

    public RedisDeliveryTrackingStore(
            RedisTemplate<String, Object> redisTemplate,
            @Value("${app.tracking.redis.key-prefix:tracking:order:}") String trackingKeyPrefix,
            @Value("${app.tracking.redis.channel:tracking:orders:updates}") String trackingChannel,
            @Value("${app.tracking.redis.ttl-minutes:180}") long ttlMinutes) {
        this.redisTemplate = redisTemplate;
        this.trackingKeyPrefix = trackingKeyPrefix;
        this.trackingChannel = trackingChannel;
        this.trackingTtl = Duration.ofMinutes(ttlMinutes);
    }

    public DeliveryTrackingResponse getSnapshot(Long orderId) {
        if (orderId == null) {
            return null;
        }

        try {
            Object value = redisTemplate.opsForValue().get(buildOrderKey(orderId));
            return value instanceof DeliveryTrackingResponse trackingResponse ? trackingResponse : null;
        } catch (RedisConnectionFailureException ex) {
            return null;
        }
    }

    public boolean saveSnapshot(DeliveryTrackingResponse response) {
        if (response == null || response.getOrderId() == null) {
            return false;
        }

        try {
            redisTemplate.opsForValue().set(buildOrderKey(response.getOrderId()), response, trackingTtl);
            return true;
        } catch (RedisConnectionFailureException ex) {
            return false;
        }
    }

    public boolean publishSnapshot(DeliveryTrackingResponse response) {
        if (response == null || response.getOrderId() == null) {
            return false;
        }

        try {
            redisTemplate.convertAndSend(trackingChannel, response);
            return true;
        } catch (RedisConnectionFailureException ex) {
            return false;
        }
    }

    private String buildOrderKey(Long orderId) {
        return trackingKeyPrefix + orderId;
    }
}
