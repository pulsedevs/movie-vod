# Ad System Documentation

## Overview
The ad system is designed to provide flexible, trackable, and responsive advertisement functionality throughout the application. It consists of configuration management, tracking utilities, React hooks, and various ad components.

## Architecture

### Core Components

1. **Configuration** (`src/config/adConfig.ts`)
   - Ad configuration interfaces and defaults
   - Device-specific settings
   - Frequency capping rules
   - Ad network configurations

2. **Tracking** (`src/utils/adTracker.ts`)
   - Comprehensive ad event tracking
   - Session management
   - Analytics data collection
   - Batch event processing

3. **Hooks** (`src/hooks/useBannerAd.ts`)
   - React hook for banner ad functionality
   - State management and lifecycle
   - Intersection observer for impression tracking
   - Frequency capping enforcement

4. **Components** (various locations)
   - Banner ad components
   - Popup ad components
   - Test components for debugging

## Configuration

### Ad Types
- **Banner Ads**: Static or animated horizontal advertisements
- **Popup Ads**: Modal overlay advertisements
- **Native Ads**: Integrated content advertisements

### Device Responsiveness
The system automatically detects device types and applies appropriate configurations:
- **Mobile** (≤768px): Smaller banners, bottom positioning, touch optimization
- **Tablet** (≤1024px): Medium-sized ads, adaptive positioning
- **Desktop** (>1024px): Full-size ads, flexible positioning

### Frequency Capping
Prevents ad fatigue by limiting display frequency:
- Per-session limits
- Per-day limits
- Cooldown periods between displays
- Persistent storage of display counts

## Usage

### Basic Banner Ad
```tsx
import { useBannerAd } from '@/hooks/useBannerAd';

const MyComponent = () => {
  const [adState, adControls] = useBannerAd({
    adId: 'my-banner-ad',
    config: {
      position: 'top',
      displayDelay: 3000,
      autoClose: true
    },
    onShow: () => console.log('Ad shown'),
    onClose: () => console.log('Ad closed')
  });

  return (
    <div>
      {adState.isVisible && (
        <div className="banner-ad">
          Ad content here
          <button onClick={adControls.close}>Close</button>
        </div>
      )}
    </div>
  );
};
```

### Manual Tracking
```tsx
import { trackAdImpression, trackAdClick } from '@/utils/adTracker';

// Track when ad becomes visible
trackAdImpression('ad-id', 'banner', { source: 'homepage' });

// Track when user clicks ad
trackAdClick('ad-id', 'banner', { destination: 'external-site' });
```

## Event Tracking

### Tracked Events
- **Impression**: Ad becomes visible to user
- **Click**: User interacts with ad
- **Close**: User dismisses ad
- **Load**: Ad content finishes loading
- **Error**: Ad encounters loading or display error

### Event Data
Each event includes:
- Event type and timestamp
- Ad ID and type
- Device information
- Session data
- Custom metadata

### Data Flow
1. Events are collected locally
2. Batched for efficient transmission
3. Sent to `/api/tracking/ads` endpoint
4. Persisted for analytics

## Testing

### Test Components
- **AdTrackingTest** (`src/app/ads/AdTrackingTest.tsx`): Tests tracking functionality
- **Banner Test** (`src/components/ads/AdTrackingTest.tsx`): Tests banner hook
- **Mobile Test** (`src/app/mobile-test/page.tsx`): Mobile-specific testing

### Testing Procedure
1. Navigate to test pages
2. Use control buttons to trigger ad events
3. Monitor event history and session stats
4. Verify proper tracking and state management

## Configuration Options

### Banner Ad Config
```typescript
interface BannerAdConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'sidebar' | 'floating';
  displayDelay: number;      // ms before auto-show
  closeDelay: number;        // ms delay when closing
  maxDisplayTime: number;    // ms before auto-close
  width: number;            // px width
  height: number;           // px height
  animationType: 'slide' | 'fade' | 'bounce' | 'none';
  autoClose: boolean;       // auto-close after maxDisplayTime
  showCloseButton: boolean; // show X button
  clickThrough: boolean;    // allow click-through tracking
  trackingEnabled: boolean; // enable event tracking
  responsive: boolean;      // responsive behavior
  zIndex: number;          // CSS z-index
}
```

### Frequency Capping
```typescript
const frequencyCapping = {
  bannerAd: {
    maxPerSession: 5,        // max displays per session
    maxPerDay: 20,           // max displays per day
    cooldownPeriod: 300000   // ms between displays
  }
};
```

## Ad Networks

### Supported Networks
- **Google Ads**: Standard display advertising
- **SurfShark**: Affiliate partnership ads

### Integration
Networks are configured in `adConfig.ts` with:
- Enable/disable flags
- API keys and IDs
- Test mode settings

## Performance Considerations

### Optimization Features
- Lazy loading of ad content
- Intersection observer for accurate impression tracking
- Batched event transmission
- Local storage for frequency capping
- Minimal DOM manipulation

### Memory Management
- Automatic cleanup of event listeners
- Timeout clearing on component unmount
- Observer disconnection
- Event history pruning

## Debugging

### Debug Tools
- Browser console logging
- Test components with real-time stats
- Event history visualization
- Configuration inspection

### Common Issues
1. **Ads not showing**: Check frequency capping limits
2. **Tracking not working**: Verify network requests to `/api/tracking/ads`
3. **Mobile issues**: Test on actual devices, not just browser resize
4. **Performance issues**: Monitor event batch sizes and flush frequency

## API Endpoints

### `/api/tracking/ads`
- **Method**: POST
- **Purpose**: Receive batched tracking events
- **Payload**: AdTrackingData object with events array
- **Response**: Success/error status

## File Structure
```
src/
├── config/
│   └── adConfig.ts          # Configuration definitions
├── utils/
│   └── adTracker.ts         # Tracking utilities
├── hooks/
│   └── useBannerAd.ts       # Banner ad React hook
├── components/ads/
│   ├── SurfSharkBanner.tsx  # SurfShark affiliate banner
│   └── AdTrackingTest.tsx   # Component testing hook
└── app/
    ├── ads/
    │   └── AdTrackingTest.tsx # Tracking system test
    └── mobile-test/
        └── page.tsx          # Mobile optimization test
```

## Future Enhancements
- Video ad support
- A/B testing framework
- Advanced analytics dashboard
- Real-time ad performance metrics
- Machine learning optimization
- GDPR compliance features