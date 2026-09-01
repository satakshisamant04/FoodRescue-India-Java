package com.foodrescue.controller;

import com.foodrescue.dto.ApiResponse;
import com.foodrescue.model.DonationStatus;
import com.foodrescue.model.PickupStatus;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final DonationRepository donationRepository;
    private final PickupRepository pickupRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformStats() {
        long totalDonations = donationRepository.count();
        long availableDonations = donationRepository.countByStatus(DonationStatus.AVAILABLE);
        long claimedDonations = donationRepository.countByStatus(DonationStatus.CLAIMED);
        long completedDonations = donationRepository.countByStatus(DonationStatus.COMPLETED);
        long totalUsers = userRepository.count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDonations", totalDonations);
        stats.put("availableDonations", availableDonations);
        stats.put("claimedDonations", claimedDonations);
        stats.put("completedDonations", completedDonations);
        stats.put("totalUsers", totalUsers);

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
