package com.foodrescue.dto;

import com.foodrescue.model.FoodType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DonationRequestDto {
    @NotBlank(message = "Food title is required")
    private String title;

    private String description;

    @NotNull(message = "Food type is required")
    private FoodType foodType;

    @NotNull(message = "Quantity (servings) is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private Double weightKg;
    private String vegNonVeg; // PURE_VEG, NON_VEG, EGG
    private String donorType;

    private LocalDateTime preparedAt;

    @NotNull(message = "Expiry time is required")
    @Future(message = "Expiry time must be in the future")
    private LocalDateTime expiryTime;

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    private String city;
    private String locality;

    @NotNull(message = "Latitude is required for map matching")
    private Double latitude;

    @NotNull(message = "Longitude is required for map matching")
    private Double longitude;

    private String imageUrl;
}
