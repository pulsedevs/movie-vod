# ExoClick VAST Skip Button Integration

## Overview

This document explains how to properly support ExoClick's built-in skip button functionality in VAST ads, comparing the old manual approach with the new VAST plugin approach.

## Two Implementation Approaches

### ✅ VAST Plugin Approach (Recommended)

**File:** `src/components/player/VastAdPlayer.tsx`

This uses the official `videojs-vast-vpaid` plugin which provides full VAST 3.0+ compliance:

```tsx
import videojs from 'video.js';
import 'videojs-vast-vpaid';

const player = videojs(videoRef.current, {
  plugins: {
    vastClient: {
      adTagUrl: vastUrl,
      skipButton: {
        enabled: true,
        skipText: 'Skip Ad'
      }
    }
  }
});
```

**Benefits:**
- ✅ Automatically detects and displays ExoClick's built-in skip button
- ✅ Respects the `<Linear skipoffset>` attribute from VAST XML
- ✅ Fires all required VAST tracking events (impressions, clicks, skips)
- ✅ Better advertiser compliance and reporting
- ✅ Handles VPAID ads and interactive elements
- ✅ Full VAST 3.0+ feature support

### ❌ Manual Parser Approach (Legacy)

**File:** `src/components/player/PrerollAdPlayer.tsx`

This manually parses VAST XML and plays the video directly:

```tsx
// Parse VAST XML manually
const parser = new DOMParser();
const xmlDoc = parser.parseFromString(vastXml, 'text/xml');
const skipOffset = linear?.getAttribute('skipoffset');

// Set video source directly
playerRef.current.src({
  src: bestMediaFile,
  type: 'video/mp4'
});
```

**Limitations:**
- ❌ Only shows a custom skip button (not ExoClick's built-in one)
- ❌ Does not support VAST skip button elements
- ❌ May not fire all required tracking events
- ❌ Limited VAST compliance
- ❌ No VPAID support

## How ExoClick's Skip Button Works

### VAST XML Structure

When ExoClick enables the skip button, their VAST response includes:

```xml
<VAST version="3.0">
  <Ad>
    <InLine>
      <Creatives>
        <Creative>
          <Linear skipoffset="00:00:05">
            <MediaFiles>
              <MediaFile>...</MediaFile>
            </MediaFiles>
            <!-- Skip button elements -->
            <VideoClicks>
              <ClickTracking>...</ClickTracking>
            </VideoClicks>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>
```

### Skip Button Detection

The VAST plugin automatically:

1. **Parses the `skipoffset` attribute** to determine when the skip button should appear
2. **Detects skip button elements** in the VAST XML
3. **Renders ExoClick's native skip button** with proper styling and behavior
4. **Handles skip tracking** by firing the appropriate VAST events

### Integration in Your App

The integration is seamless in `MoviePlayer.tsx`:

```tsx
// Check if VAST ads are enabled
const vastAdsEnabled = process.env.NEXT_PUBLIC_VAST_ADS_ENABLED === 'true';
const vastUrl = process.env.NEXT_PUBLIC_EXOCLICK_VAST_TAG;

if (vastAdsEnabled && vastUrl) {
  return (
    <AdToIframePlayer
      vastUrl={vastUrl}
      iframeUrl={currentSrc}
      title={title}
    />
  );
}
```

Which uses `VastAdPlayer` for proper VAST compliance.

## Testing the Integration

### VAST Test Page

Visit `/vast-test` to test both approaches:

1. **VAST Plugin Mode**: Tests ExoClick's built-in skip button
2. **Manual Parser Mode**: Tests the legacy custom skip button

### Environment Variables

```bash
# Enable VAST ads and test page
NEXT_PUBLIC_VAST_ADS_ENABLED=true

# ExoClick VAST tag URL
NEXT_PUBLIC_EXOCLICK_VAST_TAG=https://your-exoclick-vast-url.xml
```

## Event Handling

### VAST Plugin Events

The VAST plugin fires comprehensive events:

```tsx
player.on('vast.adStart', () => {
  // Ad started playing
});

player.on('vast.adSkip', () => {
  // User clicked ExoClick's skip button
  onAdSkipped();
});

player.on('vast.adComplete', () => {
  // Ad completed naturally
  onAdComplete();
});

player.on('vast.adError', (event) => {
  // Ad failed to load or play
  onAdSkipped();
});
```

### Manual Parser Events

The manual approach only has basic VideoJS events:

```tsx
player.on('ended', () => {
  // Ad video ended
  onAdComplete();
});

// Custom skip button click
const handleSkip = () => {
  onAdSkipped();
};
```

## Migration Guide

### From Manual to VAST Plugin

1. **Replace** `PrerollAdPlayer` with `VastAdPlayer` in `AdToIframePlayer.tsx`
2. **Install** VideoJS and VAST plugin dependencies:
   ```bash
   npm install video.js @types/video.js videojs-vast-vpaid
   ```
3. **Test** with ExoClick ads to ensure skip button appears correctly
4. **Verify** that all VAST tracking events are fired

### Configuration Changes

No configuration changes needed - the environment variables remain the same:

- `NEXT_PUBLIC_VAST_ADS_ENABLED=true`
- `NEXT_PUBLIC_EXOCLICK_VAST_TAG=your-vast-url`

## Troubleshooting

### Skip Button Not Appearing

1. **Check VAST XML**: Verify ExoClick included `skipoffset` attribute
2. **Enable Debug Mode**: Set `debug: true` in VAST plugin options
3. **Check Console**: Look for VAST plugin error messages
4. **Test with Different Ads**: Some campaigns may not have skip enabled

### Tracking Issues

1. **Verify Plugin Events**: Ensure `vast.adSkip` events are firing
2. **Check Network Tab**: Verify tracking URLs are being called
3. **Test Ad Completion**: Ensure both skip and complete scenarios work

## Best Practices

1. **Always use the VAST plugin** for production ExoClick integration
2. **Keep the manual parser** only for debugging or fallback scenarios
3. **Test skip functionality** with actual ExoClick ads, not sample VAST files
4. **Monitor tracking events** to ensure advertiser compliance
5. **Handle errors gracefully** to avoid breaking the user experience

## Future Enhancements

- **VPAID Support**: The VAST plugin already supports interactive VPAID ads
- **Advanced Tracking**: Implement quartile tracking and custom events
- **A/B Testing**: Compare skip rates between different ad formats
- **Analytics Integration**: Track skip behavior in your analytics platform
