// Bundle Analyzer Configuration

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: true,
});

module.exports = (config) => {
  // Only apply the bundle analyzer in analysis mode
  if (process.env.ANALYZE === 'true') {
    return withBundleAnalyzer(config);
  }
  
  return config;
};
