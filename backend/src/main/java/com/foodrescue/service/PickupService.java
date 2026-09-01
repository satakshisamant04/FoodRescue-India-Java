package com.foodrescue.service;

import com.foodrescue.dto.PickupStatusUpdateDto;
import com.foodrescue.exception.ConflictException;
import com.foodrescue.exception.ResourceNotFoundException;
import com.foodrescue.exception.UnauthorizedException;
import com.foodrescue.kafka.FoodDonationEvent;
import com.foodrescue.kafka.FoodDonationEventProducer;
import com.foodrescue.model.*;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.PickupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PickupService {

    private final PickupRepository pickupRepository;
    private final DonationRepository donationRepository;
    private final FoodDonationEventProducer eventProducer;

    public List<Pickup> getAvailablePickups() {
        return pickupRepository.findByStatus(PickupStatus.PENDING);
    }

    public List<Pickup> getMyPickups(String volunteerId) {
        return pickupRepository.findByVolunteerIdOrderByCreatedAtDesc(volunteerId);
    }

    public Pickup acceptPickup(String pickupId, User volunteer) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup task not found with ID: " + pickupId));

        if (pickup.getStatus() != PickupStatus.PENDING) {
            throw new ConflictException("Pickup task has already been assigned to another volunteer.");
        }

        pickup.setVolunteerId(volunteer.getId());
        pickup.setVolunteerName(volunteer.getName());
        pickup.setVolunteerPhone(volunteer.getPhone());
        pickup.setStatus(PickupStatus.ASSIGNED);
        pickup.setAssignedAt(LocalDateTime.now());
        Pickup updated = pickupRepository.save(pickup);

        // Update corresponding donation
        donationRepository.findById(pickup.getDonationId()).ifPresent(donation -> {
            donation.setAssignedVolunteerId(volunteer.getId());
            donation.setAssignedVolunteerName(volunteer.getName());
            donationRepository.save(donation);
        });

        log.info("Pickup task [{}] accepted by volunteer [{}]", pickupId, volunteer.getEmail());
        return updated;
    }

    public Pickup updatePickupStatus(String pickupId, PickupStatusUpdateDto dto, User volunteer) {
        Pickup pickup = pickupRepository.findById(pickupId)
                .orElseThrow(() -> new ResourceNotFoundException("Pickup task not found with ID: " + pickupId));

        if (!volunteer.getId().equals(pickup.getVolunteerId())) {
            throw new UnauthorizedException("You are not authorized to update this pickup task.");
        }

        pickup.setStatus(dto.getStatus());

        if (dto.getStatus() == PickupStatus.PICKED_UP) {
            pickup.setPickedUpAt(LocalDateTime.now());
            donationRepository.findById(pickup.getDonationId()).ifPresent(d -> {
                d.setStatus(DonationStatus.PICKED_UP);
                donationRepository.save(d);
            });

            // Emit Kafka Event
            eventProducer.publishEvent(FoodDonationEvent.builder()
                    .eventType(FoodDonationEvent.EventType.FOOD_DONATION_PICKED_UP)
                    .donationId(pickup.getDonationId())
                    .title(pickup.getDonationTitle())
                    .assignedVolunteerName(volunteer.getName())
                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                    .build());

        } else if (dto.getStatus() == PickupStatus.DELIVERED) {
            pickup.setDeliveredAt(LocalDateTime.now());
            donationRepository.findById(pickup.getDonationId()).ifPresent(d -> {
                d.setStatus(DonationStatus.COMPLETED);
                donationRepository.save(d);
            });

            // Emit Kafka Event
            eventProducer.publishEvent(FoodDonationEvent.builder()
                    .eventType(FoodDonationEvent.EventType.FOOD_DONATION_COMPLETED)
                    .donationId(pickup.getDonationId())
                    .title(pickup.getDonationTitle())
                    .quantity(pickup.getQuantity())
                    .assignedVolunteerName(volunteer.getName())
                    .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                    .build());
        }

        log.info("Pickup task [{}] updated to status [{}] by volunteer [{}]", pickupId, dto.getStatus(), volunteer.getEmail());
        return pickupRepository.save(pickup);
    }
}
