# VideoJS Contrib-Ads Timing Fix

## Problem Fixed
**Error**: "videojs-contrib-ads has not seen a loadstart event 5 seconds after being initialized, but a source is present. This indicates that videojs-contrib-ads was initialized too late."

## Root Cause
The `videojs-contrib-ads` plugin was being initialized inside the `player.ready()` callback, which is too late in the VideoJS lifecycle. The plugin must be initialized immediately after creating the VideoJS instance, in the same execution tick.

## Solutions Implemented

### 1. **Immediate Plugin Initialization**
- Moved `player.ads()` initialization outside of `player.ready()` callback
- Initialize contrib-ads immediately after creating the VideoJS player instance
- Added proper configuration options for timeouts and debugging

### 2. **Improved Script Loading Order**
- Load VideoJS CSS first
- Load VideoJS core second  
- Load contrib-ads plugin third (before any player initialization)
- Load VAST client last (optional dependency)
- Added proper error handling for each script

### 3. **Enhanced Video Element Setup**
- Added `preload="auto"` attribute to video element
- Included source in VideoJS player configuration
- Added proper data-setup attributes

### 4. **Better Ad Integration**
- Implemented proper contrib-ads workflow:
  - `startLinearAdMode()` when ad begins
  - `endLinearAdMode()` when ad completes
  - Proper event triggering (`adsready`)
- Added comprehensive ad event listeners:
  - `adstart`, `adend`, `aderror`, `adtimeout`
- Fallback to direct video replacement if contrib-ads unavailable

### 5. **Enhanced Error Handling**
- Better logging with categorized messages
- Graceful degradation if plugins fail to load
- Proper cleanup of event listeners

## Code Changes Made

### Script Loading (`useEffect` for dependencies):
```javascript
// Load in correct order:
1. VideoJS CSS
2. VideoJS Core  
3. Contrib-ads Plugin (BEFORE player init)
4. VAST Client (optional)
```

### Player Initialization:
```javascript
const player = window.videojs(videoRef.current, {
  // ... config with sources included
});

// Initialize contrib-ads IMMEDIATELY (same tick)
if (player.ads) {
  player.ads({
    debug: false,
    timeout: 8000,
    prerollTimeout: 8000,
    postrollTimeout: 8000
  });
}
```

### Ad Playback Workflow:
```javascript
// Proper contrib-ads workflow:
player.trigger('adsready');
player.ads.startLinearAdMode();
// ... play ad
player.ads.endLinearAdMode();
```

## Files Modified
- `src/components/player/VastTestPlayer.tsx` - Complete VideoJS integration fix

## Testing
- No compilation errors
- Proper plugin initialization order
- Enhanced error handling and logging
- Fallback mechanisms for missing dependencies

## Result
This fix should eliminate the "initialized too late" error and provide proper VAST ad integration with VideoJS contrib-ads plugin.
