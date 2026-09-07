# Source Index Reference Guide

## Your Source Configuration:

| Display Name | Environment Variable | Index | Firebase Value | URL Base |
|-------------|---------------------|-------|---------------|----------|
| Source 1    | STREAM_BASE_01      | 0     | 0             | vidsrc.co |
| Source 2    | STREAM_BASE_02      | 1     | 1             | spencerdevs.xyz |
| Source 3    | STREAM_BASE_03      | 2     | 2             | vidora.su |
| Source 4    | STREAM_BASE_04      | 3     | 3             | videasy.net |
| Source 5    | STREAM_BASE_05      | 4     | 4             | vidlink.pro |
| Source 6    | STREAM_BASE_06      | 5     | 5             | vidfast.pro |
| Source 7    | STREAM_BASE_07      | 6     | 6             | bludclart.com |
| Source 8    | STREAM_BASE_08      | 7     | 7             | veloratv.ru |
| **Source 9** | **STREAM_BASE_09**  | **8** | **8**         | **vidsrc.su** |
| Source 10   | STREAM_BASE_10      | 9     | 9             | cinetaro.tv (special; see below) |
| Source 11   | STREAM_BASE_11      | 10    | 10            | 111movies.com |

### Cinetaro (`STREAM_BASE_10_*`)

Use the **same** movie and TV base URL, ending right after `id=` (see `.env.local`). The app builds:

- **Movie:** `{base}{tmdbId}-movie&server=maple&embed=true`
- **TV:** `{base}{tmdbId}-{season}-{episode}&server=maple&embed=true`

## Current Firebase Settings:

```json
{
  "574475": 8
}
```

This means:
- Movie ID `574475` should use **Source 9 (vidsrc.su)**
- Index `8` = Source 9 in your environment variables

## What You're Seeing:

- **Firebase value**: `8` ✅ (Correct)
- **Expected source**: Source 9 (vidsrc.su) ✅
- **UI shows**: "source 4" ❌ (This is confusing display)

## The Issue:

The UI is showing "source 4" but you're actually getting **Source 5** (Index 4 = vidlink.pro), not Source 9.

This suggests there might be:
1. A caching issue with localStorage user preferences
2. The Remote Config value isn't being applied correctly
3. The Firebase fetch is failing silently

## Quick Test:

1. **Clear localStorage**: Open DevTools → Application → Local Storage → Clear all
2. **Visit the movie again**: The Firebase Remote Config should now take priority
3. **Check console logs**: Look for the debug messages I added

## Firebase Values for Common Sources:

If you want to force specific sources:
- **Source 9 (vidsrc.su)**: Set Firebase value to `8`
- **Source 10 (vidsrc.cc)**: Set Firebase value to `9`  
- **Source 1 (vidsrc.co)**: Set Firebase value to `0`
