#!/usr/bin/env node
/**
 * scripts/push_server.mjs
 * 관리자 브라우저 UI와 연동되는 로컬 웹푸시 디스패처 서버 (Port 3001)
 */

import http from 'http';
import { broadcastPush } from './broadcast_push.mjs';

const PORT = process.env.PUSH_PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/api/push/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'SNSHero Web Push Dispatcher', port: PORT }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/push/broadcast') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const title = payload.title || '⚔️ [SNS히어로] 공지사항이 도착했습니다!';
        const messageBody = payload.body || '새로운 랭킹 대전과 이벤트 소식을 확인하세요!';
        const targetUrl = payload.url || '/?view=card-play';

        const result = await broadcastPush({
          title,
          body: messageBody,
          url: targetUrl,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[PushServer] Broadcast Error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📡 [WebPush Server] 웹푸시 디스패처가 포트 http://0.0.0.0:${PORT} 에서 가동 중입니다.`);
  console.log(`   - 헬스체크: http://localhost:${PORT}/api/push/health`);
  console.log(`   - 브로드캐스트 API: POST http://localhost:${PORT}/api/push/broadcast`);
});
