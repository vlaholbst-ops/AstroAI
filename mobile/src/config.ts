// src/config.ts
// Environment-based API configuration for iOS / Android / Web.
//
// Priority (highest → lowest):
//   1. EXPO_PUBLIC_API_URL in mobile/.env   — dev/real-device override
//   2. Android emulator fallback            — http://10.0.2.2:8000
//   3. iOS Simulator / default dev          — http://localhost:8000
//   4. Production (non-DEV build)           — https://astroai-api.production.com
//
// Copy mobile/.env.example → mobile/.env and set EXPO_PUBLIC_API_URL.
// .env is gitignored; never commit it.

import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  // 1. Env var wins — set in mobile/.env (gitignored), loaded by Expo automatically.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Dev mode platform fallbacks (no .env configured)
  if (__DEV__) {
    // Android emulator proxies host loopback via 10.0.2.2
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://localhost:8000';
  }

  // 3. Production — set EXPO_PUBLIC_API_URL in CI/CD environment
  return 'https://astroai-api.production.com';
}

export const API_CONFIG = {
  BASE_URL: resolveBaseUrl(),

  ENDPOINTS: {
    CALCULATE_CHART:      '/api/astrology/calculate-chart',
    CALCULATE_CHART_FULL: '/api/astrology/calculate-chart-full',
  },

  TIMEOUT: 10000, // 10 секунд
};

// Nominatim API (OpenStreetMap geocoding)
export const NOMINATIM_CONFIG = {
  BASE_URL:   'https://nominatim.openstreetmap.org',
  USER_AGENT: 'AstroAI/1.0', // Обязательно для Nominatim (иначе 403)
};

export const STORAGE_KEYS = {
  LAST_INPUT: '@astroai:last_input',
};
