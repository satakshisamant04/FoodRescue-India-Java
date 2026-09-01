package com.foodrescue.controller;

import com.foodrescue.dto.ApiResponse;
import com.foodrescue.dto.PickupStatusUpdateDto;
import com.foodrescue.model.Pickup;
import com.foodrescue.security.UserPrincipal;
import com.foodrescue.service.PickupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pickups")
@RequiredArgsConstructor
public class PickupController {

    private final PickupService pickupService;

    /**
     * List all unassigned pending pickups
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<Pickup>>> getAvailablePickups() {
        List<Pickup> pickups = pickupService.getAvailablePickups();
        return ResponseEntity.ok(ApiResponse.ok(pickups));
    }

    /**
     * List all pickups assigned to the authenticated volunteer
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<ApiResponse<List<Pickup>>> getMyPickups(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<Pickup> pickups = pickupService.getMyPickups(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.ok(pickups));
    }

    /**
     * Volunteer accepts a pickup task
     */
    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<ApiResponse<Pickup>> acceptPickup(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Pickup pickup = pickupService.acceptPickup(id, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.ok("Pickup task accepted", pickup));
    }

    /**
     * Update pickup progression status (PICKED_UP -> DELIVERED)
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('VOLUNTEER')")
    public ResponseEntity<ApiResponse<Pickup>> updatePickupStatus(
            @PathVariable String id,
            @Valid @RequestBody PickupStatusUpdateDto dto,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        Pickup updated = pickupService.updatePickupStatus(id, dto, userPrincipal.getUser());
        return ResponseEntity.ok(ApiResponse.ok("Pickup status updated successfully", updated));
    }
}
