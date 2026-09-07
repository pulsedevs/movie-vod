# Firebase Remote Config for VAST Ads

## Overview
This implementation allows you to control VAST ad behavior in real-time without code deployments using Firebase Remote Config.

## Remote Config Parameters

### 1. `vast_ads_enabled` (Boolean)
- **Default**: `false`
- **Description**: Master switch for all VAST ads across the platform
- **When `false`**: No ads will be shown anywhere
- **When `true`**: Ads can be shown (subject to other conditions)

### 2. `vast_test_page_enabled` (Boolean)
- **Default**: `true`
- **Description**: Controls whether the `/vast-test` page is accessible
- **When `false`**: Shows disabled message instead of test interface
- **When `true`**: Full test page functionality available

### 3. `vast_preroll_enabled` (Boolean)
- **Default**: `false`
- **Description**: Controls preroll ads before movie content
- **When `false`**: No preroll ads shown
- **When `true`**: Preroll ads can be shown (if main ads are enabled)

### 4. `vast_urls_config` (JSON String)
```json
{
  "primary": "https://s.magsrv.com/v1/vast.php?idzone=5650700",
  "fallback": [
    "https://s.magsrv.com/v1/vast.php?idzone=2366423",
    "https://s.magsrv.com/v1/vast.php?idzone=2916384"
  ]
}
```
- **Description**: VAST URL configuration with primary and fallback options
- **Primary**: Main VAST URL to try first
- **Fallback**: Array of backup URLs if primary fails

### 5. `vast_frequency_config` (JSON String)
```json
{
  "maxAdsPerSession": 3,
  "cooldownMinutes": 5
}
```
- **Description**: Controls ad frequency to prevent spam
- **maxAdsPerSession**: Maximum ads shown per browser session
- **cooldownMinutes**: Minimum time between ads

### 6. `vast_targeting_config` (JSON String)
```json
{
  "enableForMobile": true,
  "enableForDesktop": true,
  "geoRestrictions": []
}
```
- **Description**: Device and geographic targeting options
- **enableForMobile**: Show ads on mobile devices
- **enableForDesktop**: Show ads on desktop devices
- **geoRestrictions**: Array of country codes to restrict (future use)

## Setup Instructions

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Remote Config**
4. Add the following parameters:

#### Basic Parameters:
```
vast_ads_enabled: false (Boolean)
vast_test_page_enabled: true (Boolean)  
vast_preroll_enabled: false (Boolean)
```

#### JSON Parameters:
```
vast_urls_config: {"primary":"https://s.magsrv.com/v1/vast.php?idzone=5650700","fallback":["https://s.magsrv.com/v1/vast.php?idzone=2366423"]}

vast_frequency_config: {"maxAdsPerSession":3,"cooldownMinutes":5}

vast_targeting_config: {"enableForMobile":true,"enableForDesktop":true,"geoRestrictions":[]}
```

### 2. Publish Configuration
1. Click **Publish changes** in Firebase Console
2. Changes take effect immediately (within ~1 minute)

## Usage in Code

### Hook: `useVastAdControl`
```typescript
const vastAdControl = useVastAdControl();

// Check if ads should be shown
if (vastAdControl.shouldShowAds()) {
  // Show ads
}

// Get VAST URLs
const primaryUrl = vastAdControl.getPrimaryVastUrl();
const fallbackUrls = vastAdControl.getFallbackVastUrls();

// Check frequency limits
if (vastAdControl.canShowAd()) {
  // Show ad and record it
  vastAdControl.recordAdShown();
}
```

### Component Integration
```typescript
// VastTestPlayer.tsx
const vastAdControl = useVastAdControl();

if (!vastAdControl.shouldShowTestPage()) {
  return <DisabledMessage />;
}
```

## Control Scenarios

### 1. Emergency Ad Disable
**Problem**: Ads are causing issues
**Solution**: Set `vast_ads_enabled` to `false`
**Effect**: All ads stop immediately

### 2. Test New VAST URLs
**Problem**: Need to test new ad provider
**Solution**: Update `vast_urls_config` with new URLs
**Effect**: New URLs used immediately without deployment

### 3. Reduce Ad Frequency
**Problem**: Users complaining about too many ads
**Solution**: Increase `cooldownMinutes` or decrease `maxAdsPerSession`
**Effect**: Fewer ads shown per user

### 4. Device-Specific Control
**Problem**: Mobile ads performing poorly
**Solution**: Set `enableForMobile` to `false` in `vast_targeting_config`
**Effect**: Ads only show on desktop

### 5. A/B Testing
**Problem**: Want to test ads on 50% of users
**Solution**: Use Firebase Remote Config conditions
**Effect**: Different users see different configurations

## Monitoring

### Local Storage Keys
- `vast_ad_session`: Count of ads shown this session
- `vast_ad_last_shown`: Timestamp of last ad

### Console Logging
- Remote config loading status
- Ad frequency decisions
- VAST URL selections

### Browser DevTools
Check Application → Local Storage for ad session data

## Fallback Behavior
- If Remote Config fails to load: Uses safe defaults (ads disabled)
- If JSON parsing fails: Uses individual default values
- If Firebase unavailable: Graceful degradation to default config

## Best Practices

### 1. Gradual Rollouts
- Start with `vast_ads_enabled: false`
- Enable test page first: `vast_test_page_enabled: true`
- Test thoroughly before enabling ads

### 2. Frequency Management
- Start conservative: `maxAdsPerSession: 1`, `cooldownMinutes: 30`
- Monitor user feedback and adjust gradually
- Consider user experience over revenue

### 3. Monitoring
- Watch Firebase Analytics for user engagement changes
- Monitor error rates after enabling ads
- Set up alerts for ad performance metrics

### 4. Emergency Procedures
- Keep Firebase console bookmarked
- Document who has access to disable ads
- Have rollback plan ready
