package com.foodrescue;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FoodRescueApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoodRescueApplication.class, args);
    }
}
