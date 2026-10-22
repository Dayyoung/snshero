#!/bin/bash
set -e

# ==============================================================================
# SNS히어로 고속 정적 프리뷰 서버 & 실시간 자동 빌드 워처 & 웹푸시 서버 통합 시작 스크립트
# ==============================================================================

# 실행 위치와 무관하게 항상 프로젝트 루트(스크립트 상위 폴더)를 기준으로 동작
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

PORT=3000
PUSH_PORT=3001
echo "🚀 [start-server] SNSHero 고속 통합 서버 기동을 시작합니다..."

# 1. 3000번 및 3001번 포트를 점유 중인 기존 프로세스 정리
PID=$(lsof -ti :$PORT || true)
if [ -n "$PID" ]; then
  echo "⚠️ [start-server] 포트 $PORT 점유 프로세스(PID: $PID)를 종료합니다..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
fi

PUSH_PID=$(lsof -ti :$PUSH_PORT || true)
if [ -n "$PUSH_PID" ]; then
  echo "⚠️ [start-server] 포트 $PUSH_PORT 웹푸시 서버 점유 프로세스(PID: $PUSH_PID)를 종료합니다..."
  kill -9 $PUSH_PID 2>/dev/null || true
  sleep 1
fi

# 기존 watch-build 및 push_server 프로세스 정리
WATCH_PID=$(pgrep -f "node scripts/watch-build.js" || true)
if [ -n "$WATCH_PID" ]; then
  echo "⚠️ [start-server] 기존 watch-build 프로세스(PID: $WATCH_PID)를 종료합니다..."
  kill -9 $WATCH_PID 2>/dev/null || true
fi

PUSH_SRV_PID=$(pgrep -f "node scripts/push_server.mjs" || true)
if [ -n "$PUSH_SRV_PID" ]; then
  echo "⚠️ [start-server] 기존 push_server 프로세스(PID: $PUSH_SRV_PID)를 종료합니다..."
  kill -9 $PUSH_SRV_PID 2>/dev/null || true
fi

# 2. dist/index.html이 없거나 --build 옵션이 주어진 경우에만 초기 빌드 수행 (즉시 기동 보장)
if [ ! -f "dist/index.html" ] || [ "$1" = "--build" ]; then
  echo "🔨 [start-server] 최신 프로덕션 정적 번들 빌드를 수행합니다..."
  npm run build
else
  echo "⚡ [start-server] 기존 최신 dist/ 번들을 감지했습니다. 대기 없이 즉시 서버를 기동합니다."
fi

# 프로세스 종료 시 자식 프로세스 자동 정리 trap
cleanup() {
  echo "🛑 [start-server] 통합 서버를 종료합니다..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM EXIT

# 3. W3C Web Push 디스패처 서버 백그라운드 가동 (포트 3001)
echo "📡 [start-server] W3C Web Push 디스패처 서버(0.0.0.0:$PUSH_PORT)를 시작합니다..."
node scripts/push_server.mjs &

# 4. 실시간 소스 감시 자동 빌드 워처 백그라운드 가동
echo "👀 [start-server] 실시간 소스 감시 자동 빌드(watch-build)를 시작합니다..."
node scripts/watch-build.js &

# 5. 프리뷰 서버 실행 (메인 포그라운드 유지, 포트 3000)
echo "🌐 [start-server] Vite Preview 정적 서버(0.0.0.0:$PORT)를 시작합니다..."
exec npx vite preview --host 0.0.0.0 --port $PORT
