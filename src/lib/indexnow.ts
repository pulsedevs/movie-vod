// lib/indexnow.ts
// IndexNow integration for instant search engine notification

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'your-indexnow-key-here';
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'https://boredflix.tv';

// IndexNow API endpoints
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow'
];

export async function notifyIndexNow(urls: string[]) {
  if (!INDEXNOW_KEY || INDEXNOW_KEY === 'your-indexnow-key-here') {
    console.log('⚠️  IndexNow key not configured. Skipping notification.');
    return;
  }

  const payload = {
    host: new URL(DOMAIN).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${DOMAIN}/indexnow-key.txt`,
    urlList: urls
  };

  console.log(`📡 Notifying IndexNow about ${urls.length} URLs...`);

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`✅ Successfully notified ${endpoint}`);
      } else {
        console.log(`⚠️  Failed to notify ${endpoint}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error notifying ${endpoint}:`, error);
    }
  }
}

// Helper function to notify about new content
export async function notifyNewContent(mediaType: 'movie' | 'tv', id: number, title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const url = `${DOMAIN}/${mediaType}/${id}/${slug}`;
  
  await notifyIndexNow([url]);
}
