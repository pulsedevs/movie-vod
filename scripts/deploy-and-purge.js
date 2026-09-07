#!/usr/bin/env node

// scripts/deploy-and-purge.js
const { execSync } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deployAndPurge() {
  console.log('🚀 Starting automated deployment...');

  try {
    // Step 1: Build the project
    console.log('📦 Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Step 2: Deploy (if using manual deployment)
    console.log('🌐 Project built successfully!');
    console.log('💡 If using Vercel, your deployment should be automatic via Git push');
    
    // Step 3: Wait a moment for deployment to complete
    console.log('⏱️ Waiting for deployment to complete...');
    await sleep(5000);
    
    // Step 4: Purge Cloudflare cache
    console.log('🧹 Purging Cloudflare cache...');
    execSync('node scripts/purge-cloudflare-cache.js', { stdio: 'inherit' });
    
    // Step 5: Verify deployment
    console.log('✅ Deployment complete!');
    console.log('💡 Remember to hard refresh your browser (Ctrl+Shift+R)');
    console.log('🌐 Your site should now show the latest changes');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployAndPurge();
