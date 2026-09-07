# Sentry & Pino Setup Guide

## Overview

This project now uses:
- **Sentry** - Production error tracking and monitoring
- **Pino** - Structured logging with pretty printing in development

## ✅ Installation Complete

The following packages have been added to `package.json`:
- `@sentry/nextjs` - Sentry integration for Next.js
- `pino` - Fast, structured logger
- `pino-pretty` - Pretty printing for development

## 📦 Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@sentry/nextjs@^8.45.0`
- `pino@^9.6.0`
- `pino-pretty@^14.0.0`

### 2. Get Your Sentry DSN

1. **Sign up for Sentry**: https://sentry.io/signup/ (Free tier available)
2. **Create a new project**:
   - Choose "Next.js" as the platform
   - Copy your DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)
3. **Add DSN to `.env.local`**:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx  # Optional, for server-side
   ```

### 3. Environment Variables

Add to your `.env.local`:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
SENTRY_DSN=your-sentry-dsn-here  # Optional, for server-side

# Logging Configuration (Optional)
LOG_LEVEL=info  # Options: trace, debug, info, warn, error, fatal
```

## 🔧 Configuration Files Created

1. **sentry.client.config.ts** - Client-side error tracking
2. **sentry.server.config.ts** - Server-side error tracking
3. **sentry.edge.config.ts** - Edge runtime error tracking
4. **instrument.ts** - Server initialization

## 📝 Usage

### Using the Logger

The logger utility (`src/utils/logger.ts`) now uses pino:

```typescript
import { logger } from '@/utils/logger';

// Development: Pretty printed, colored output
// Production: Structured JSON logs
logger.info('User logged in', { userId: '123' });
logger.warn('API rate limit approaching', { remaining: 5 });
logger.error(new Error('Database connection failed'));
logger.debug('Debug information', { data: someData });

// Create child logger with context
const userLogger = logger.child({ userId: '123' });
userLogger.info('User action performed');
```

### Automatic Sentry Integration

Errors are automatically sent to Sentry:

1. **Error Boundaries** - All errors caught by error boundaries are sent
2. **Logger Errors** - `logger.error()` automatically sends to Sentry
3. **Security Events** - Iframe security events are tracked
4. **Unhandled Errors** - Global error handlers capture unhandled errors

### Manual Sentry Usage

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exceptions
try {
  // risky code
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'payment' },
    extra: { userId: user.id },
  });
}

// Capture messages
Sentry.captureMessage('Something went wrong', {
  level: 'warning',
  tags: { area: 'api' },
});

// Add context
Sentry.setUser({ id: user.id, email: user.email });
Sentry.setTag('feature', 'watch-party');
Sentry.setContext('device', { type: 'mobile', os: 'iOS' });
```

## 🎯 Features

### Sentry Features

- ✅ **Error Tracking** - Automatic error capture from error boundaries
- ✅ **Performance Monitoring** - Track slow API routes and components
- ✅ **Session Replay** - Record user sessions when errors occur (10% sample rate)
- ✅ **Source Maps** - Full stack traces with source code
- ✅ **Release Tracking** - Track errors by deployment version
- ✅ **Filtering** - Chunk load errors are filtered (handled by ChunkErrorBoundary)
- ✅ **Error Grouping** - Similar errors are automatically grouped

### Pino Features

- ✅ **Structured Logging** - JSON logs in production
- ✅ **Pretty Printing** - Human-readable logs in development
- ✅ **Performance** - One of the fastest Node.js loggers
- ✅ **Log Levels** - trace, debug, info, warn, error, fatal
- ✅ **Child Loggers** - Create contextual loggers
- ✅ **Zero Dependencies** - Minimal bundle impact

## 🔍 What Gets Tracked

### Automatically Tracked

- ✅ React error boundaries (`error.tsx`, `ErrorBoundary`, `ChunkErrorBoundary`)
- ✅ Unhandled promise rejections
- ✅ Uncaught exceptions
- ✅ Security events (iframe blocking)
- ✅ Logger errors and warnings (in production)

### Filtered Out

- ❌ ChunkLoadError (handled by ChunkErrorBoundary)
- ❌ Expected network errors (streaming source tests)
- ❌ Development-only errors

## 📊 Monitoring Dashboard

After setup, you can:

1. **View Errors**: https://sentry.io/organizations/your-org/issues/
2. **Performance**: Track slow API routes and components
3. **Releases**: See which deployments introduced errors
4. **Users**: Track errors by user ID
5. **Alerts**: Set up email/Slack notifications
6. **Session Replay**: Watch user sessions when errors occur

## 🚀 Next Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Add Sentry DSN** to `.env.local`

3. **Test Error Tracking**:
   ```typescript
   // In development, trigger an error to test
   throw new Error('Test error');
   ```

4. **Check Sentry Dashboard** - Verify errors are appearing

5. **Set Up Alerts** - Configure notifications for critical errors

6. **Add User Context** - Track errors by user ID in your auth flow

## 🔒 Security

- ✅ DSN is safe to expose in client-side code
- ✅ Sentry automatically filters sensitive data (passwords, tokens, etc.)
- ✅ No user data is sent unless explicitly added
- ✅ Source maps are optional (recommended for production)
- ✅ Session replay masks sensitive data by default

## 📚 Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Pino Documentation](https://getpino.io/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Pino Best Practices](https://getpino.io/#/docs/best-practices)

## 🐛 Troubleshooting

### Errors not appearing in Sentry?

1. ✅ Check DSN is set correctly in `.env.local`
2. ✅ Verify DSN is accessible (not blocked by firewall)
3. ✅ Check browser console for Sentry initialization errors
4. ✅ Ensure you're in production mode or have debug enabled
5. ✅ Check Sentry project settings - ensure it's active

### Logs not showing in development?

- ✅ Pino-pretty should automatically format logs
- ✅ Check `LOG_LEVEL` is set to `debug` or lower
- ✅ Verify pino-pretty is installed: `npm list pino-pretty`

### Performance impact?

- ✅ Sentry samples 10% of transactions in production
- ✅ Pino is one of the fastest loggers available
- ✅ Minimal performance impact in production (< 1% overhead)

### TypeScript errors?

- ✅ Run `npm install` to ensure types are installed
- ✅ Restart TypeScript server in your IDE
- ✅ Check that `@sentry/nextjs` types are available

## 📈 Production Checklist

- [ ] Sentry DSN added to production environment variables
- [ ] Source maps uploaded to Sentry (optional but recommended)
- [ ] Alerts configured for critical errors
- [ ] User context added to track errors by user
- [ ] Release tracking enabled
- [ ] Performance monitoring verified
- [ ] Session replay tested

## 🎉 Benefits

- **Better Debugging**: Full stack traces with source code
- **Proactive Monitoring**: Get notified of errors before users report them
- **Performance Insights**: Track slow API routes and components
- **User Context**: See which users are affected by errors
- **Structured Logs**: Easy to parse and analyze in production
- **Development Experience**: Pretty printed logs in development
