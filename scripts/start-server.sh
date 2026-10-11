#!/bin/bash
set -e

# ==============================================================================
# SNS히어로 고속 정적 프리뷰 서버 & 실시간 자동 빌드 워처 시작 스크립트
# ==============================================================================

PORT=3000
echo "🚀 [start-server] SNSHero 고속 서버 기동을 시작합니다..."

# 1. 3000번 포트를 점유 중인 기존 프로세스 정리
PID=$(lsof -ti :$PORT || true)
if [ -n "$PID" ]; then
  echo "⚠️ [start-server] 포트 $PORT 점유 프로세스(PID: $PID)를 종료합니다..."
  kill -9 $PID 2>/dev/null || true
  sleep 1
fi

# 기존 watch-build 프로세스 정리
WATCH_PID=$(pgrep -f "node scripts/watch-build.js" || true)
if [ -n "$WATCH_PID" ]; then
  echo "⚠️ [start-server] 기존 watch-build 프로세스(PID: $WATCH_PID)를 종료합니다..."
  kill -9 $WATCH_PID 2>/dev/null || true
fi

# 2. 최신 번들 빌드 수행
echo "🔨 [start-server] 최신 프로덕션 정적 번들 빌드를 수행합니다..."
npm run build

# 프로세스 종료 시 자식 프로세스 자동 정리 trap
cleanup() {
  echo "🛑 [start-server] 서버를 종료합니다..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM EXIT

# 3. 실시간 소스 감시 자동 빌드 워처 백그라운드 가동
echo "👀 [start-server] 실시간 소스 감시 자동 빌드(watch-build)를 시작합니다..."
node scripts/watch-build.js &

# 4. 프리뷰 서버 실행 (메인 포그라운드 유지)
echo "🌐 [start-server] Vite Preview 정적 서버(0.0.0.0:$PORT)를 시작합니다..."
exec npx vite preview --host 0.0.0.0 --port $PORT
