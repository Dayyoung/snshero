#!/usr/bin/env node
/**
 * scripts/broadcast_push.mjs
 * 구글 스프레드시트에 등록된 모든 사용자에게 실제 W3C Web Push 발송을 수행하는 스크립트
 * 
 * 사용법:
 *   node scripts/broadcast_push.mjs
 *   node scripts/broadcast_push.mjs --title "공지 제목" --body "본문 내용" --url "/?view=card-play"
 */

import webpush from 'web-push';
import https from 'https';

// ── 1. VAPID 키 설정 ──────────────────────────────────────────────────────────
export const VAPID_PUBLIC_KEY = 'BFUG6fAO5-EKlseliym2q-sUqwpu7n05AIoTtn3HF5Vm6fapi7li7ttsqkeblALTsh-YASIYyf4rDOrUHydJ6js';
export const VAPID_PRIVATE_KEY = 'H4PlUo8ejjnnQKyZFy2Aj-MR6EnZV59tZp0gfh-MXzU';
export const VAPID_SUBJECT = 'mailto:admin@snshero.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// ── 2. 구글 스프레드시트 CSV URL ─────────────────────────────────────────────
const GOOGLE_SHEET_PUSH_ID = '1o8rwdG_O_-efkKHgf9oMpFaOUnAAVxMQVfDldFavbjg';
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_PUSH_ID}/gviz/tq?tqx=out:csv`;

// ── 3. CLI 인자 파싱 ─────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let title = '⚔️ [SNS히어로] 공지사항이 도착했습니다!';
  let body = '지금 게임에 접속하여 최신 이벤트와 랭킹 대전을 확인하세요!';
  let url = '/?view=card-play';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--body' && args[i + 1]) {
      body = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      url = args[i + 1];
      i++;
    }
  }

  return { title, body, url };
}

// ── 4. 구글 시트 CSV 다운로드 및 파싱 ─────────────────────────────────────────
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchCSV(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch CSV: HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseCSV(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.length > 0 && currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// ── 5. 실제 웹푸시 브로드캐스트 발송 함수 ─────────────────────────────────────
export async function broadcastPush(params) {
  const { title, body, url } = params;

  console.log(`\n======================================================`);
  console.log(`🚀 [WebPush] SNSHero 실제 웹푸시 브로드캐스트 발송 시작`);
  console.log(`======================================================`);
  console.log(`📌 제목: ${title}`);
  console.log(`📝 본문: ${body}`);
  console.log(`🔗 링크: ${url}`);
  console.log(`📡 구글 시트에서 최신 등록 토큰 목록을 조회합니다...`);

  const csvText = await fetchCSV(`${GOOGLE_SHEET_CSV_URL}&_t=${Date.now()}`);
  const rows = parseCSV(csvText);

  const validSubscriptions = [];
  const legacyMockTokens = [];
  const tokenMap = new Map();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 4) continue;

    const category = (row[1] || '').trim().toLowerCase();
    const label = (row[2] || '').trim();
    const tokenRaw = (row[3] || '').trim();

    if (category !== 'webpush_token' || !tokenRaw) continue;

    if (tokenMap.has(tokenRaw)) continue;
    tokenMap.set(tokenRaw, true);

    // 실제 W3C PushSubscription JSON 형태인지 검증
    try {
      if (tokenRaw.startsWith('{') && tokenRaw.endsWith('}')) {
        const subObj = JSON.parse(tokenRaw);
        if (subObj && subObj.endpoint) {
          validSubscriptions.push({
            label,
            subscription: subObj,
          });
          continue;
        }
      }
    } catch {}

    legacyMockTokens.push({ label, token: tokenRaw });
  }

  console.log(`📊 구글 시트 집계 결과:`);
  console.log(`   - 실제 VAPID Web Push 수신 가능 기기: ${validSubscriptions.length}대`);
  console.log(`   - 구버전 모의(Mock) 식별자 토큰: ${legacyMockTokens.length}개`);

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: url || '/' },
    timestamp: Date.now(),
  });

  if (validSubscriptions.length === 0) {
    console.warn(`\n⚠️  [주의] 실제 발송 가능한 VAPID PushSubscription 기기가 아직 0대입니다.`);
    console.warn(`👉 사용자가 최신 버전의 앱에서 [웹푸시 알림 받기]를 1회 허용하면 실제 엔드포인트(FCM/Apple APNs)가 구글 시트에 영구 등록됩니다.`);
    if (legacyMockTokens.length > 0) {
      console.log(`ℹ️  기존 ${legacyMockTokens.length}개의 토큰은 가상 식별자(wp_...)로 등록되어 있어 실제 브라우저 엔드포인트가 없습니다.`);
    }
    return {
      success: true,
      totalCount: 0,
      sentCount: 0,
      failedCount: 0,
      expiredCount: 0,
      message: '발송 대상 구독자가 없거나 모두 구버전 토큰입니다. 브라우저에서 알림 재등록이 필요합니다.',
    };
  }

  console.log(`\n📤 총 ${validSubscriptions.length}대의 기기로 실제 패킷 전송을 시작합니다...`);

  let sentCount = 0;
  let failedCount = 0;
  let expiredCount = 0;

  const results = await Promise.allSettled(
    validSubscriptions.map(async ({ label, subscription }) => {
      try {
        await webpush.sendNotification(subscription, payload, {
          TTL: 86400, // 24시간 보관
          urgency: 'high',
        });
        sentCount++;
        console.log(`   ✅ [전송 성공] ${label} (${subscription.endpoint.slice(0, 45)}...)`);
      } catch (err) {
        failedCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          expiredCount++;
          console.warn(`   ⚠️ [만료된 기기 (HTTP ${err.statusCode})] ${label}`);
        } else {
          console.error(`   ❌ [전송 실패 (HTTP ${err.statusCode || 'ERR'})] ${label}: ${err.message}`);
        }
      }
    })
  );

  console.log(`\n======================================================`);
  console.log(`🎉 [발송 완료 보고]`);
  console.log(`   - 전송 성공: ${sentCount}건`);
  console.log(`   - 전송 실패: ${failedCount}건 (만료/삭제된 기기: ${expiredCount}건)`);
  console.log(`======================================================\n`);

  return {
    success: true,
    totalCount: validSubscriptions.length,
    sentCount,
    failedCount,
    expiredCount,
  };
}

// 직접 CLI 실행 시
if (process.argv[1] && process.argv[1].endsWith('broadcast_push.mjs')) {
  const params = parseArgs();
  broadcastPush(params).catch((err) => {
    console.error('❌ 브로드캐스트 푸시 발송 실패:', err);
    process.exit(1);
  });
}
