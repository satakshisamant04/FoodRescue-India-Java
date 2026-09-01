package com.foodrescue.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "pickups")
public class Pickup {

    @Id
    private String id;

    private String donationId;

    private String donationTitle;

    private Integer quantity;

    private String pickupAddress;

    private Double pickupLatitude;

    private Double pickupLongitude;

    private String dropoffAddress;

    private Double dropoffLatitude;

    private Double dropoffLongitude;

    private String donorName;

    private String donorPhone;

    private String ngoName;

    private String ngoPhone;

    private String volunteerId;

    private String volunteerName;

    private String volunteerPhone;

    @Builder.Default
    private PickupStatus status = PickupStatus.PENDING;

    private LocalDateTime assignedAt;

    private LocalDateTime pickedUpAt;

    private LocalDateTime deliveredAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
