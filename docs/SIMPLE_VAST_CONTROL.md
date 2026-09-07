# Simple VAST Ad Control

## How to Control VAST Ads

**To DISABLE ads (default):**
```bash
NEXT_PUBLIC_VAST_ADS_ENABLED=false
```

**To ENABLE ads:**
```bash
NEXT_PUBLIC_VAST_ADS_ENABLED=true
```

## That's It!

1. **Edit `.env.local`** - Change the value
2. **Restart your dev server** - `npm run dev`
3. **Done!** - Ads will be enabled/disabled site-wide

## What It Controls

- ✅ **Movie preroll ads** - Shows before movie content (with ExoClick skip button support!)
- ✅ **VAST test page** - `/vast-test` page access
- ✅ **All ad components** - Complete ad system toggle

## New: ExoClick Skip Button Support! 🎯

The system now properly supports **ExoClick's built-in skip button**:

- ✅ **Automatic Detection** - Skip button appears when ExoClick enables it
- ✅ **VAST Compliance** - Uses videojs-vast-vpaid plugin for full VAST 3.0+ support
- ✅ **Proper Tracking** - Fires all required VAST tracking events
- ✅ **No Custom Code** - Skip button handled automatically by VAST plugin

## VAST URL Used
Your current ad URL: `https://guidepaparazzisurface.com/ceef/gdt3g0/tbt/2072907/tlk.xml`

## Testing
1. Set `NEXT_PUBLIC_VAST_ADS_ENABLED=true`
2. Visit `/vast-test` to test both VAST approaches:
   - **VAST Plugin Mode**: Tests ExoClick's built-in skip button ✅
   - **Manual Parser Mode**: Tests legacy custom skip button ❌
3. Visit any movie page to see preroll ads with proper skip button
4. Set to `false` to disable everything

Simple as that! 🎯

## Technical Details

See `docs/EXOCLICK_SKIP_BUTTON_INTEGRATION.md` for complete technical documentation.
