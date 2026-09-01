package com.foodrescue.dto;

import com.foodrescue.model.Donation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponseDto {
    private Donation donation;
    private Double distanceKm; // Distance calculated from querying NGO/volunteer location
}
