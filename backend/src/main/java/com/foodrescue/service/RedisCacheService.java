package com.foodrescue.service;

import com.foodrescue.model.Donation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    public static final String AVAILABLE_DONATIONS_KEY = "donations:available";
    private static final long CACHE_TTL_MINUTES = 10;

    @SuppressWarnings("unchecked")
    public List<Donation> getCachedAvailableDonations() {
        try {
            Object cached = redisTemplate.opsForValue().get(AVAILABLE_DONATIONS_KEY);
            if (cached != null) {
                log.info("⚡ [REDIS CACHE HIT] Retrieved available donations from Redis key: {}", AVAILABLE_DONATIONS_KEY);
                return (List<Donation>) cached;
            }
            log.info("🔄 [REDIS CACHE MISS] Key not found in Redis: {}", AVAILABLE_DONATIONS_KEY);
        } catch (Exception e) {
            log.warn("Redis read failure, falling back gracefully to MongoDB: {}", e.getMessage());
        }
        return null;
    }

    public void cacheAvailableDonations(List<Donation> donations) {
        try {
            redisTemplate.opsForValue().set(AVAILABLE_DONATIONS_KEY, donations, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.info("💾 [REDIS CACHE SET] Cached {} available donations in Redis for {} minutes", donations.size(), CACHE_TTL_MINUTES);
        } catch (Exception e) {
            log.warn("Redis write failure: {}", e.getMessage());
        }
    }

    public void evictAvailableDonationsCache() {
        try {
            Boolean deleted = redisTemplate.delete(AVAILABLE_DONATIONS_KEY);
            log.info("🗑️ [REDIS CACHE EVICTION] Evicted cache key: {} (Result: {})", AVAILABLE_DONATIONS_KEY, deleted);
        } catch (Exception e) {
            log.warn("Redis eviction failure: {}", e.getMessage());
        }
    }
}
