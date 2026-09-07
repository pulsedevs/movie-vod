# Ad Environment Controls 🎛️

## Overview

You can now control the Native Banner Ads and Pop-Under Ads using environment variables. This gives you complete control over when ads are shown without modifying the code.

## Environment Variables

### Native Banner Ads
```bash
NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=true   # Enable native banner ads
NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=false  # Disable native banner ads
```

### Pop-Under Ads
```bash
NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=true   # Enable pop-under ads
NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=false  # Disable pop-under ads
```

## How It Works

### Native Banner Ads 📢
- **Location**: Below video player in `MoviePlayer.tsx`
- **Ad Network**: `jr.cowpencinclis.com` (Script ID: 127976)
- **Control**: When `NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=false`, the component returns `null` and no ad script is loaded

### Pop-Under Ads 🪟
- **Location**: Global - loaded in `layout.tsx`
- **Ad Network**: `aw.ericasfz.com` (Script ID: 127975)
- **Control**: When `NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=false`:
  - Component returns `null`
  - User toggle is hidden from header
  - Admin preferences panel shows "DISABLED via environment variable"
  - No ad script is loaded regardless of user preference

## Priority System

For **Pop-Under Ads**, there's a two-level control system:

1. **Environment Variable** (Highest Priority)
   - If `NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=false`, ads are completely disabled
   - User controls are hidden/disabled
   - No scripts load

2. **User Preference** (Secondary)
   - Only works when environment variable is `true`
   - Users can toggle ads on/off for 24 hours
   - Auto re-enables after 24 hours

## Current Settings

In your `.env.local` file:
```bash
# --- AD CONTROL VARIABLES ---
NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=true
NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=true
```

## How to Use

### To Disable All Ads Temporarily
```bash
NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=false
NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=false
```

### To Enable Only Native Banner Ads
```bash
NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=true
NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=false
```

### To Enable Only Pop-Under Ads
```bash
NEXT_PUBLIC_NATIVE_BANNER_ADS_ENABLED=false
NEXT_PUBLIC_POP_UNDER_ADS_ENABLED=true
```

## Admin Interface

The Ad Preferences Toggle now shows:

### Environment Status
- 🟢 **ENABLED** - Environment variable is `true`
- 🔴 **DISABLED** - Environment variable is `false`

### Combined Status
- ✅ **Active** - Both environment and user preference allow ads
- ❌ **Inactive** - Either environment or user preference blocks ads

## Testing

1. **Change environment variables** in `.env.local`
2. **Restart your development server** (`npm run dev`)
3. **Check the admin preferences panel** to see the status
4. **Test both ad types** on the movie player page

## Benefits

- 🎛️ **Complete Control** - Turn ads on/off instantly via environment
- 🚀 **No Code Changes** - Control ads without touching the codebase
- 🔍 **Clear Status** - Admin panel shows exactly what's enabled/disabled
- ⚡ **Performance** - Disabled ads don't load any scripts
- 🛡️ **User Respect** - When environment disables ads, user controls are hidden

## Notes

- Environment variables take precedence over user preferences
- Changes require a server restart in development
- In production, you can update environment variables via your hosting platform
- All existing VAST video ads still use the existing `NEXT_PUBLIC_VAST_ADS_ENABLED` variable
