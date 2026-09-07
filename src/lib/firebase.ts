// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE — CURRENTLY DISABLED
//
// Firebase Remote Config was used for:
//   • movieSourceOverrides / tvSourceOverrides  (which player source to use)
//   • emergencySourceDisable                    (kill-switch for broken sources)
//   • fourKAvailability                         (Cloudflare Stream URLs)
//   • VAST ad controls (vast_ads_enabled, etc.)
//
// To re-enable:
//   1. Set FIREBASE_ENABLED = true below
//   2. Uncomment the full implementation block at the bottom of this file
//   3. Comment out / remove the stub exports in the "STUBS" section
//   4. Add the env vars back to Coolify:
//        NEXT_PUBLIC_FIREBASE_API_KEY
//        NEXT_PUBLIC_FIREBASE_PROJECT_ID
//        NEXT_PUBLIC_FIREBASE_APP_ID
//        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN      (optional)
//        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   (optional)
//        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID (optional)
// ─────────────────────────────────────────────────────────────────────────────

export const FIREBASE_ENABLED = false;

// ── STUBS (active while FIREBASE_ENABLED = false) ────────────────────────────
// These have the exact same signature as the real exports so callers compile
// without any changes. They return safe empty-state values immediately.

export const remoteConfig = null;

export const fetchRemoteConfig = async (): Promise<boolean> => false;

export const getRemoteConfigValue = (_key: string): string => '';

export const getAllRemoteConfigValues = (): Record<string, string> => ({});

// ─────────────────────────────────────────────────────────────────────────────
// REAL IMPLEMENTATION — uncomment everything below when re-enabling Firebase
// ─────────────────────────────────────────────────────────────────────────────

/*
import { initializeApp } from 'firebase/app';
import { getRemoteConfig, fetchAndActivate, getValue, getAll } from 'firebase/remote-config';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN     || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET  || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
};

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Firebase Config Debug:', {
    hasApiKey:   !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId:    !!firebaseConfig.appId,
    projectId:   firebaseConfig.projectId,
  });
}

const missingVars: string[] = [];
if (!firebaseConfig.apiKey)    missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!firebaseConfig.projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!firebaseConfig.appId)     missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  console.error('❌ Missing Firebase environment variables:', missingVars);
  throw new Error(`Missing Firebase environment variables: ${missingVars.join(', ')}`);
}

const app = initializeApp(firebaseConfig);
export const remoteConfig = getRemoteConfig(app);

remoteConfig.settings = {
  minimumFetchIntervalMillis: process.env.NODE_ENV === 'development' ? 60000 : 3600000,
  fetchTimeoutMillis: 60000,
};

remoteConfig.defaultConfig = {
  movieSourceOverrides:      JSON.stringify({}),
  tvSourceOverrides:         JSON.stringify({}),
  sourceHealthCheckEnabled:  'true',
  emergencySourceDisable:    JSON.stringify([]),
  fourKAvailability:         JSON.stringify({ movies: {}, tvShows: {} }),
};

export const fetchRemoteConfig = async (): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn('⚠️ No internet — using cached Remote Config values');
      return false;
    }
    const success = await fetchAndActivate(remoteConfig);
    if (process.env.NODE_ENV === 'development') {
      if (success) {
        const all = getAll(remoteConfig);
        console.log('✅ Remote Config activated:', Object.fromEntries(
          Object.entries(all).map(([k, v]) => [k, v.asString()])
        ));
      } else {
        console.warn('⚠️ Remote Config fetch: no new values');
      }
    }
    return success;
  } catch (error: any) {
    console.error('❌ Failed to fetch Remote Config:', error);
    return false;
  }
};

export const getRemoteConfigValue = (key: string): string => {
  try {
    return getValue(remoteConfig, key).asString();
  } catch (error) {
    console.error(`❌ Error getting Remote Config value for ${key}:`, error);
    return '';
  }
};

export const getAllRemoteConfigValues = (): Record<string, string> => {
  try {
    const all = getAll(remoteConfig);
    return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.asString()]));
  } catch (error) {
    console.error('❌ Error getting all Remote Config values:', error);
    return {};
  }
};
*/
