# 4K Content Configuration Guide - Cloudflare Stream Edition

## Overview

Your movie app now supports premium 4K content with **Cloudflare Stream** integration! This system uses Firebase Remote Config to control which movies and TV shows have 4K versions available, delivering them through Cloudflare's global CDN with adaptive bitrate streaming.

## Key Features

- ✅ **HLS.js Integration** - Adaptive bitrate streaming
- ✅ **Automatic Quality Switching** - Based on user's bandwidth
- ✅ **Cloudflare Stream** - Professional video hosting
- ✅ **Global CDN** - Fast delivery worldwide
- ✅ **Firebase Remote Config** - Dynamic content control
- ✅ **Codec Detection** - Early warning for unsupported formats

## ⚠️ Important: Codec Compatibility

### H.265/HEVC Limitations

Most browsers **do not support H.265/HEVC** codec due to licensing restrictions:

- ❌ **Chrome, Firefox, Edge**: No H.265 support
- ✅ **Safari (Mac/iOS)**: Limited H.265 support
- ❌ **Android browsers**: Generally no H.265 support

### Recommended Solution

**Always use H.264 codec for maximum compatibility**:

```bash
# Convert H.265 to H.264 using FFmpeg
ffmpeg -i input_h265.mp4 -c:v libx264 -crf 18 -preset slow -c:a aac -b:a 128k output_h264.mp4
```

### Codec Diagnostic Tool

Visit `/admin` → "Run Codec Test" to check browser support for various codecs.

## Firebase Remote Config Setup

### Parameter: `fourKAvailability`

Add this parameter to your Firebase Remote Config console:

**Parameter key**: `fourKAvailability`  
**Data type**: `JSON`  
**Default value**:
```json
{
  "movies": {},
  "tvShows": {}
}
```

## Adding 4K Movies

To make a movie available in 4K, update the `fourKAvailability` parameter:

```json
{
  "movies": {
    "550": {
      "available": true,
      "streamUrl": "https://customer-f33zs165nr7gyfy4.cloudflarestream.com/6b9e68b07dfee8cc2d116e4c51d6a957/manifest/video.m3u8",
      "streamId": "6b9e68b07dfee8cc2d116e4c51d6a957",
      "qualities": ["4K", "1080p", "720p"]
    },
    "680": {
      "available": true,
      "streamUrl": "https://customer-f33zs165nr7gyfy4.cloudflarestream.com/abcd1234efgh5678ijkl9012mnop3456/manifest/video.m3u8",
      "streamId": "abcd1234efgh5678ijkl9012mnop3456"
    }
  },
  "tvShows": {}
}
```

## Adding 4K TV Shows

For TV shows, you can specify per-episode URLs:

```json
{
  "movies": {},
  "tvShows": {
    "1399": {
      "available": true,
      "episodes": {
        "s01e01": "https://customer-f33zs165nr7gyfy4.cloudflarestream.com/got-s01e01-4k/manifest/video.m3u8",
        "s01e02": "https://customer-f33zs165nr7gyfy4.cloudflarestream.com/got-s01e02-4k/manifest/video.m3u8"
      },
      "qualities": ["4K", "1080p", "720p"]
    }
  }
}
```

## Cloudflare Stream URL Format

Your Cloudflare Stream URLs follow this pattern:
```
https://customer-{customer-code}.cloudflarestream.com/{video-id}/manifest/video.m3u8
```

### How to Get Your Stream URLs:

1. **Upload video to Cloudflare Stream**
2. **Get the Video ID** from the dashboard
3. **Use the manifest URL** for HLS streaming

Example upload via API:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -F file=@movie.mp4 \
  https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/stream
```

## Player Capabilities

### ✅ **Adaptive Streaming**
- Automatic quality switching based on bandwidth
- Seamless quality transitions
- Buffer-aware streaming

### ✅ **Professional Controls**
- Play/Pause with keyboard shortcuts
- Seek/scrub timeline
- Volume control and mute
- Fullscreen support
- Quality selector (Auto, 4K, 1080p, 720p)

### ✅ **HLS.js Features**
- Cross-browser compatibility
- Error recovery and fallbacks
- Native Safari HLS support
- Adaptive bitrate algorithm

### ✅ **Visual Features**
- 4K Ultra HD branding
- Adaptive streaming indicator
- Real-time quality display
- Loading and buffering states
- Professional gradient styling

## Video Requirements

### **Recommended Settings:**
- **Container**: MP4 (H.264/H.265)
- **Resolution**: 3840x2160 (4K), 1920x1080 (1080p), 1280x720 (720p)
- **Bitrate**: 15-25 Mbps (4K), 5-8 Mbps (1080p), 2-4 Mbps (720p)
- **Audio**: AAC, 128-256 kbps
- **Frame Rate**: 24, 30, or 60 fps

### **Cloudflare Stream Processing:**
Cloudflare automatically creates multiple quality levels from your source video, so you only need to upload the highest quality version.

## How It Works

1. **User visits movie/TV page**
2. **App checks Firebase Remote Config** for `fourKAvailability`
3. **If 4K available**: 
   - Loads HLS.js player
   - Fetches Cloudflare Stream manifest
   - Enables adaptive streaming
4. **If not available**: Falls back to regular iframe sources
5. **User gets**:
   - Automatic quality switching
   - Professional video player
   - Global CDN delivery

## Testing Your Setup

1. **Upload a test video** to Cloudflare Stream
2. **Add to Firebase Remote Config**:
```json
{
  "movies": {
    "12345": {
      "available": true,
      "streamUrl": "https://customer-your-code.cloudflarestream.com/your-video-id/manifest/video.m3u8"
    }
  }
}
```

3. **Visit the movie page** for ID 12345
4. **You should see**:
   - Blue "Premium 4K Ultra HD Streaming" header
   - HLS player with adaptive quality
   - Green "ADAPTIVE" badge
   - Quality selector with "Auto" option

## Cost & Performance Benefits

### **Cloudflare Stream Advantages:**
- ✅ **Global CDN** - Fast delivery worldwide
- ✅ **Automatic Transcoding** - Multiple quality levels
- ✅ **Adaptive Streaming** - Optimal user experience
- ✅ **Analytics** - Built-in viewing statistics
- ✅ **Security** - Signed URLs and access controls

### **Cost Optimization:**
- Pay per minute of video stored and delivered
- No bandwidth charges (unlike traditional CDNs)
- Automatic optimization reduces storage costs

## Troubleshooting

### **4K Not Showing**
- Check Firebase Remote Config parameter is `fourKAvailability`
- Verify JSON syntax is valid
- Ensure movie/TV ID matches TMDB ID
- Check browser console for HLS errors

### **Video Won't Load**
- Verify Cloudflare Stream URL is correct
- Check video processing status in Cloudflare dashboard
- Test URL directly: `curl -I [stream-url]`
- Check browser HLS support

### **Quality Not Switching**
- Verify multiple quality levels exist in stream
- Check network conditions (slow networks may lock to low quality)
- Monitor HLS.js logs in browser console

### **Performance Issues**
- Check Cloudflare Stream analytics
- Monitor bandwidth usage
- Verify CDN delivery locations

## Example Complete Configuration

```json
{
  "movies": {
    "550": {
      "available": true,
      "streamUrl": "https://customer-abc123.cloudflarestream.com/fight-club-4k/manifest/video.m3u8",
      "streamId": "fight-club-4k-stream-id",
      "qualities": ["4K", "1080p", "720p"]
    },
    "680": {
      "available": true,
      "streamUrl": "https://customer-abc123.cloudflarestream.com/pulp-fiction-4k/manifest/video.m3u8",
      "streamId": "pulp-fiction-4k-stream-id"
    }
  },
  "tvShows": {
    "1399": {
      "available": true,
      "episodes": {
        "s01e01": "https://customer-abc123.cloudflarestream.com/got-s01e01/manifest/video.m3u8",
        "s01e02": "https://customer-abc123.cloudflarestream.com/got-s01e02/manifest/video.m3u8"
      }
    }
  }
}
```

## Troubleshooting Common Issues

### Error: "Unsupported Video Codec (H.265/HEVC)"

**Problem**: Your stream contains H.265/HEVC codec which most browsers don't support.

**Solutions**:
1. **Convert to H.264** (Recommended):
   ```bash
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac output.mp4
   ```

2. **Use Cloudflare Stream's transcoding**:
   - Upload your original file to Cloudflare Stream
   - Stream will automatically create H.264 versions

3. **Browser alternatives**:
   - Try Safari on Mac/iOS (limited H.265 support)
   - Use the fallback iframe player

### Error: "Network error" or CORS issues

**Problem**: Browser can't access the HLS manifest.

**Solutions**:
1. **Check Cloudflare Stream settings**:
   - Ensure your domain is allowlisted
   - Check if the stream is public or requires authentication

2. **Verify URLs**:
   - Test the manifest URL directly in browser
   - Ensure it returns valid M3U8 content

### Error: "Media error" during playback

**Problem**: Stream loads but fails during playback.

**Solutions**:
1. **Check video format**:
   - Use MP4 container with H.264 video + AAC audio
   - Avoid exotic codecs or containers

2. **Verify encoding settings**:
   - Use progressive scan (no interlacing)
   - Standard frame rates (23.976, 24, 25, 29.97, 30 fps)

### Debug Tools

1. **Admin Panel**: `/admin` → "Run Codec Test"
2. **Browser DevTools**: Check Network tab for failed requests
3. **Console Logs**: Look for detailed HLS.js error messages

This setup provides professional-grade video streaming with adaptive quality, global CDN delivery, and complete control over your 4K content library!
