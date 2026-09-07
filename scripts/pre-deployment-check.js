#!/usr/bin/env node

/**
 * Pre-deployment checker for streaming sources and Soft 404 prevention
 * Run this before deploying to ensure no Soft 404 issues
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Pre-deployment Soft 404 Prevention Check\n');

let hasIssues = false;

// 1. Check TMDB API Key
console.log('1. Checking TMDB API Key...');
if (!process.env.TMDB_API_KEY) {
  console.log('❌ TMDB_API_KEY is missing!');
  hasIssues = true;
} else {
  console.log('✅ TMDB_API_KEY found');
}

// 2. Check Streaming Sources
console.log('\n2. Checking Streaming Sources...');
const sourcePattern = /^STREAM_BASE_(\d+)_(MOVIE|TV)$/;
const sourceNumbers = new Set();

Object.keys(process.env).forEach(key => {
  const match = key.match(sourcePattern);
  if (match) {
    sourceNumbers.add(match[1]);
  }
});

if (sourceNumbers.size === 0) {
  console.log('❌ No streaming sources configured!');
  console.log('   This will cause ALL movie pages to show as Soft 404s');
  hasIssues = true;
} else {
  console.log(`✅ Found ${sourceNumbers.size} streaming source(s)`);
  
  Array.from(sourceNumbers).sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).forEach(sourceNum => {
    const movieKey = `STREAM_BASE_${sourceNum}_MOVIE`;
    const tvKey = `STREAM_BASE_${sourceNum}_TV`;
    const hasMovie = !!process.env[movieKey];
    const hasTv = !!process.env[tvKey];
    
    if (!hasMovie && !hasTv) {
      console.log(`⚠️  Source ${sourceNum}: Neither movie nor TV URL configured`);
    } else {
      console.log(`✅ Source ${sourceNum}: Movie=${hasMovie}, TV=${hasTv}`);
    }
  });
}

// 3. Check Domain Configuration
console.log('\n3. Checking Domain Configuration...');
if (!process.env.NEXT_PUBLIC_DOMAIN) {
  console.log('⚠️  NEXT_PUBLIC_DOMAIN not set (will use default)');
} else {
  console.log(`✅ Domain: ${process.env.NEXT_PUBLIC_DOMAIN}`);
}

// 4. Check Critical Environment Variables
console.log('\n4. Checking Critical Environment Variables...');
const criticalVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
];

criticalVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`⚠️  ${varName} not configured`);
  } else {
    console.log(`✅ ${varName} configured`);
  }
});

// 5. Summary
console.log('\n📋 SUMMARY');
console.log('==========');

if (hasIssues) {
  console.log('❌ CRITICAL ISSUES DETECTED!');
  console.log('   Deployment will likely cause Soft 404 errors');
  console.log('   Fix the issues above before deploying');
  process.exit(1);
} else {
  console.log('✅ All checks passed!');
  console.log('   Safe to deploy');
}

// 6. Recommendations
console.log('\n💡 RECOMMENDATIONS TO PREVENT SOFT 404s:');
console.log('- Ensure at least 3-5 streaming sources are configured');
console.log('- Test your movie pages after deployment');
console.log('- Monitor Google Search Console for new Soft 404 reports');
console.log('- Run the diagnose-soft-404.js script periodically');
console.log('- Check streaming source availability regularly');
