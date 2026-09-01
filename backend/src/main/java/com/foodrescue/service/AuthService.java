package com.foodrescue.service;

import com.foodrescue.dto.AuthRequest;
import com.foodrescue.dto.AuthResponse;
import com.foodrescue.dto.RegisterRequest;
import com.foodrescue.exception.BadRequestException;
import com.foodrescue.exception.ConflictException;
import com.foodrescue.model.User;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.security.JwtTokenProvider;
import com.foodrescue.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse register(RegisterRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ConflictException("Email is already registered: " + cleanEmail);
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(cleanEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .phone(request.getPhone())
                .organization(request.getOrganization())
                .address(request.getAddress())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .fssaiNumber(request.getFssaiNumber())
                .vehicleType(request.getVehicleType())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user [{}] with role [{}]", savedUser.getEmail(), savedUser.getRole());

        // Authenticate immediately upon registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        String jwt = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .userId(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .organization(savedUser.getOrganization())
                .city(savedUser.getCity())
                .phone(savedUser.getPhone())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        String cleanEmail = request.getEmail().toLowerCase().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(cleanEmail, request.getPassword())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();
        String jwt = tokenProvider.generateToken(authentication);

        log.info("User [{}] logged in successfully", cleanEmail);

        return AuthResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .organization(user.getOrganization())
                .city(user.getCity())
                .phone(user.getPhone())
                .build();
    }
}
