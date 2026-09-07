# Firebase Remote Config for Source Overrides

This implementation allows you to dynamically control movie and TV show source priorities through Firebase Remote Config, without requiring app deployments.

## Features

- **Real-time Updates**: Change source priorities instantly from Firebase Console
- **Emergency Controls**: Disable problematic sources immediately
- **A/B Testing**: Test different source configurations for different user segments  
- **Fallback System**: Hard-coded defaults ensure app works even if Firebase is unavailable
- **Performance**: Cached configurations with 1-hour refresh interval

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing one
3. Enable **Remote Config** in the left sidebar

### 2. Configure Environment Variables

Copy your Firebase config to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Set Up Remote Config Parameters

In Firebase Console → Remote Config, add these parameters:

#### `movie_source_overrides` (JSON)
Maps TMDB movie IDs to source indices (0-based):
```json
{
  "574475": 3,
  "123456": 1,
  "789012": 2
}
```

#### `tv_source_overrides` (JSON)  
Maps TMDB TV show IDs to source indices (0-based):
```json
{
  "67890": 2,
  "54321": 0
}
```

#### `default_movie_source` (Number)
Default source index for movies (0-based): `0`

#### `default_tv_source` (Number)
Default source index for TV shows (0-based): `0`

#### `emergency_source_disable` (JSON Array)
List of source indices to disable immediately:
```json
[1, 3]
```

#### `source_health_check_enabled` (Boolean)
Enable/disable source health monitoring: `true`

## Usage

### Dashboard Access (Development Only)

Visit `/admin` in development mode to access the Remote Config dashboard:
- View current configuration
- Test source resolution for specific movie/TV IDs
- See emergency disabled sources
- Direct link to Firebase Console

### Programmatic Usage

The system automatically integrates with your existing source override logic:

```typescript
import useRemoteSourceOverrides from '@/hooks/useRemoteSourceOverrides';

const { getSourceForMovie, getSourceForTv, isSourceDisabled } = useRemoteSourceOverrides();

// Get source for a movie
const movieSource = getSourceForMovie('574475'); // Returns: 3

// Get source for a TV show  
const tvSource = getSourceForTv('67890'); // Returns: 2

// Check if source is disabled
const disabled = isSourceDisabled(1); // Returns: true if source 1 is disabled
```

## Configuration Examples

### Basic Setup
```json
{
  "movie_source_overrides": {"574475": 3},
  "tv_source_overrides": {},
  "default_movie_source": 0,
  "default_tv_source": 0,
  "emergency_source_disable": [],
  "source_health_check_enabled": true
}
```

### Emergency Response
Instantly disable Source 2 (index 1) across all content:
```json
{
  "emergency_source_disable": [1]
}
```

### A/B Testing Setup
1. Create conditions in Firebase Console
2. Set different `movie_source_overrides` for different user groups
3. Monitor performance metrics

### Regional Configurations
Set different defaults based on user location using Firebase's built-in targeting:
- US users: `default_movie_source: 0`
- EU users: `default_movie_source: 2`

## Priority System

The source selection follows this priority order:
1. **User Preference** (saved in localStorage)
2. **URL Parameter** (for watch parties)
3. **Firebase Remote Config Override** (for specific movie/TV ID)
4. **Firebase Remote Config Default** (default source index)
5. **Hard-coded Fallback** (from sourceOverride.ts)

## Emergency Procedures

### Disable Problematic Source
1. Open Firebase Console → Remote Config
2. Edit `emergency_source_disable` parameter
3. Add source index to the array: `[1, 3]`
4. Click "Publish changes"
5. Changes take effect within 1 hour (or force refresh in admin panel)

### Rollback Configuration
1. Firebase Console → Remote Config → History
2. Select previous working version
3. Click "Rollback to this version"

## Monitoring

- Check admin dashboard for configuration status
- Monitor browser console for Remote Config logs
- Use Firebase Analytics to track source performance
- Set up alerts for failed configuration fetches

## Troubleshooting

### Configuration Not Loading
1. Check environment variables are set correctly
2. Verify Firebase project has Remote Config enabled
3. Check browser console for errors
4. Use admin dashboard to manually refresh config

### Sources Not Updating  
1. Check if emergency disable list includes the source
2. Verify parameter names match exactly
3. Ensure JSON formatting is valid
4. Wait up to 1 hour for automatic refresh

### Firebase Unavailable
The app automatically falls back to hard-coded values in `sourceOverride.ts`, ensuring continued functionality even if Firebase is down.

## Security Considerations

- Remote Config values are public - don't store sensitive data
- Use parameter validation to prevent injection attacks
- Monitor configuration changes through Firebase Console audit logs
- Implement rate limiting for configuration fetches if needed

## Development Tools

- **Admin Dashboard**: `/admin` (development only)
- **Browser Console**: Look for "Remote Config" logs
- **Firebase Console**: Direct configuration management
- **Hot Reloading**: Changes reflect immediately in development
