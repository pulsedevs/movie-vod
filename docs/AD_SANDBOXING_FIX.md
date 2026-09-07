# Ad Sandboxing Fix Documentation

## Issue
The `AdToIframePlayer.tsx` component was creating iframes directly without using the secure iframe utilities, bypassing the sandboxing and ad-blocking logic that was designed to prevent ads from being displayed.

## Root Cause
In `src/components/player/AdToIframePlayer.tsx`, the component was using a standard HTML `<iframe>` element:

```tsx
<iframe
  src={iframeUrl}
  className="w-full h-full border-0"
  allowFullScreen
  title={title}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
/>
```

This bypassed all the security logic in `src/lib/iframe-security.ts` that:
- Validates streaming domains against a trusted list
- Applies sandbox restrictions to prevent ad execution
- Logs security events for monitoring
- Sanitizes URLs to remove dangerous parameters

## Solution
Updated `AdToIframePlayer.tsx` to use the `createSecureIframe` function from the iframe security library:

```tsx
import { createSecureIframe } from '@/lib/iframe-security';

// Replace direct iframe with secure iframe
{createSecureIframe({
  src: iframeUrl,
  title: title,
  className: "w-full h-full border-0"
})}
```

## How the Secure Iframe Logic Works

### 1. Domain Validation
- Only allows iframes from trusted streaming domains listed in `TRUSTED_STREAMING_DOMAINS`
- Blocks any untrusted domains that might serve ads

### 2. Sandbox Restrictions
- Applies sandbox attributes to prevent JavaScript execution in ads
- Uses different sandbox levels based on domain trust
- Some domains that detect sandbox are handled with compatibility mode

### 3. URL Sanitization
- Removes potentially dangerous URL parameters
- Enforces HTTPS for security
- Logs all security events for monitoring

### 4. Ad Blocking Effect
When an ad URL is passed to the secure iframe system:
- If it's from an untrusted domain → iframe creation fails
- If it passes validation but has sandbox restrictions → ads can't execute properly
- Security logging captures all blocked attempts

## Files Changed
- `src/components/player/AdToIframePlayer.tsx` - Fixed to use secure iframe creation

## Files Validated (No Changes Needed)
- `src/components/player/MoviePlayer.tsx` - Already using `createSecureIframe`
- `src/components/player/VastTestPlayer.tsx` - Uses VideoJS, not direct iframes
- `src/lib/iframe-security.ts` - Core security logic intact
- All ad components in `src/components/ads/` - No direct iframe usage

## Security Status
✅ **All iframe creation now goes through secure validation**
✅ **Ad blocking through domain filtering and sandboxing is restored**
✅ **No bypass paths for untrusted iframe content**

## Testing
To verify the fix:
1. Check browser console for security events when player loads
2. Verify that ad iframes are either blocked or sandboxed
3. Monitor for "BLOCKED_UNSAFE_DOMAIN" or "iframe_created" log entries

## Notes
- The secure iframe logic allows legitimate streaming domains while blocking ad domains
- Sandbox detection bypasses are only used for specific trusted streaming providers
- All iframe security events are logged for monitoring and debugging
