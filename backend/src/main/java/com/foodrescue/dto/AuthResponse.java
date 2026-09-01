package com.foodrescue.dto;

import com.foodrescue.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private String userId;
    private String name;
    private String email;
    private Role role;
    private String organization;
    private String city;
    private String phone;
}
