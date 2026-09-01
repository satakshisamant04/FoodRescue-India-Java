package com.foodrescue.controller;

import com.foodrescue.dto.ApiResponse;
import com.foodrescue.dto.ClaimRequestDto;
import com.foodrescue.model.FoodRequest;
import com.foodrescue.security.UserPrincipal;
import com.foodrescue.service.FoodRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FoodRequestController {

    private final FoodRequestService foodRequestService;

    /**
     * NGO requests/claims available food donation
     */
    @PostMapping("/donations/{id}/claim")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<FoodRequest>> claimDonation(
            @PathVariable String id,
            @RequestBody(required = false) ClaimRequestDto claimRequestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (claimRequestDto == null) {
            claimRequestDto = new ClaimRequestDto();
        }
        FoodRequest foodRequest = foodRequestService.claimDonation(id, claimRequestDto, userPrincipal.getUser());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Donation claimed successfully! Pickup task generated.", foodRequest));
    }

    /**
     * Alias for /donations/{id}/request
     */
    @PostMapping("/donations/{id}/request")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<FoodRequest>> requestDonation(
            @PathVariable String id,
            @RequestBody(required = false) ClaimRequestDto claimRequestDto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return claimDonation(id, claimRequestDto, userPrincipal);
    }

    /**
     * Get requests created by the authenticated NGO
     */
    @GetMapping("/requests/my")
    @PreAuthorize("hasRole('NGO')")
    public ResponseEntity<ApiResponse<List<FoodRequest>>> getMyRequests(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<FoodRequest> requests = foodRequestService.getMyRequests(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }
}
