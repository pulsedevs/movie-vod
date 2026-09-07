# Auto-Play Implementation

## Overview
The FourKPlayer now includes robust auto-play functionality that automatically starts video playback when buffering is complete.

## Features

### 🎬 Auto-Play Scenarios
1. **Initial Load**: Video starts playing automatically after initial loading completes (ONLY if no resume prompt)
2. **After Buffering**: Video resumes automatically when buffering is finished (not during resume prompt)
3. **Resume from Progress**: Video starts automatically when resuming from saved position
4. **Start Over**: Video starts automatically when user chooses to start from beginning

### 🔧 Smart Auto-Play Logic
- Only attempts auto-play when appropriate (not already playing, not manually paused)
- **Respects resume prompts**: Never auto-plays when user needs to choose resume vs start over
- Gracefully handles auto-play failures with visual feedback
- Distinguishes between initial load and buffering resume
- Clears auto-play states when user makes resume decisions

### 🎯 Browser Policy Handling
- Detects when auto-play is blocked by browser policies
- Shows visual indicator when auto-play fails
- Prompts user to manually click play when needed
- Clears failure state when user manually starts playback

## Implementation Details

### State Management
```typescript
const [autoPlayAttempted, setAutoPlayAttempted] = useState(false);
const [autoPlayFailed, setAutoPlayFailed] = useState(false);
```

### Auto-Play Triggers

#### 1. After Initial Loading (HLS)
```typescript
// In HLS initialization
setTimeout(async () => {
  setIsLoading(false);
  setLoadingProgress(100);
  onLoadComplete?.();
  
  // Auto-play video after initial loading completes
  // BUT NOT if there's a resume prompt - let user decide
  if (video && video.paused && !hasResumed && !showResumePrompt && savedProgress === 0) {
    setAutoPlayAttempted(true);
    try {
      await video.play();
      setAutoPlayFailed(false);
    } catch (playError) {
      setAutoPlayFailed(true);
    }
  } else if (showResumePrompt || savedProgress > 0) {
    console.log('⏸️ Auto-play skipped: Resume prompt available - waiting for user decision');
  }
}, 500);
```

#### 2. After Initial Loading (Direct Video)
```typescript
// In direct video initialization
setTimeout(async () => {
  setIsLoading(false);
  setLoadingProgress(100);
  onLoadComplete?.();
  
  // Auto-play video after initial loading completes
  if (video && video.paused && !hasResumed) {
    setAutoPlayAttempted(true);
    try {
      await video.play();
      setAutoPlayFailed(false);
    } catch (playError) {
      setAutoPlayFailed(true);
    }
  }
}, 500);
```

#### 3. After Buffering (CanPlay Event)
```typescript
const handleCanPlay = async () => {
  setIsBuffering(false);
  
  // Auto-play when video is ready to play (after buffering)
  // Only auto-play if:
  // 1. Video is paused
  // 2. User hasn't manually resumed from saved progress
  // 3. Video has been played before (not initial load)
  // 4. No resume prompt is showing (let user decide)
  if (video.paused && !hasResumed && currentTime > 0 && !showResumePrompt) {
    setAutoPlayAttempted(true);
    try {
      await video.play();
      setAutoPlayFailed(false);
    } catch (error) {
      setAutoPlayFailed(true);
    }
  } else if (showResumePrompt) {
    console.log('⏸️ Auto-play skipped after buffering: Resume prompt is active');
  }
};
```

#### 4. Resume from Saved Progress
```typescript
const resumeFromSaved = async () => {
  if (videoRef.current && savedProgress > 0 && !hasResumed) {
    videoRef.current.currentTime = savedProgress;
    setCurrentTime(savedProgress);
    setShowResumePrompt(false);
    setHasResumed(true);
    
    // Clear auto-play failure state when resuming
    setAutoPlayFailed(false);
    setAutoPlayAttempted(true);
    
    // Start playing the video automatically when resuming
    try {
      await videoRef.current.play();
    } catch (error) {
      setAutoPlayFailed(true);
    }
  }
};
```

#### 5. Start Over from Beginning
```typescript
const startOver = async () => {
  setShowResumePrompt(false);
  setHasResumed(true);
  
  // Clear auto-play states and attempt to auto-play from beginning
  setAutoPlayFailed(false);
  setAutoPlayAttempted(true);
  
  // Reset video to beginning and auto-play
  if (videoRef.current) {
    videoRef.current.currentTime = 0;
    setCurrentTime(0);
    
    try {
      await videoRef.current.play();
    } catch (error) {
      setAutoPlayFailed(true);
    }
  }
};
```

### Visual Feedback

#### Auto-Play Failed Indicator
```jsx
{/* Auto-play failed message */}
{autoPlayFailed && !isPlaying && (
  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm text-center max-w-xs">
    <div className="font-medium">Auto-play blocked</div>
    <div className="text-white/80 text-xs mt-1">
      Click play button to start
    </div>
  </div>
)}
```

#### Enhanced Play Button
```jsx
<button
  onClick={togglePlay}
  className={`bg-white/20 hover:bg-white/30 rounded-full p-4 transition-all duration-200 ${
    autoPlayFailed ? 'ring-4 ring-red-500/50 animate-pulse' : ''
  }`}
>
```

## Testing

### Manual Testing
1. **Initial Load Test**:
   - Load a video URL
   - Check if video starts playing automatically after loading
   - If auto-play fails, verify visual indicator appears

2. **Buffering Resume Test**:
   - Start playing a video
   - Seek to a position that causes buffering
   - Verify video resumes automatically when buffering completes

3. **Browser Policy Test**:
   - Test in different browsers (Chrome, Firefox, Safari, Edge)
   - Test with different auto-play policies
   - Verify graceful handling of auto-play failures

### Console Logging
The implementation includes detailed console logging:
- `🎬 Auto-playing video after buffering complete`
- `✅ Auto-play successful after buffering`
- `⚠️ Auto-play failed after buffering (browser policy)`

## Browser Compatibility

### Auto-Play Support by Browser
- **Chrome**: Requires user interaction or MEI score
- **Firefox**: Allows auto-play by default, can be disabled
- **Safari**: Strict auto-play policy, often requires user interaction
- **Edge**: Similar to Chrome

### Fallback Strategy
When auto-play fails:
1. Visual indicator shows auto-play was blocked
2. Play button gets attention-grabbing styling
3. User can manually click to start playback
4. Auto-play failure state clears once user plays

## Configuration

### Environment Variables
Auto-play respects existing subtitle configuration:
- `NEXT_PUBLIC_ENABLE_SUBTITLE_SEARCH`: Controls subtitle search
- `NEXT_PUBLIC_SUBTITLE_AUTO_LOAD`: Controls automatic subtitle loading

### Customization
Auto-play behavior can be customized by modifying:
- Auto-play trigger conditions
- Visual feedback styling
- Retry logic for failed auto-play attempts

## Best Practices

1. **User Experience**: Always provide clear feedback when auto-play fails
2. **Performance**: Auto-play should not interfere with video loading
3. **Accessibility**: Ensure keyboard navigation works with auto-play controls
4. **Mobile**: Test thoroughly on mobile devices where auto-play policies are stricter

## Future Enhancements

1. **Smart Auto-Play**: Learn from user behavior to predict when auto-play should be attempted
2. **Auto-Play Settings**: Allow users to enable/disable auto-play in player settings
3. **Background Play**: Support for background playback when tab is not active
4. **Picture-in-Picture**: Auto-enable PiP when user switches tabs during playback
