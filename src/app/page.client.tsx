"use client";

import { useEffect } from "react";

export function GeolocationSender() {
  useEffect(() => {
    const sendLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();

        // Send the location data to our API route
        await fetch("/api/send-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            location: `${data.latitude},${data.longitude}`,
          }),
        });
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    sendLocation();
  }, []);

  return null;
}
