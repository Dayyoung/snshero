---
name: report-ex
description: 구글 스프레드시트(1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8)의 작업대기 항목들을 작업하고 구글폼 제출을 통해 보고하는 스킬
---

# /report-ex 스킬 지침서

## 개요
지정된 구글 스프레드시트에서 작업완료되지 않은 '작업대기' 항목들을 확인하여 소스 코드 반영을 완료하고, 완료된 작업은 구글폼 제출 명령어로 작업완료를 보고합니다.

## 대상 스프레드시트
- **스프레드시트 URL**: https://docs.google.com/spreadsheets/d/1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8/edit?usp=sharing

## 수행 절차
1. **작업대기 항목 추출**:
   - 구글 스프레드시트의 작업 목록 중 완료되지 않은 '작업대기' 상태의 항목들을 식별합니다.
   - CSV 엔드포인트: `https://docs.google.com/spreadsheets/d/1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8/gviz/tq?tqx=out:csv`
2. **기능 구현 및 요구사항 반영**:
   - 각 작업 항목의 세부 요구사항(UI, 게임 로직, 데이터 변경, i18n 번역 등)을 소스 코드에 반영합니다.
   - `AGENTS.md` 지침에 따라 TypeScript strict 모드, Monospace 디자인 가이드, localstorage 네이밍 규격을 준수합니다.
3. **코드 빌드 및 검증**:
   - `npm run lint` (`tsc --noEmit`) 통과 여부를 확인합니다.
4. **구글폼 보고 제출 (성공 검증된 방식)**:
   - **구글폼 제출 URL**: `https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse`
   - **필드 매핑**:
     - `entry.1712635414`: 부서명 (`기획` | `디자인` | `개발`)
     - `entry.1651694192`: 현재 작업명
     - `entry.1282964596`: 작업 상태 (`작업완료`)
     - `entry.1982035501`: 작업 상세 내용 및 특이사항 (예: "수정 완료 및 모바일 390x844 검증")
   - **단일 항목 curl 제출 예시**:
     ```bash
     curl -s -X POST "https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse" \
       -d "entry.1712635414=개발" \
       -d "entry.1651694192=작업명" \
       -d "entry.1282964596=작업완료" \
       -d "entry.1982035501=작업 상세 내용 및 검증 완료"
     ```
   - **스크립트를 통한 일괄 제출 (Python)**:
     ```bash
     python3 skills/report-ex/scripts/submit_report.py --sync-sheet
     ```
     또는 단일 제출:
     ```bash
     python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "작업명" --status "작업완료" --details "상세 내용"
     ```
5. **기록 및 커밋**:
   - `AGENTS.md` 내 "스프레드시트 개선 작업 진행 상태"에 마지막 수정 완료 항목 ID 및 작업 내용을 기록하고 커밋합니다.
