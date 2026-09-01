package com.foodrescue.service;

import org.springframework.stereotype.Service;

@Service
public class GeospatialService {

    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Calculates the great-circle distance between two points on the Earth's surface
     * using the standard Haversine formula.
     *
     * @param lat1 Latitude of point 1 in degrees
     * @param lon1 Longitude of point 1 in degrees
     * @param lat2 Latitude of point 2 in degrees
     * @param lon2 Longitude of point 2 in degrees
     * @return Distance in kilometers (rounded to 2 decimal places)
     */
    public double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double originLatRad = Math.toRadians(lat1);
        double destLatRad = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(originLatRad) * Math.cos(destLatRad);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double distance = EARTH_RADIUS_KM * c;
        return Math.round(distance * 100.0) / 100.0;
    }

    /**
     * Determines whether a location is within the specified radius threshold.
     */
    public boolean isWithinRadius(double originLat, double originLon, double targetLat, double targetLon, double radiusKm) {
        return calculateDistanceKm(originLat, originLon, targetLat, targetLon) <= radiusKm;
    }
}
