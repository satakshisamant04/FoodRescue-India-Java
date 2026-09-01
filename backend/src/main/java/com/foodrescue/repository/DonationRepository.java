package com.foodrescue.repository;

import com.foodrescue.model.Donation;
import com.foodrescue.model.DonationStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationRepository extends MongoRepository<Donation, String> {
    List<Donation> findByStatus(DonationStatus status);
    List<Donation> findByDonorIdOrderByCreatedAtDesc(String donorId);
    List<Donation> findByClaimedByNgoId(String ngoId);
    List<Donation> findByStatusOrderByCreatedAtDesc(DonationStatus status);
    long countByStatus(DonationStatus status);
}
