// Stub for Sentry when not installed
// This prevents build errors when @sentry/nextjs is not available

export const captureException = () => {};
export const captureMessage = () => {};
export const init = () => {};
export const replayIntegration = () => ({});

export default {
  captureException,
  captureMessage,
  init,
  replayIntegration,
};
