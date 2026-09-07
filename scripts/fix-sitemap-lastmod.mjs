import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'src', 'app');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name === 'route.ts' && full.includes('sitemap')) files.push(full);
  }
  return files;
}

for (const file of walk(appDir)) {
  let s = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (s.includes('function formatSitemapLastMod')) {
    s = s.replace(
      /function formatSitemapLastMod[\s\S]*?\n\}\n\n/g,
      () => {
        changed = true;
        return '';
      }
    );
  }

  if (s.includes('const currentDate = new Date().toISOString()')) {
    s = s.replace(/\s*const currentDate = new Date\(\)\.toISOString\(\)\s*/g, '\n');
    s = s.replace(/<lastmod>\$\{currentDate\}<\/lastmod>/g, '<lastmod>${formatSitemapLastMod()}</lastmod>');
    changed = true;
  }

  if (changed && s.includes('<lastmod>') && !s.includes("from '@/utils/sitemapLastMod'")) {
    s = `import { formatSitemapLastMod } from '@/utils/sitemapLastMod'\n${s}`;
  }

  if (changed) {
    fs.writeFileSync(file, s);
    console.log('updated', file);
  }
}
