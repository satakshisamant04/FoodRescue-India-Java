package com.foodrescue.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FoodDonationEventProducer {

    private final KafkaTemplate<String, FoodDonationEvent> kafkaTemplate;

    @Value("${app.kafka.topics.donation-events:food-donation-events}")
    private String topicName;

    public void publishEvent(FoodDonationEvent event) {
        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID().toString());
        }

        log.info("📢 [KAFKA PRODUCER] Publishing event {} to topic '{}' for Donation ID: {}",
                event.getEventType(), topicName, event.getDonationId());

        try {
            kafkaTemplate.send(topicName, event.getDonationId(), event)
                    .whenComplete((result, ex) -> {
                        if (ex == null) {
                            log.info("✅ [KAFKA ACK] Sent message=[{}] with offset=[{}] on partition=[{}]",
                                    event.getEventType(),
                                    result.getRecordMetadata().offset(),
                                    result.getRecordMetadata().partition());
                        } else {
                            log.error("❌ [KAFKA ERROR] Unable to send message=[{}] due to: {}",
                                    event.getEventType(), ex.getMessage());
                        }
                    });
        } catch (Exception e) {
            log.error("Kafka publish error: {}", e.getMessage());
        }
    }
}
