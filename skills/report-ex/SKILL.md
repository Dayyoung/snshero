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
2. **기능 구현 및 요구사항 반영**:
   - 각 작업 항목의 세부 요구사항(UI, 게임 로직, 데이터 변경, i18n 번역 등)을 소스 코드에 반영합니다.
   - `AGENTS.md` 지침에 따라 TypeScript strict 모드, Monospace 디자인 가이드, localstorage 네이밍 규격을 준수합니다.
3. **코드 빌드 및 검증**:
   - `npm run lint` (`tsc --noEmit`) 통과 여부를 확인합니다.
4. **구글폼 보고 제출**:
   - 완료된 작업에 대해 지정된 구글폼 curl 명령어 또는 제출 매커니즘을 사용하여 결과를 즉시 전송합니다.
5. **기록 및 커밋**:
   - `AGENTS.md` 내 "스프레드시트 개선 작업 진행 상태"에 마지막 수정 완료 항목 ID 및 작업 내용을 기록하고 커밋합니다.
