'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { isVisitNotificationsEnabled } from '@/lib/preview';

let visitPending = false;

export function GeolocationSender() {
  useEffect(() => {
    if (!isVisitNotificationsEnabled() || visitPending) {
      return;
    }
    visitPending = true;

    async function notify() {
      let location: Record<string, unknown> = {};
      try {
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(4000),
        });
        if (response.ok) {
          location = await response.json();
        }
      } catch {
        // A blocked location lookup should not prevent the visit notification.
      }

      await api.visits.notify({
        ip: String(location.ip ?? 'Unknown'),
        city: String(location.city ?? 'Unknown'),
        region: String(location.region ?? 'Unknown'),
        country: String(location.country_name ?? 'Unknown'),
        location:
          typeof location.latitude === 'number' && typeof location.longitude === 'number'
            ? `${location.latitude},${location.longitude}`
            : 'Unknown',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        vendor: navigator.vendor,
        screenResolution: `${screen.width}x${screen.height}`,
        windowSize: `${innerWidth}x${innerHeight}`,
        timestamp: new Date().toISOString(),
      });
    }

    void notify()
      .catch(() => {
        // Notifications are best-effort and must never interrupt the page.
      })
      .finally(() => {
        visitPending = false;
      });
  }, []);

  return null;
}
