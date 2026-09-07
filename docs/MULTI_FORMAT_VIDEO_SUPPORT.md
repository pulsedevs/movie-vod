# FourKPlayer - Multi-Format Video Support

The FourKPlayer now supports multiple video formats beyond just HLS streaming, making it compatible with a wide range of video content.

## Supported Video Formats

### 🎬 Streaming Formats
- **HLS (.m3u8)** - Adaptive bitrate streaming with multiple quality levels
  - Primary format for Cloudflare Stream and live content
  - Automatic quality switching based on network conditions
  - Support for 4K/1080p/720p/480p

### 📹 Direct Video Files
- **MP4 (.mp4)** - Universal compatibility across all browsers
- **WebM (.webm)** - Modern, efficient format (Chrome, Firefox, Opera)
- **MOV (.mov)** - Apple QuickTime format (best support in Safari)
- **AVI (.avi)** - Legacy format with broad compatibility
- **MKV (.mkv)** - Matroska container with high-quality video
- **OGG (.ogg/.ogv)** - Open source Theora/VP8 video

## Automatic Format Detection

The player automatically detects the video format based on the URL:

```typescript
// Examples of supported URLs
const videoUrls = {
  hls: 'https://stream.example.com/video.m3u8',
  mp4: 'https://cdn.example.com/video.mp4',
  webm: 'https://cdn.example.com/video.webm',
  mov: 'https://cdn.example.com/video.mov',
  avi: 'https://cdn.example.com/video.avi',
  mkv: 'https://cdn.example.com/video.mkv',
  ogg: 'https://cdn.example.com/video.ogg'
};
```

## Browser Compatibility

| Format | Chrome | Firefox | Safari | Edge | Notes |
|--------|--------|---------|--------|------|-------|
| HLS | ✅ HLS.js | ✅ HLS.js | ✅ Native | ✅ HLS.js | Best for streaming |
| MP4 | ✅ Native | ✅ Native | ✅ Native | ✅ Native | Universal support |
| WebM | ✅ Native | ✅ Native | ❌ No | ✅ Native | Modern efficient |
| MOV | ⚠️ Limited | ❌ No | ✅ Native | ⚠️ Limited | Apple ecosystem |
| AVI | ❌ No | ❌ No | ❌ No | ❌ No | Legacy format |
| MKV | ⚠️ Limited | ⚠️ Limited | ❌ No | ⚠️ Limited | High-quality |
| OGG | ✅ Native | ✅ Native | ❌ No | ⚠️ Limited | Open source |

## Usage

```tsx
import FourKPlayer from '@/components/player/FourKPlayer';

// The player will automatically detect and handle any supported format
<FourKPlayer 
  streamUrl="https://example.com/video.mp4" // Any supported format
  title="My Video"
  poster="https://example.com/poster.jpg"
  mediaId="12345"
  mediaType="movie"
  imdbId="tt1234567"
  year={2024}
  onError={(error) => console.error('Player error:', error)}
  onLoadStart={() => console.log('Loading started')}
  onLoadComplete={() => console.log('Loading completed')}
/>
```

## Features for All Formats

- **Auto-detection**: Automatically detects and configures for the video format
- **Quality detection**: Shows appropriate quality labels (4K, 1080p, etc.)
- **Subtitle support**: Works with all formats for subtitle loading
- **Chromecast**: Uses correct MIME type for each format
- **Error handling**: Provides specific error messages for unsupported formats
- **Progressive loading**: Shows loading progress for all video types

## Format-Specific Features

### HLS Streaming (.m3u8)
- Adaptive bitrate switching
- Multiple quality levels (Auto, 4K, 1080p, 720p, 480p)
- Buffering optimization
- Live stream support

### Direct Video Files
- Progressive download
- Single quality (determined by source resolution)
- Faster initial load (no manifest parsing)
- Better for shorter content

## Error Handling

The player provides helpful error messages when formats aren't supported:

```
❌ WebM Video Not Supported

🔧 Your browser doesn't support WebM video format.

💡 Solutions:
• Try Chrome, Firefox, or Opera (better WebM support)
• Request an MP4 version of this content
• Use the standard player below as fallback
```

## Technical Implementation

The format detection uses URL analysis and MIME type mapping:

```typescript
const detectVideoFormat = (url: string) => {
  // Case-insensitive detection
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('.m3u8')) {
    return { format: 'hls', mimeType: 'application/x-mpegURL' };
  } else if (urlLower.includes('.mp4')) {
    return { format: 'mp4', mimeType: 'video/mp4' };
  }
  // ... other formats
};
```

## Best Practices

1. **Prefer MP4** for maximum compatibility
2. **Use HLS** for adaptive streaming and longer content
3. **Provide fallbacks** when using less common formats
4. **Test across browsers** when using WebM, MOV, or other specific formats
5. **Include proper error handling** for unsupported format scenarios

## Migration from HLS-Only

If you were previously using HLS-only URLs, the player is fully backward compatible:

```tsx
// This still works exactly as before
<FourKPlayer streamUrl="https://stream.example.com/video.m3u8" />

// And now this also works
<FourKPlayer streamUrl="https://cdn.example.com/video.mp4" />
```

## Future Enhancements

- **Format conversion**: Automatic fallback to compatible formats
- **Multi-source support**: Multiple format URLs for the same content
- **Codec detection**: Advanced codec compatibility checking
- **Adaptive switching**: Switch between formats based on network conditions
