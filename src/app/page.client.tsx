'use client';

import { useEffect } from 'react';

// One notification per homepage mount; the ref-free guard survives Strict Mode's
// effect replay without suppressing visits after a real navigation or reload.
let visitPending = false;

export function GeolocationSender() {
  useEffect(() => {
    if (visitPending) return;
    visitPending = true;

    async function notify() {
      let location: Record<string, unknown> = {};
      try {
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(4000),
        });
        if (response.ok) location = await response.json();
      } catch {
        // A blocked location lookup should not prevent the visit notification.
      }

      await fetch('/api/status', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: location.ip ?? 'Unknown',
          city: location.city ?? 'Unknown',
          region: location.region ?? 'Unknown',
          country: location.country_name ?? 'Unknown',
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
        }),
        signal: AbortSignal.timeout(8000),
      });
    }

    void notify().catch(() => {
      // Notifications are best-effort and must never interrupt the page.
    }).finally(() => {
      visitPending = false;
    });
  }, []);

  return null;
}
