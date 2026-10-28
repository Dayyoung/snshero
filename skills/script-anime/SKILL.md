---
name: script-anime
description: 지정한 회차(예: /script-anime 1회)의 영문 소설과 7등신 캐릭터 컷아웃(cutouts), 배경장소 시트, 소품 시트를 결합하여 6초 동영상 생성용 컷신 프롬프트 리스트를 생성하는 스킬
---

# /script-anime 스킬 지침서 (6초 애니메이션 컷신 프롬프트 생성기)

## 개요
`/script-anime [회차]` (예: `/script-anime 1회`, `/script-anime 2회`, `/script-anime 1`) 명령은 『카단의 여정(Kadan's Journey)』 해당 회차의 **영문 소설 원문**과 미리 준비된 **7등신 캐릭터 컷아웃(`cutouts`)**, **20대 배경장소 시트(`locations`)**, **20대 핵심 소품 시트(`props`)**를 결합하여 **1컷당 6초 분량의 AI 동영상 생성용 컷신 프롬프트 리스트**를 생성하는 스킬입니다.

## 입력 데이터 및 참조 시트 경로
1. **영문 소설 원문**: `public/book/image_narrations/english_txt/SNSHero_Novel_Episode_{XX}_*_EN.txt`
2. **한국어 소설 원문**: `public/book/episode_{XX}.md`
3. **마스터 매니페스트**: `public/anime-character-sheets/manifest.json`
4. **첨부 이미지 기준 (글자 없는 순수 레퍼런스 우선 첨부)**:
   - **캐릭터 시트 기준 (필수)**: **7등신 전신 컷아웃 PNG** (`public/anime-character-sheets/cutouts/001_Aquaris.png` ~ `110_Dreadwing.png`)
   - **배경장소 시트 기준**: `public/anime-character-sheets/locations/art/LOC_001..020_*.jpg` 및 `locations/sheets/LOC_001..020_*_sheet.jpg`
   - **핵심 소품 시트 기준**: `public/anime-character-sheets/props/art/PROP_001..020_*.jpg` 및 `props/sheets/PROP_001..020_*_sheet.jpg`

## 단일 6초 컷신 프롬프트의 6대 필수 포함 항목 (절대 원칙)
하나의 컷신은 **6초 동영상(`6-Second Video Cutscene`)**으로 생성되며, 각 컷신 프롬프트는 반드시 아래 6가지 항목을 모두 포함해야 합니다:

1. **현재 회차 전체 스토리 요약 (`Episode Story Summary`)**:
   - 여러 컷신 간 스토리 및 분위기 일관성을 유지하기 위해, 모든 개별 컷신 프롬프트 상단에 **현재 회차의 전체 스토리를 간단하게 요약**하여 설명합니다.
2. **배경 묘사 (`Background Location Sheet & Prompt`)**:
   - 현재 생성해야 하는 컷신의 배경을 **배경장소 시트(`LOC-001`~`LOC-020`) 파일 경로** 및 **영문 소설 기준 배경 프롬프트**로 상세히 묘사합니다.
3. **등장 캐릭터 묘사 — 7등신 Cutouts 기준 (`7-Head-Tall Character Cutouts & Prompt`)**:
   - 현재 생성해야 하는 컷신에 등장하는 모든 인물을 **7등신 전신 컷아웃 이미지(`public/anime-character-sheets/cutouts/XXX_Name.png`) 첨부 링크** 및 **7등신 외형·복장 프롬프트**로 묘사합니다.
4. **등장 소품 및 소품 소지 캐릭터 묘사 (`Props & Prop Holder Specification`)**:
   - 현재 컷신에 등장해야 하는 **소품(`PROP-001`~`PROP-020` 또는 고유 무기/성물)**과 **그 소품을 소지(착용·사용)해야 하는 캐릭터가 누구인지** 명확하게 프롬프트로 묘사합니다.
5. **6초 이내 대사 요약 또는 전원 침묵 규칙 (`6-Second Dialogue OR Strict Silence Rule`)**:
   - **대사가 있는 컷신**: 해당 캐릭터가 대사를 **6초 이내로 요약해서 발화해야 한다**는 지침과 6초 요약 대사(`"..."`)를 프롬프트에 추가합니다.
   - **대사가 없는 컷신**: 등장하는 **모든 인물은 아무 말도 해서는 안 된다(입을 다물고 침묵 유지, `NO SPOKEN DIALOGUE: All appearing characters must remain completely silent and must not speak a single word`)**는 지침을 프롬프트에 추가합니다.
6. **글자 포함 절대 금지 규칙 (`Strict No-Text Constraint`)**:
   - 해당 컷신 영상에는 **어떠한 글자(자막, 말풍선, 알파벳, 한자, 숫자, 워터마크, UI)도 절대 포함되면 안 된다(`STRICT NO-TEXT RULE: Do NOT render any text, subtitles, captions, speech bubbles, letters, numbers, watermarks, or UI overlays anywhere in the video`)**는 지침을 프롬프트에 추가합니다.

## 실행 절차
1. 사용자가 `/script-anime 1회` (또는 원하는 회차 번호)를 호출하면 아래 생성 스크립트를 실행합니다:
   ```bash
   python3 skills/script-anime/scripts/generate_episode_cutscene_prompts.py 1회
   ```
2. 생성된 마크다운 및 JSON 파일을 확인합니다:
   - 마크다운 출력: `public/anime-character-sheets/cutscene-prompts/episode_{XX}_cutscene_prompts.md`
   - JSON 출력: `public/anime-character-sheets/cutscene-prompts/episode_{XX}_cutscene_prompts.json`
3. 아티팩트 문서 또는 응답으로 해당 회차의 **6초 컷신 프롬프트 리스트 전체**와 **첨부용 7등신 캐릭터 `cutouts` 파일 링크**, **배경/소품 시트 링크**, **원클릭 복사용 영문 비디오 프롬프트**를 사용자에게 제시합니다.
4. 작업 완료 후 연동된 구글 폼(`python3 skills/report-ex/scripts/submit_report.py`)으로 작업 완료 보고서를 제출하고 `WORK_LOGS.md`에 기록합니다.
