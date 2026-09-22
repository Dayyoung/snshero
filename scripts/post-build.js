import fs from 'node:fs';
import path from 'node:path';

try {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const notFoundHtml = path.join(distDir, '404.html');
  const versionJson = path.join(distDir, 'version.json');

  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);

    // 주요 SPA 경로(home, play, deck 등)에 200 OK 정적 index.html 복사 생성 (404 방지)
    const spaRoutes = ['home', 'play', 'deck', 'shop', 'setting', 'ranking', 'game', 'event', 'community', 'wiki', 'novel', 'anime', 'movie', 'modoo', 'playground', 'status', 'admin', 'profile', 'companion', 'stock-market', 'prediction-market', 'card-marketplace', 'season-hub'];
    spaRoutes.forEach((route) => {
      const routeDir = path.join(distDir, route);
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      fs.copyFileSync(indexHtml, path.join(routeDir, 'index.html'));
    });

    // Pacpik verification 정적 파일 보장
    const publicPacpik = path.join(process.cwd(), 'public', 'pacpik', 'index.html');
    const distPacpikDir = path.join(distDir, 'pacpik');
    const distPacpikHtml = path.join(distPacpikDir, 'index.html');
    if (fs.existsSync(publicPacpik)) {
      if (!fs.existsSync(distPacpikDir)) {
        fs.mkdirSync(distPacpikDir, { recursive: true });
      }
      fs.copyFileSync(publicPacpik, distPacpikHtml);
    }
    const publicPacpikRoot = path.join(process.cwd(), 'public', 'pacpik.html');
    if (fs.existsSync(publicPacpikRoot)) {
      fs.copyFileSync(publicPacpikRoot, path.join(distDir, 'pacpik.html'));
    }
    const publicPacpikTxt = path.join(process.cwd(), 'public', 'pacpik.txt');
    if (fs.existsSync(publicPacpikTxt)) {
      fs.copyFileSync(publicPacpikTxt, path.join(distDir, 'pacpik.txt'));
    }

    // Gotest Tailscale IP 리다이렉트 정적 파일 보장
    const publicGotest = path.join(process.cwd(), 'public', 'gotest', 'index.html');
    const distGotestDir = path.join(distDir, 'gotest');
    const distGotestHtml = path.join(distGotestDir, 'index.html');
    if (fs.existsSync(publicGotest)) {
      if (!fs.existsSync(distGotestDir)) {
        fs.mkdirSync(distGotestDir, { recursive: true });
      }
      fs.copyFileSync(publicGotest, distGotestHtml);
    }
    const publicGotestRoot = path.join(process.cwd(), 'public', 'gotest.html');
    if (fs.existsSync(publicGotestRoot)) {
      fs.copyFileSync(publicGotestRoot, path.join(distDir, 'gotest.html'));
    }
  }

  // 메인 엔트리 스크립트 파일(assets/index-*.js) 자동 탐색
  let entryScript = '';
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    const mainScript = assetFiles.find(file => file.startsWith('index-') && file.endsWith('.js'));
    if (mainScript) {
      entryScript = `/assets/${mainScript}`;
    }
  }

  const versionData = {
    version: '2.1.0',
    buildTime: new Date().toISOString(),
    buildTimestamp: Date.now(),
    service: 'snshero-revolution',
    minRequiredVersion: '2.0.0',
    entryScript: entryScript || ''
  };

  fs.writeFileSync(versionJson, JSON.stringify(versionData, null, 2));

  // public/version.json에도 동기화하여 개발/정적 서버에서도 항상 최신 번들 매핑 보장
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2));
  }

  console.log('Post-build completed successfully: 404.html & version.json (entryScript: ' + entryScript + ') created.');
} catch (err) {
  console.error('Post-build error:', err);
  process.exit(1);
}
