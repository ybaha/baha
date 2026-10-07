'use client';

import { useEffect } from 'react';

export function LogHashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      return;
    }
    const element = document.getElementById(hash.substring(1));
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return null;
}
