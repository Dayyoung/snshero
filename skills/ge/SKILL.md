---
name: ge
description: /gemini-ex의 단축어(축약어). 구글 스프레드시트(1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s)의 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 스킬
---

# /ge (/gemini-ex 축약어) 스킬 지침서

## 개요
`/ge`는 `/gemini-ex`의 단축 명령어로, 지정된 구글 스프레드시트에서 작업되지 않은 항목들을 확인하고 순차적으로 작업 및 검증을 완료합니다.

## 대상 스프레드시트
- **스프레드시트 URL**: https://docs.google.com/spreadsheets/d/1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s/edit?gid=0#gid=0

## 수행 절차
1. **진행 상태 확인 및 완료 항목 건너뛰기 (Skip Completed Rows)**:
   - `AGENTS.md`의 **"마지막 수정 완료 항목 ID"**를 가장 먼저 확인합니다.
   - 이전 실행에서 이미 완료된 이전 번호의 항목(Row 1 ~ 마지막 완료 Row)은 **처음부터 다시 점검하지 않고 즉시 제외(Skip)**합니다.
   - 마지막 완료 Row 번호 바로 다음의 **신규 미작업 항목**만 추출하여 즉시 작업을 시작합니다.
2. **신규 미작업 항목 유무 판별 및 무작업 시 침묵 (Silent if No-op)**:
   - 신규로 개선/구현할 미작업 항목이 없는 경우(모든 항목이 이미 완료된 경우), 사용자에게 불필요한 반복 알림 메시지를 보내지 않고 조용히 작업을 종료합니다.
3. **코드 분석 및 구현**:
   - 추출된 신규 미작업 항목의 요구사항에 따라 소스 코드를 수정하거나 신규 기능을 구현합니다.
   - 프로젝트 코딩 스타일에 맞춰 TypeScript, Tailwind CSS, i18n 번역(ko/en) 및 `lowSpecMode` 처리 규칙을 준수합니다.
4. **검증 및 품질 확인**:
   - `npm run lint` (`tsc --noEmit`) 명령어를 실행하여 타입 에러 및 문법 오류가 없는지 검증합니다.
5. **커밋 및 상태 업데이트**:
   - 파일 변경 시 변경 사항을 명확히 설명하는 커밋 메시지로 즉시 커밋 및 푸시합니다.
   - `AGENTS.md`와 `WORK_LOGS.md` 파일에 새로 완료된 마지막 항목 번호와 진행 상황을 업데이트합니다.
   - 구글 폼 보고 스크립트(`submit_report.py`)로 작업 완료를 제출하고 사용자에게 결과를 보고합니다.
