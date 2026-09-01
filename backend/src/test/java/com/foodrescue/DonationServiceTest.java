package com.foodrescue;

import com.foodrescue.dto.DonationRequestDto;
import com.foodrescue.kafka.FoodDonationEventProducer;
import com.foodrescue.model.Donation;
import com.foodrescue.model.DonationStatus;
import com.foodrescue.model.FoodType;
import com.foodrescue.model.Role;
import com.foodrescue.model.User;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.service.DonationService;
import com.foodrescue.service.GeospatialService;
import com.foodrescue.service.RedisCacheService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DonationServiceTest {

    @Mock
    private DonationRepository donationRepository;

    @Mock
    private RedisCacheService redisCacheService;

    @Mock
    private FoodDonationEventProducer eventProducer;

    @Mock
    private GeospatialService geospatialService;

    @InjectMocks
    private DonationService donationService;

    private User sampleDonor;
    private DonationRequestDto sampleDto;

    @BeforeEach
    void setUp() {
        sampleDonor = User.builder()
                .id("donor-123")
                .name("Taj Bengal Restaurant")
                .email("taj@rescuemail.in")
                .role(Role.ROLE_DONOR)
                .city("Kolkata")
                .phone("+91 98300 12345")
                .build();

        sampleDto = new DonationRequestDto();
        sampleDto.setTitle("Fresh Paneer Butter Masala & Rotis");
        sampleDto.setDescription("Packed in sanitary containers, freshly cooked for lunch buffet");
        sampleDto.setFoodType(FoodType.COOKED_MEALS);
        sampleDto.setQuantity(40);
        sampleDto.setWeightKg(15.0);
        sampleDto.setVegNonVeg("PURE_VEG");
        sampleDto.setPreparedAt(LocalDateTime.now().minusHours(1));
        sampleDto.setExpiryTime(LocalDateTime.now().plusHours(4));
        sampleDto.setPickupAddress("Alipore, Kolkata");
        sampleDto.setCity("Kolkata");
        sampleDto.setLatitude(22.5320);
        sampleDto.setLongitude(88.3325);
    }

    @Test
    @DisplayName("createDonation should save to MongoDB, evict Redis cache, and publish Kafka event")
    void testCreateDonationSuccess() {
        Donation savedMock = Donation.builder()
                .id("donation-999")
                .donorId(sampleDonor.getId())
                .donorName(sampleDonor.getName())
                .title(sampleDto.getTitle())
                .foodType(sampleDto.getFoodType())
                .quantity(sampleDto.getQuantity())
                .status(DonationStatus.AVAILABLE)
                .latitude(sampleDto.getLatitude())
                .longitude(sampleDto.getLongitude())
                .createdAt(LocalDateTime.now())
                .build();

        when(donationRepository.save(any(Donation.class))).thenReturn(savedMock);

        Donation result = donationService.createDonation(sampleDto, sampleDonor);

        assertNotNull(result);
        assertEquals("donation-999", result.getId());
        assertEquals(DonationStatus.AVAILABLE, result.getStatus());

        // Verify MongoDB save
        verify(donationRepository, times(1)).save(any(Donation.class));

        // Verify Redis cache eviction
        verify(redisCacheService, times(1)).evictAvailableDonationsCache();

        // Verify Kafka event published
        verify(eventProducer, times(1)).publishEvent(any());
    }

    @Test
    @DisplayName("getAvailableDonations should return cached results on Redis cache HIT without calling MongoDB")
    void testGetAvailableDonationsCacheHit() {
        Donation cachedDonation = Donation.builder()
                .id("cached-1")
                .title("Cached Meal")
                .status(DonationStatus.AVAILABLE)
                .build();

        when(redisCacheService.getCachedAvailableDonations()).thenReturn(List.of(cachedDonation));

        List<Donation> result = donationService.getAvailableDonations();

        assertEquals(1, result.size());
        assertEquals("cached-1", result.get(0).getId());

        // Verify MongoDB was NEVER queried due to cache hit
        verify(donationRepository, never()).findByStatusOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("getAvailableDonations should query MongoDB and store in Redis on Cache MISS")
    void testGetAvailableDonationsCacheMiss() {
        when(redisCacheService.getCachedAvailableDonations()).thenReturn(null);

        Donation dbDonation = Donation.builder()
                .id("db-1")
                .title("DB Meal")
                .status(DonationStatus.AVAILABLE)
                .build();

        when(donationRepository.findByStatusOrderByCreatedAtDesc(DonationStatus.AVAILABLE))
                .thenReturn(List.of(dbDonation));

        List<Donation> result = donationService.getAvailableDonations();

        assertEquals(1, result.size());
        assertEquals("db-1", result.get(0).getId());

        // Verify queried from MongoDB
        verify(donationRepository, times(1)).findByStatusOrderByCreatedAtDesc(DonationStatus.AVAILABLE);

        // Verify saved to Redis
        verify(redisCacheService, times(1)).cacheAvailableDonations(List.of(dbDonation));
    }
}
