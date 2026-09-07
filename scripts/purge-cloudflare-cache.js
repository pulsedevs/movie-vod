#!/usr/bin/env node

// scripts/purge-cloudflare-cache.js
const https = require('https');

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ZONE_ID || !API_TOKEN) {
  console.error('❌ Missing Cloudflare credentials. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables.');
  process.exit(1);
}

async function purgeCache() {
  console.log('🧹 Purging Cloudflare cache...');
  
  const data = JSON.stringify({
    files: [
      "https://boredflix.com/_next/static/chunks/*",
      "https://boredflix.com/_next/static/*",
      "https://boredflix.com/",
      "https://boredflix.com/browse/*",
      "https://boredflix.com/search/*",
    ]
  });

  const options = {
    hostname: 'api.cloudflare.com',
    port: 443,
    path: `/client/v4/zones/${ZONE_ID}/purge_cache`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.success) {
            console.log('✅ Cloudflare cache purged successfully!');
            console.log('📊 Purge ID:', response.result.id);
            resolve(response);
          } else {
            console.error('❌ Cloudflare API error:', response.errors);
            reject(new Error('Cache purge failed'));
          }
        } catch (e) {
          console.error('❌ Failed to parse Cloudflare response:', body);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request failed:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

// Run the purge
purgeCache().catch((error) => {
  console.error('Cache purge failed:', error.message);
  process.exit(1);
});
