package com.foodrescue.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "donations")
@CompoundIndex(def = "{'status': 1, 'city': 1}")
public class Donation implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    private String donorId;

    private String donorName;

    private String donorPhone;

    private String donorType; // Restaurant, Hotel, Event, Individual

    private String title;

    private String description;

    private FoodType foodType;

    private Integer quantity; // Servings

    private Double weightKg;

    private String vegNonVeg; // PURE_VEG, NON_VEG, EGG

    private LocalDateTime preparedAt;

    private LocalDateTime expiryTime;

    private String pickupAddress;

    private String city;

    private String locality;

    private Double latitude;

    private Double longitude;

    private String imageUrl;

    @Indexed
    @Builder.Default
    private DonationStatus status = DonationStatus.AVAILABLE;

    private String claimedByNgoId;

    private String claimedByNgoName;

    private LocalDateTime claimedAt;

    private String assignedVolunteerId;

    private String assignedVolunteerName;

    @Version
    private Long version; // Optimistic locking for atomic status transitions

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
