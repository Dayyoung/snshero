---
name: start-server
description: 포트 3000에서 최신 프로덕션 정적 번들을 초고속으로 서빙하고 소스 변경 시 실시간 자동 빌드 갱신을 수행하는 고속 프리뷰 및 라이브 워처 가동 스킬
---

# /start-server 스킬 지침서

## 개요
이 스킬은 사용자가 `/start-server` 명령어를 입력하거나 서버 재시작/가동을 요청할 때, 느린 Vite 개발 서버 대신 **최신 프로덕션 정적 번들(`dist/`) 기반의 고속 프리뷰 서버(`vite preview`, 포트 3000)**와 **소스코드 수정 감시 자동 빌드 워처(`watch-build`)**를 백그라운드에서 한 번에 기동합니다.

## 핵심 장점
1. **0.1초대 초고속 로딩**: 수백 개의 개별 TS/TSX 파일 요청 대신 압축·최적화된 정적 번들만 서빙하여 Tailscale Funnel 등 외부 네트워크 접속 지연을 완전히 해결합니다.
2. **실시간 최신 소스 자동 반영**: `src/` 내의 파일이 수정되고 저장되면 1.2초 후 백그라운드에서 자동으로 `npm run build`를 수행하여 `dist/`를 갱신하므로, 브라우저 새로고침(F5) 시 항상 최신 소스가 반영됩니다.
3. **충돌 방지 및 안전한 포트 관리**: 기존 3000번 포트 점유 프로세스를 먼저 안전하게 정리한 후 새로 가동합니다.

## 수행 절차
1. **서버 시작 스크립트 실행**:
   ```bash
   bash scripts/start-server.sh
   ```
   *(또는 `npm run start-server`)*

2. **기동 상태 및 응답 검증**:
   ```bash
   curl -I http://localhost:3000/card-play
   ```
   - 정상 시: `HTTP/1.1 200 OK` 확인

3. **결과 보고**:
   - 로컬 접속 주소: `http://localhost:3000`
   - Tailscale 접속 주소: `https://dayyoung-macbookpro.tail3717a4.ts.net/card-play`
   - 프리뷰 서버 및 자동 빌드 워처 정상 작동 여부를 사용자에게 한국어로 안내합니다.
