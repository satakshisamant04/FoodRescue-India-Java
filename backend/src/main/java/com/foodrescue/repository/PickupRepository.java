package com.foodrescue.repository;

import com.foodrescue.model.Pickup;
import com.foodrescue.model.PickupStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PickupRepository extends MongoRepository<Pickup, String> {
    List<Pickup> findByStatus(PickupStatus status);
    List<Pickup> findByVolunteerIdOrderByCreatedAtDesc(String volunteerId);
    Optional<Pickup> findByDonationId(String donationId);
    long countByStatus(PickupStatus status);
}
