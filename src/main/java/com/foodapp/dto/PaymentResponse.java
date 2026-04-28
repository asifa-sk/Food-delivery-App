package com.foodapp.dto;

public class PaymentResponse {

    private boolean success;
    private String paymentStatus;
    private String paymentReference;
    private String message;
    private String paymentPath;

    public PaymentResponse() {}

    public PaymentResponse(boolean success, String paymentStatus, String paymentReference, String message, String paymentPath) {
        this.success = success;
        this.paymentStatus = paymentStatus;
        this.paymentReference = paymentReference;
        this.message = message;
        this.paymentPath = paymentPath;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getPaymentPath() { return paymentPath; }
    public void setPaymentPath(String paymentPath) { this.paymentPath = paymentPath; }
}
