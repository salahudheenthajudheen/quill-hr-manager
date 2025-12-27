/**
 * Geolocation Utilities
 * Provides functions for calculating distances and validating office proximity
 */

import { OFFICE_LOCATION } from '@/lib/appwrite';

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Check if a given location is within the office geofence
 * @param lat User's latitude
 * @param lng User's longitude
 * @returns Object with isWithin boolean and distance in meters
 */
export function isWithinOfficeRadius(lat: number, lng: number): {
    isWithin: boolean;
    distance: number;
    allowedRadius: number;
} {
    const distance = calculateDistance(
        lat,
        lng,
        OFFICE_LOCATION.latitude,
        OFFICE_LOCATION.longitude
    );

    return {
        isWithin: distance <= OFFICE_LOCATION.radiusMeters,
        distance: Math.round(distance),
        allowedRadius: OFFICE_LOCATION.radiusMeters,
    };
}

/**
 * Get current device location using Browser Geolocation API
 * @returns Promise with coordinates or error
 */
export function getDeviceLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('Location permission denied. Please enable location access.'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('Location information is unavailable.'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('Location request timed out.'));
                        break;
                    default:
                        reject(new Error('An unknown error occurred while getting location.'));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    });
}

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lng Longitude
 * @returns Formatted string
 */
export function formatCoordinates(lat: number, lng: number): string {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Get Google Maps URL for a location
 * @param lat Latitude
 * @param lng Longitude
 * @returns Google Maps URL
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
}
