'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { isVisitNotificationsEnabled } from '@/lib/preview';

let visitPending = false;

function pageAddress(value: string): string {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol)
      ? `${url.origin}${url.pathname}`.slice(0, 2048)
      : '';
  } catch {
    return '';
  }
}

export function GeolocationSender() {
  useEffect(() => {
    if (!isVisitNotificationsEnabled() || visitPending) {
      return;
    }
    visitPending = true;

    async function notify() {
      const pageContext = {
        pageUrl: pageAddress(window.location.href),
        referrer: pageAddress(document.referrer),
        pageTitle: document.title.slice(0, 200),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
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
        ...pageContext,
        organization: String(location.org ?? '').slice(0, 200),
        postalCode: String(location.postal ?? '').slice(0, 100),
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
