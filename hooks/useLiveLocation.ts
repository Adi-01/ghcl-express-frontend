"use client";

import { useState, useEffect, useCallback } from "react";

export function useLiveLocation() {
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
  } | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);

  const retry = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);
    setRetryIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    // Check secure context requirement (Chrome/Safari block GPS on non-localhost HTTP)
    if (
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setLocationError(
        "Geolocation requires a secure connection (HTTPS) or localhost. Accessing via IP or HTTP is blocked by browsers."
      );
      setIsLocating(false);
      return;
    }

    let isMounted = true;
    let watchId: number | null = null;

    const handleSuccess = (position: GeolocationPosition) => {
      if (!isMounted) return;
      setUserCoords({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLocationError(null);
      setIsLocating(false);
    };

    const handleFailure = (
      error: GeolocationPositionError,
      isHighAccuracyAttempt: boolean
    ) => {
      if (!isMounted) return;

      // If high accuracy timed out or was unavailable on desktop/Linux, fall back to low accuracy
      if (
        isHighAccuracyAttempt &&
        (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)
      ) {
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => handleFailure(fallbackErr, false),
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
        return;
      }

      setIsLocating(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setLocationError(
            "Location access denied. Please click the lock/settings icon in your browser URL bar and allow location access."
          );
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError(
            "Location unavailable. Please make sure location services are enabled on your device or Wi-Fi is connected."
          );
          break;
        case error.TIMEOUT:
          setLocationError(
            "Location request timed out. Please click 'Retry GPS' below."
          );
          break;
        default:
          setLocationError(error.message || "An unknown location error occurred.");
          break;
      }
    };

    // Step 1: Initial fast fetch with 7s timeout
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (err) => handleFailure(err, true),
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 30000,
      }
    );

    // Step 2: Continuous background watch
    try {
      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        (err) => {
          // If we already acquired coordinates once, keep them instead of dropping to an error
          if (!userCoords) {
            handleFailure(err, false);
          }
        },
        {
          enableHighAccuracy: false,
          maximumAge: 15000,
          timeout: 25000,
        }
      );
    } catch {
      // Ignored
    }

    return () => {
      isMounted = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [retryIndex]);

  return { isLocating, locationError, userCoords, retry };
}
