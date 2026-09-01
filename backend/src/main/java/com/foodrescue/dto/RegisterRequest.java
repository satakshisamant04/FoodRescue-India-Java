package com.foodrescue.dto;

import com.foodrescue.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Role is required (ROLE_DONOR, ROLE_NGO, ROLE_VOLUNTEER)")
    private Role role;

    private String phone;
    private String organization;
    private String address;
    private String city;
    private Double latitude;
    private Double longitude;
    private String fssaiNumber;
    private String vehicleType;
}
