// Stub for pino when not installed
// This prevents build errors when pino is not available

const stubLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  child: () => stubLogger,
};

// Export as both default and named to match pino's API
const stubPino = () => stubLogger;
(stubPino as any).child = () => stubLogger;

export default stubPino;
