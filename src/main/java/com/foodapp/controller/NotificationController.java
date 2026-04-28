package com.foodapp.controller;

import com.foodapp.entity.Notification;
import com.foodapp.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/{type}/{id}")
    public ResponseEntity<List<Notification>> getFor(@PathVariable String type, @PathVariable Long id) {
        return ResponseEntity.ok(notificationRepository.findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc(type.toUpperCase(), id));
    }
}
