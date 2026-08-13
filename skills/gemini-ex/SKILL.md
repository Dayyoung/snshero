---
name: gemini-ex
description: 구글 스프레드시트(1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s)의 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 스킬
---

# /gemini-ex 스킬 지침서

## 개요
지정된 구글 스프레드시트에서 작업되지 않은 항목들을 확인하고 순차적으로 작업 및 검증을 완료합니다.

## 대상 스프레드시트
- **스프레드시트 URL**: https://docs.google.com/spreadsheets/d/1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s/edit?gid=0#gid=0

## 수행 절차
1. **스프레드시트 확인 및 미작업 항목 추출**:
   - 스프레드시트 데이터(또는 로컬 연동 데이터)에서 진행 상태가 '미작업', '작업대기', 또는 미완료인 항목을 확인합니다.
2. **코드 분석 및 구현**:
   - 추출된 요구사항에 따라 소스 코드를 수정하거나 신규 기능을 구현합니다.
   - 프로젝트 코딩 스타일에 맞춰 TypeScript, Tailwind CSS, i18n 번역(ko/en) 및 `lowSpecMode` 처리 규칙을 준수합니다.
3. **검증 및 품질 확인**:
   - `npm run lint` (`tsc --noEmit`) 명령어를 실행하여 타입 에러 및 문법 오류가 없는지 검증합니다.
4. **커밋 및 상태 업데이트**:
   - 파일 변경 시 변경 사항을 명확히 설명하는 커밋 메시지로 즉시 커밋합니다.
   - `AGENTS.md` 파일에 완료된 항목과 진행 상황을 업데이트합니다.
