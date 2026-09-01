package com.foodrescue.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FoodDonationEventConsumer {

    @KafkaListener(
            topics = "${app.kafka.topics.donation-events:food-donation-events}",
            groupId = "${spring.kafka.consumer.group-id:foodrescue-group}"
    )
    public void consumeDonationEvent(@Payload FoodDonationEvent event) {
        log.info("📥 [KAFKA CONSUMER RECEIVED] Event: {} | Donation: '{}' (ID: {}) | Donor: {}",
                event.getEventType(), event.getTitle(), event.getDonationId(), event.getDonorName());

        switch (event.getEventType()) {
            case FOOD_DONATION_CREATED:
                log.info("🔔 [NOTIFICATION ENGINE] Broadcast alert: New {} surplus meals available in {}! Notifying nearby verified NGOs within 25km.",
                        event.getQuantity(), event.getCity());
                break;

            case FOOD_DONATION_CLAIMED:
                log.info("🚚 [DISPATCH ENGINE] Donation '{}' claimed by NGO '{}'. Creating pickup task for local volunteer drivers.",
                        event.getTitle(), event.getClaimedByNgoName());
                break;

            case FOOD_DONATION_PICKED_UP:
                log.info("📍 [TRACKING] Volunteer '{}' has picked up meals for '{}'. En route to shelter.",
                        event.getAssignedVolunteerName(), event.getTitle());
                break;

            case FOOD_DONATION_COMPLETED:
                log.info("🎉 [IMPACT METRIC] Completed food delivery: {} meals safely delivered to community shelter in {}.",
                        event.getQuantity(), event.getCity());
                break;

            case FOOD_DONATION_CANCELLED:
                log.info("⚠️ [AUDIT] Donation ID: {} was cancelled by donor.", event.getDonationId());
                break;
        }
    }
}
