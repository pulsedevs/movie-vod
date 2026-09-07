#!/usr/bin/env node

// scripts/build-with-timestamp.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Generate build timestamp
const buildTime = Date.now().toString();

// Set environment variable for the build
process.env.NEXT_PUBLIC_BUILD_TIME = buildTime;

console.log(`🕒 Setting build time: ${buildTime} (${new Date(parseInt(buildTime)).toISOString()})`);

// Write build time to a file for reference
const buildInfoPath = path.join(__dirname, '..', 'public', 'build-info.json');
const buildInfo = {
  buildTime: buildTime,
  buildDate: new Date().toISOString(),
  version: require('../package.json').version
};

fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
console.log(`📝 Build info written to ${buildInfoPath}`);

// Run the actual build
try {
  execSync('npm run build:simple', { 
    stdio: 'inherit', 
    env: { ...process.env, NEXT_PUBLIC_BUILD_TIME: buildTime }
  });
  console.log('✅ Build completed successfully!');
  
  // Purge Cloudflare cache after successful build
  if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    console.log('🧹 Purging Cloudflare cache...');
    try {
      execSync('node scripts/purge-cloudflare-cache.js', { stdio: 'inherit' });
    } catch (cacheError) {
      console.warn('⚠️ Cache purge failed, but build was successful:', cacheError.message);
    }
  } else {
    console.log('ℹ️ Skipping Cloudflare cache purge (credentials not set)');
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
