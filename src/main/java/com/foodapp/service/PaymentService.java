package com.foodapp.service;

import com.foodapp.dto.PaymentRequest;
import com.foodapp.dto.PaymentResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

@Service
public class PaymentService {

    public PaymentResponse processPayment(PaymentRequest request) {
        String method = request.getPaymentMethod() == null
                ? "cash_on_delivery"
                : request.getPaymentMethod().trim().toLowerCase(Locale.ROOT);

        String stamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        if ("cash_on_delivery".equals(method)) {
            return new PaymentResponse(
                    true,
                    "PENDING",
                    "COD-" + stamp,
                    "Cash on delivery selected. Payment will be collected after delivery.",
                    null
            );
        }

        if ("upi".equals(method)) {
            String amount = request.getAmount() == null
                    ? "0.00"
                    : request.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString();
            String paymentRef = "UPI-" + stamp;
            String upiAddress = request.getUpiAddress() == null || request.getUpiAddress().isBlank()
                    ? "foodyy.pay@upi"
                    : request.getUpiAddress().trim();
            String paymentPath = String.format(
                    "upi://pay?pa=%s&pn=Foodyy&tr=%s&tn=Foodyy+Order+Payment&am=%s&cu=INR",
                    upiAddress.replace("@", "%40"),
                    paymentRef,
                    amount
            );
            return new PaymentResponse(
                    true,
                    "PAID",
                    paymentRef,
                    "UPI payment completed successfully.",
                    paymentPath
            );
        }

        return new PaymentResponse(
                true,
                "PAID",
                "PAY-" + stamp,
                "Payment processed successfully.",
                null
        );
    }
}
