package com.foodrescue.service;

import com.foodrescue.dto.ClaimRequestDto;
import com.foodrescue.exception.ConflictException;
import com.foodrescue.exception.ResourceNotFoundException;
import com.foodrescue.kafka.FoodDonationEvent;
import com.foodrescue.kafka.FoodDonationEventProducer;
import com.foodrescue.model.*;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.FoodRequestRepository;
import com.foodrescue.repository.PickupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FoodRequestService {

    private final DonationRepository donationRepository;
    private final FoodRequestRepository foodRequestRepository;
    private final PickupRepository pickupRepository;
    private final RedisCacheService redisCacheService;
    private final FoodDonationEventProducer eventProducer;

    /**
     * Claims an available food donation for an NGO.
     * Concurrency check: Verifies donation is AVAILABLE to prevent race conditions.
     */
    @Transactional
    public FoodRequest claimDonation(String donationId, ClaimRequestDto dto, User ngo) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with ID: " + donationId));

        // Atomic double-claim prevention check
        if (donation.getStatus() != DonationStatus.AVAILABLE) {
            log.warn("Double claim prevented! Donation [{}] is already in status [{}]", donationId, donation.getStatus());
            throw new ConflictException("Donation is no longer available. It was already claimed or updated.");
        }

        // 1. Update Donation status to CLAIMED
        donation.setStatus(DonationStatus.CLAIMED);
        donation.setClaimedByNgoId(ngo.getId());
        donation.setClaimedByNgoName(ngo.getOrganization() != null ? ngo.getOrganization() : ngo.getName());
        donation.setClaimedAt(LocalDateTime.now());
        donation.setUpdatedAt(LocalDateTime.now());
        donationRepository.save(donation);

        // 2. Invalidate Redis Cache
        redisCacheService.evictAvailableDonationsCache();

        // 3. Create Food Request Record
        FoodRequest foodRequest = FoodRequest.builder()
                .donationId(donation.getId())
                .donationTitle(donation.getTitle())
                .ngoId(ngo.getId())
                .ngoName(ngo.getOrganization() != null ? ngo.getOrganization() : ngo.getName())
                .ngoPhone(ngo.getPhone())
                .ngoAddress(dto.getCustomDropoffAddress() != null ? dto.getCustomDropoffAddress() : ngo.getAddress())
                .ngoLatitude(dto.getDropoffLatitude() != null ? dto.getDropoffLatitude() : ngo.getLatitude())
                .ngoLongitude(dto.getDropoffLongitude() != null ? dto.getDropoffLongitude() : ngo.getLongitude())
                .requestedQuantity(dto.getRequestedQuantity() != null ? dto.getRequestedQuantity() : donation.getQuantity())
                .message(dto.getMessage())
                .status("APPROVED")
                .requestedAt(LocalDateTime.now())
                .build();
        FoodRequest savedRequest = foodRequestRepository.save(foodRequest);

        // 4. Create Pickup Task for Volunteers
        Pickup pickup = Pickup.builder()
                .donationId(donation.getId())
                .donationTitle(donation.getTitle())
                .quantity(donation.getQuantity())
                .pickupAddress(donation.getPickupAddress())
                .pickupLatitude(donation.getLatitude())
                .pickupLongitude(donation.getLongitude())
                .dropoffAddress(foodRequest.getNgoAddress())
                .dropoffLatitude(foodRequest.getNgoLatitude())
                .dropoffLongitude(foodRequest.getNgoLongitude())
                .donorName(donation.getDonorName())
                .donorPhone(donation.getDonorPhone())
                .ngoName(foodRequest.getNgoName())
                .ngoPhone(foodRequest.getNgoPhone())
                .status(PickupStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
        pickupRepository.save(pickup);

        // 5. Publish Kafka Event
        FoodDonationEvent event = FoodDonationEvent.builder()
                .eventType(FoodDonationEvent.EventType.FOOD_DONATION_CLAIMED)
                .donationId(donation.getId())
                .title(donation.getTitle())
                .quantity(donation.getQuantity())
                .donorName(donation.getDonorName())
                .claimedByNgoName(foodRequest.getNgoName())
                .city(donation.getCity())
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
        eventProducer.publishEvent(event);

        log.info("Donation [{}] successfully claimed by NGO [{}]", donation.getId(), ngo.getEmail());
        return savedRequest;
    }

    public List<FoodRequest> getMyRequests(String ngoId) {
        return foodRequestRepository.findByNgoIdOrderByRequestedAtDesc(ngoId);
    }
}
