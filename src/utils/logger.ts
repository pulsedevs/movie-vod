/**
 * Universal logger (browser + Node). Uses console with structured context.
 * Pino was removed from this module because bundlers resolve static requires
 * at compile time and pino is not suitable for client bundles.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

function formatContext(context?: Record<string, any>) {
  if (context && Object.keys(context).length > 0) {
    return context;
  }
  return undefined;
}

export const logger = {
  log: (message: string, context?: Record<string, any>) => {
    if (isDevelopment) {
      const ctx = formatContext(context);
      if (ctx !== undefined) {
        console.log(message, ctx);
      } else {
        console.log(message);
      }
    }
  },

  warn: (message: string, context?: Record<string, any>) => {
    const ctx = formatContext(context);
    if (ctx !== undefined) {
      console.warn(message, ctx);
    } else {
      console.warn(message);
    }

    if (!isDevelopment && typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          // Sentry package removed - dynamic import disabled
        } catch {
          // Sentry not available
        }
      }, 0);
    }
  },

  error: (error: Error | string, context?: Record<string, any>) => {
    const ctx = formatContext(context);
    if (error instanceof Error) {
      if (ctx !== undefined) {
        console.error(error, ctx);
      } else {
        console.error(error);
      }

      if (typeof window !== 'undefined') {
        setTimeout(() => {
          try {
            const sentryModule = (window as unknown as { __SENTRY_MODULE__?: { captureException: (e: Error, o: unknown) => void } }).__SENTRY_MODULE__;
            if (sentryModule) {
              sentryModule.captureException(error, {
                extra: context,
              });
            }
          } catch {
            // Sentry not available
          }
        }, 0);
      }
    } else {
      if (ctx !== undefined) {
        console.error(error, ctx);
      } else {
        console.error(error);
      }

      if (typeof window !== 'undefined') {
        setTimeout(() => {
          try {
            const sentryModule = (window as unknown as { __SENTRY_MODULE__?: { captureMessage: (m: string, o: unknown) => void } }).__SENTRY_MODULE__;
            if (sentryModule) {
              sentryModule.captureMessage(error, {
                level: 'error',
                extra: context,
              });
            }
          } catch {
            // Sentry not available
          }
        }, 0);
      }
    }
  },

  debug: (message: string, context?: Record<string, any>) => {
    if (isDevelopment) {
      const ctx = formatContext(context);
      if (ctx !== undefined) {
        console.log('[DEBUG]', message, ctx);
      } else {
        console.log('[DEBUG]', message);
      }
    }
  },

  info: (message: string, context?: Record<string, any>) => {
    const ctx = formatContext(context);
    if (ctx !== undefined) {
      console.info(message, ctx);
    } else {
      console.info(message);
    }
  },

  child: (bindings: Record<string, any>) => ({
    ...logger,
    log: (msg: string, ctx?: Record<string, any>) =>
      logger.log(msg, { ...bindings, ...ctx }),
    info: (msg: string, ctx?: Record<string, any>) =>
      logger.info(msg, { ...bindings, ...ctx }),
    warn: (msg: string, ctx?: Record<string, any>) =>
      logger.warn(msg, { ...bindings, ...ctx }),
    error: (err: Error | string, ctx?: Record<string, any>) =>
      logger.error(err, { ...bindings, ...ctx }),
    debug: (msg: string, ctx?: Record<string, any>) =>
      logger.debug(msg, { ...bindings, ...ctx }),
  }),

  get pino() {
    return null;
  },
};
