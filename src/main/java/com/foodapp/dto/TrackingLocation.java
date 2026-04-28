package com.foodapp.dto;

import java.math.BigDecimal;

public class TrackingLocation {

    private BigDecimal latitude;
    private BigDecimal longitude;
    private String label;

    public TrackingLocation() {
    }

    public TrackingLocation(BigDecimal latitude, BigDecimal longitude, String label) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.label = label;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
