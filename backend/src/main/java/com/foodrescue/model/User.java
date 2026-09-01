package com.foodrescue.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String phone;

    private Role role;

    private String organization;

    private String address;

    private String city;

    private Double latitude;

    private Double longitude;

    private String fssaiNumber; // Food Safety and Standards Authority of India license

    private String vehicleType; // For volunteers: Bike, Scooter, Car, Van

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
