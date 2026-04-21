package com.foodapp.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("foodyy205@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Your OTP - Foodyy");
            message.setText(
                "Hello,\n\n" +
                "Your One-Time Password (OTP) for email verification is:\n\n" +
                "  " + otp + "\n\n" +
                "This OTP is valid for 10 minutes. Do not share it with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— Foodyy Team"
            );
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }

    public void sendLoginOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("foodyy205@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Your Login OTP - Foodyy");
            message.setText(
                "Hello,\n\n" +
                "Your One-Time Password (OTP) for login is:\n\n" +
                "  " + otp + "\n\n" +
                "This OTP is valid for 10 minutes. Do not share it with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— Foodyy Team"
            );
            mailSender.send(message);
            log.info("Login OTP email sent to {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send login OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send login OTP email. Please try again.");
        }
    }

    public void sendPasswordResetOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("foodyy205@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Your Password Reset OTP - Foodyy");
            message.setText(
                "Hello,\n\n" +
                "Your One-Time Password (OTP) to reset your password is:\n\n" +
                "  " + otp + "\n\n" +
                "This OTP is valid for 10 minutes. Do not share it with anyone.\n\n" +
                "If you did not request this, please secure your account immediately.\n\n" +
                "— Foodyy Team"
            );
            mailSender.send(message);
            log.info("Password reset OTP email sent to {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send password reset OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send password reset OTP email. Please try again.");
        }
    }
}
