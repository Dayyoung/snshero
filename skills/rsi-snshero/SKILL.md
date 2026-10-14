---
name: rsi-snshero
description: 공개 구글 스프레드시트 CSV(2PACX-1vRAmjkvOjw27HDOuBu4w_WXIdAw1pRQz0vRi2AOOK53HxVT_uO2RLcMnVTxXAg18C6HdU5_huyandLn)의 바이브코딩 프롬프트 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 순환 화면 혁신 스킬
---

# /rsi-snshero 스킬 지침서

## 개요
`/rsi-snshero`는 공개 구글 스프레드시트 CSV 웹게시 링크 기반의 바이브코딩 프롬프트(기획/디자인/개발 통합 명세)를 차례대로 확인하고,
아직 적용되지 않은 모든 바이브코딩 프롬프트를 소스코드(React 19 + TypeScript 5.8 + Tailwind CSS 4.1)에 전수 구현 및 빌드 검증을 완료하며,
`AGENTS.md`에 진행 과정을 기록하여 다음 실행 시 마지막 완료 항목 이후부터 중단 없이 이어서 진행하는 순환 혁신 스킬입니다.

## 스프레드시트 연동 정보
- **공개 CSV URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRAmjkvOjw27HDOuBu4w_WXIdAw1pRQz0vRi2AOOK53HxVT_uO2RLcMnVTxXAg18C6HdU5_huyandLn/pub?output=csv`
- **기록 파일**: `AGENTS.md`, `WORK_LOGS.md`

## 필수 수행 원칙
1. **Zero-Emoji 원칙**: 모든 코드 및 텍스트에서 유니코드 이모지를 절대 사용하지 않습니다.
2. **순수 인라인 SVG**: 모든 아이콘은 `strokeWidth="1.75"` 규격의 인라인 SVG 벡터로 렌더링합니다.
3. **12대 언어 다국어(i18n)**: 한국어(`ko`) 기본 및 12개 주요 언어 사전 내장.
4. **인프라 보존**: AdSense 배너, SEO/GEO 메타태그, `llms.txt`, 암호화폐/카드 결제 모듈, Web MCP를 절대 건드리지 않습니다.
5. **검증 및 보고**: `npx tsc --noEmit` 및 `npm run build` 통과 후 로컬 커밋 및 연동 구글 폼 완료 보고서를 제출합니다.
6. **Git 커밋/푸시**: 로컬 커밋만 수행하며 원격 푸시는 사용자가 `/git-push`를 명시할 때만 실행합니다.
