package com.foodapp.service;

import com.foodapp.dto.DeliveryTrackingResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class DeliveryTrackingBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public DeliveryTrackingBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcast(DeliveryTrackingResponse response) {
        if (response == null || response.getOrderId() == null) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/orders/" + response.getOrderId() + "/tracking", response);

        if (response.getCustomerId() != null) {
            messagingTemplate.convertAndSend("/topic/customers/" + response.getCustomerId() + "/tracking", response);
        }
    }
}
