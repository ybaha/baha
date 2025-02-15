"use client";

import { useEffect } from "react";

export function GeolocationSender() {
  useEffect(() => {
    const sendLocation = async () => {
      try {
        const response = await fetch("/api/details");
        const data = await response.json();

        // Get user agent info
        const userAgent = window.navigator.userAgent;
        const platform = window.navigator.platform;
        const language = window.navigator.language;
        const vendor = window.navigator.vendor;

        const payload = {
          ip: data.ip,
          city: data.city,
          region: data.region,
          country: data.country_name,
          location: `${data.latitude},${data.longitude}`,
          userAgent,
          platform,
          language,
          vendor,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
        };

        // Send encrypted data
        await fetch("/api/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: btoa(JSON.stringify(payload)), // Base64 encode the payload
          }),
        });
      } catch (error) {
        console.error("Error:", error);
      }
    };

    sendLocation();
  }, []);

  return null;
}
