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
@Document(collection = "requests")
public class FoodRequest {

    @Id
    private String id;

    private String donationId;

    private String donationTitle;

    private String ngoId;

    private String ngoName;

    private String ngoPhone;

    private String ngoAddress;

    private Double ngoLatitude;

    private Double ngoLongitude;

    private Integer requestedQuantity;

    private String message;

    @Builder.Default
    private String status = "APPROVED"; // Simple auto-approve / claim workflow

    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();
}
