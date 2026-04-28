package com.foodapp.config;

import com.foodapp.dto.DeliveryTrackingResponse;
import com.foodapp.service.DeliveryTrackingBroadcaster;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.stereotype.Component;

@Component
public class TrackingRedisSubscriber implements MessageListener {

    private final DeliveryTrackingBroadcaster deliveryTrackingBroadcaster;
    private final GenericJackson2JsonRedisSerializer serializer;

    public TrackingRedisSubscriber(
            DeliveryTrackingBroadcaster deliveryTrackingBroadcaster,
            GenericJackson2JsonRedisSerializer serializer) {
        this.deliveryTrackingBroadcaster = deliveryTrackingBroadcaster;
        this.serializer = serializer;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        Object payload = serializer.deserialize(message.getBody());
        if (payload instanceof DeliveryTrackingResponse trackingResponse) {
            deliveryTrackingBroadcaster.broadcast(trackingResponse);
        }
    }
}
