import fs from 'node:fs';
import path from 'node:path';

try {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const notFoundHtml = path.join(distDir, '404.html');
  const versionJson = path.join(distDir, 'version.json');

  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
  }

  const versionData = {
    version: '2.1.0',
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
    service: 'snshero-revolution',
    minRequiredVersion: '2.0.0'
  };

  fs.writeFileSync(versionJson, JSON.stringify(versionData, null, 2));
  console.log('Post-build completed successfully: 404.html & version.json created.');
} catch (err) {
  console.error('Post-build error:', err);
  process.exit(1);
}
