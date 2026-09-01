package com.foodrescue.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaConfig {

    @Value("${app.kafka.topics.donation-events:food-donation-events}")
    private String donationEventsTopic;

    @Bean
    public NewTopic foodDonationEventsTopic() {
        return TopicBuilder.name(donationEventsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
