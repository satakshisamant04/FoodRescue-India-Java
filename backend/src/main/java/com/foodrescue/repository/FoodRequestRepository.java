package com.foodrescue.repository;

import com.foodrescue.model.FoodRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodRequestRepository extends MongoRepository<FoodRequest, String> {
    List<FoodRequest> findByNgoIdOrderByRequestedAtDesc(String ngoId);
    List<FoodRequest> findByDonationId(String donationId);
}
