package com.foodrescue.service;

import com.foodrescue.dto.DonationRequestDto;
import com.foodrescue.dto.DonationResponseDto;
import com.foodrescue.exception.BadRequestException;
import com.foodrescue.exception.ConflictException;
import com.foodrescue.exception.ResourceNotFoundException;
import com.foodrescue.exception.UnauthorizedException;
import com.foodrescue.kafka.FoodDonationEvent;
import com.foodrescue.kafka.FoodDonationEventProducer;
import com.foodrescue.model.Donation;
import com.foodrescue.model.DonationStatus;
import com.foodrescue.model.User;
import com.foodrescue.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final RedisCacheService redisCacheService;
    private final FoodDonationEventProducer eventProducer;
    private final GeospatialService geospatialService;

    /**
     * Creates a new food donation.
     * Flow: Save to MongoDB -> Invalidate Redis Cache -> Publish Kafka event.
     */
    public Donation createDonation(DonationRequestDto dto, User donor) {
        Donation donation = Donation.builder()
                .donorId(donor.getId())
                .donorName(donor.getName())
                .donorPhone(donor.getPhone())
                .donorType(dto.getDonorType() != null ? dto.getDonorType() : "Restaurant")
                .title(dto.getTitle().trim())
                .description(dto.getDescription())
                .foodType(dto.getFoodType())
                .quantity(dto.getQuantity())
                .weightKg(dto.getWeightKg())
                .vegNonVeg(dto.getVegNonVeg() != null ? dto.getVegNonVeg() : "PURE_VEG")
                .preparedAt(dto.getPreparedAt() != null ? dto.getPreparedAt() : LocalDateTime.now())
                .expiryTime(dto.getExpiryTime())
                .pickupAddress(dto.getPickupAddress())
                .city(dto.getCity() != null ? dto.getCity() : donor.getCity())
                .locality(dto.getLocality())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .imageUrl(dto.getImageUrl())
                .status(DonationStatus.AVAILABLE)
                .build();

        Donation savedDonation = donationRepository.save(donation);
        log.info("Saved donation [{}] in MongoDB for donor [{}]", savedDonation.getId(), donor.getEmail());

        // 1. Invalidate Redis cache so subsequent calls fetch the fresh list
        redisCacheService.evictAvailableDonationsCache();

        // 2. Publish asynchronous event to Kafka
        FoodDonationEvent event = FoodDonationEvent.builder()
                .eventType(FoodDonationEvent.EventType.FOOD_DONATION_CREATED)
                .donationId(savedDonation.getId())
                .title(savedDonation.getTitle())
                .quantity(savedDonation.getQuantity())
                .donorName(savedDonation.getDonorName())
                .city(savedDonation.getCity())
                .latitude(savedDonation.getLatitude())
                .longitude(savedDonation.getLongitude())
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();

        eventProducer.publishEvent(event);

        return savedDonation;
    }

    /**
     * Retrieves all currently available donations.
     * Flow: Check Redis cache -> If HIT: return -> If MISS: query MongoDB, cache in Redis, return.
     */
    public List<Donation> getAvailableDonations() {
        // Step 1: Check Redis cache
        List<Donation> cached = redisCacheService.getCachedAvailableDonations();
        if (cached != null) {
            return cached;
        }

        // Step 2: Query MongoDB on cache miss
        List<Donation> donations = donationRepository.findByStatusOrderByCreatedAtDesc(DonationStatus.AVAILABLE);

        // Step 3: Populate Redis cache for future reads
        redisCacheService.cacheAvailableDonations(donations);

        return donations;
    }

    /**
     * Finds nearby available donations within a given radius using the Haversine formula.
     */
    public List<DonationResponseDto> getNearbyAvailableDonations(double ngoLat, double ngoLon, double radiusKm) {
        List<Donation> available = getAvailableDonations();

        return available.stream()
                .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
                .map(d -> {
                    double distance = geospatialService.calculateDistanceKm(ngoLat, ngoLon, d.getLatitude(), d.getLongitude());
                    return DonationResponseDto.builder()
                            .donation(d)
                            .distanceKm(distance)
                            .build();
                })
                .filter(dto -> dto.getDistanceKm() <= radiusKm)
                .sorted(Comparator.comparing(DonationResponseDto::getDistanceKm))
                .collect(Collectors.toList());
    }

    public Donation getDonationById(String id) {
        return donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found with ID: " + id));
    }

    public List<Donation> getDonationsByDonor(String donorId) {
        return donationRepository.findByDonorIdOrderByCreatedAtDesc(donorId);
    }

    /**
     * Cancels an existing donation if it belongs to the donor and is still AVAILABLE.
     */
    public Donation cancelDonation(String donationId, User donor) {
        Donation donation = getDonationById(donationId);

        if (!donation.getDonorId().equals(donor.getId())) {
            throw new UnauthorizedException("You are not authorized to cancel this donation");
        }

        if (donation.getStatus() != DonationStatus.AVAILABLE) {
            throw new ConflictException("Only AVAILABLE donations can be cancelled. Current status: " + donation.getStatus());
        }

        donation.setStatus(DonationStatus.CANCELLED);
        donation.setUpdatedAt(LocalDateTime.now());
        Donation updated = donationRepository.save(donation);

        // Invalidate Redis cache
        redisCacheService.evictAvailableDonationsCache();

        // Publish cancellation event to Kafka
        FoodDonationEvent event = FoodDonationEvent.builder()
                .eventType(FoodDonationEvent.EventType.FOOD_DONATION_CANCELLED)
                .donationId(updated.getId())
                .title(updated.getTitle())
                .donorName(donor.getName())
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
        eventProducer.publishEvent(event);

        return updated;
    }
}
