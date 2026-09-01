package com.foodrescue.dto;

import lombok.Data;

@Data
public class ClaimRequestDto {
    private String message;
    private Integer requestedQuantity;
    private String customDropoffAddress;
    private Double dropoffLatitude;
    private Double dropoffLongitude;
}
