package com.foodrescue.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodDonationEvent implements Serializable {
    public enum EventType {
        FOOD_DONATION_CREATED,
        FOOD_DONATION_CLAIMED,
        FOOD_DONATION_PICKED_UP,
        FOOD_DONATION_COMPLETED,
        FOOD_DONATION_CANCELLED
    }

    private String eventId;
    private EventType eventType;
    private String donationId;
    private String title;
    private Integer quantity;
    private String donorName;
    private String city;
    private Double latitude;
    private Double longitude;
    private String claimedByNgoName;
    private String assignedVolunteerName;
    private String timestamp;
}
