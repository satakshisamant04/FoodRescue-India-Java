package com.foodrescue.controller;

import com.foodrescue.dto.ApiResponse;
import com.foodrescue.dto.DonationRequestDto;
import com.foodrescue.dto.DonationResponseDto;
import com.foodrescue.model.Donation;
import com.foodrescue.security.UserPrincipal;
import com.foodrescue.service.DonationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
public class DonationController {

    private final DonationService donationService;

    /**
     * Create food donation (DONOR role only)
     */
    @PostMapping
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<Donation>> createDonation(
            @Valid @RequestBody DonationRequestDto requestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Donation donation = donationService.createDonation(requestDto, userPrincipal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Food donation created successfully", donation));
    }

    /**
     * Fetch available donations with Redis caching (Public / All Roles)
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Donation>>> getAvailableDonations() {
        List<Donation> donations = donationService.getAvailableDonations();
        return ResponseEntity.ok(ApiResponse.ok(donations));
    }

    /**
     * Get nearby available donations sorted by Haversine distance from NGO coordinates
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<DonationResponseDto>>> getNearbyDonations(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "25.0") double radiusKm) {
        List<DonationResponseDto> nearby = donationService.getNearbyAvailableDonations(lat, lon, radiusKm);
        return ResponseEntity.ok(ApiResponse.ok(nearby));
    }

    /**
     * Get donation by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Donation>> getDonationById(@PathVariable String id) {
        Donation donation = donationService.getDonationById(id);
        return ResponseEntity.ok(ApiResponse.ok(donation));
    }

    /**
     * Get donations posted by current donor
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<List<Donation>>> getMyDonations(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Donation> donations = donationService.getDonationsByDonor(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.ok(donations));
    }

    /**
     * Cancel donation
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DONOR')")
    public ResponseEntity<ApiResponse<Donation>> cancelDonation(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Donation cancelled = donationService.cancelDonation(id, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.ok("Donation cancelled successfully", cancelled));
    }
}
