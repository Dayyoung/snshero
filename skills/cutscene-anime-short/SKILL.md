---
name: cutscene-anime-short
description: 지정한 회차(예: /cutscene-anime-short 1화)의 /script-anime 컷신 스크립트를 확인(없으면 자동 생성)한 뒤, Google Flow 프로젝트(72ee6e60-2819-43a6-bb8c-700a7d599bdf)에서 배경장소 시트·7등신 cutouts 캐릭터 시트·소품 시트를 첨부하여 나노바나나2.1 세로(9:16 숏폼) 컷신 이미지를 전수 생성하는 스킬
---

# `/cutscene-anime-short` 스킬 지침서 (세로 9:16 나노바나나 2.1 숏폼 컷신 생성)

사용자가 `/cutscene-anime-short 1화` (또는 `/cutscene-anime-short 1회`, `/cutscene-anime-short 2화` 등)를 호출하면 아래 절차를 순차적으로 수행합니다.

## 1. 핵심 동작 워크플로우

1. **컷신 스크립트 존재 여부 확인 및 자동 생성**:
   - 대상 회차(`XX`)의 `/script-anime` 결과 파일(`public/anime-character-sheets/cutscene-prompts/episode_XX_cutscene_prompts.json` 및 `.md`)이 존재하는지 먼저 확인합니다.
   - 만약 해당 회차의 스크립트가 존재하지 않으면 즉시 아래 명령어로 생성합니다:
     ```bash
     python3 skills/script-anime/scripts/generate_episode_cutscene_prompts.py [회차]
     ```
2. **Google Flow 프로젝트 연동**:
   - 대상 Flow 프로젝트 URL: `https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf`
3. **일관성 유지를 위한 레퍼런스 시트 첨부 원칙**:
   - 각 컷신 생성 시 해당 컷신에 지정된 시트들을 첨부파일(Reference Image)로 업로드·연동하여 캐릭터/장소/소품 일관성을 유지합니다:
     - **배경장소 시트**: `public/anime-character-sheets/locations/art/LOC_XXX_*.jpg`
     - **캐릭터 시트 (7등신 Cutouts 기준)**: `public/anime-character-sheets/cutouts/XXX_Name.png`
     - **소품 시트**: `public/anime-character-sheets/props/art/PROP_XXX_*.jpg`
4. **모델 및 화면 비율 규격**:
   - **생성 모델**: **나노바나나 2.1 / Nano Banana 2** (`🍌 Nano Banana 2` / `🍌 Nano Banana Pro`)
   - **화면 비율**: **세로 (`9:16` Portrait)** 이미지 기준 생성

## 2. 실행 명령어

```bash
python3 skills/cutscene-anime/scripts/generate_flow_cutscenes.py [회차] --orientation portrait
```

## 3. 출력 경로
- **세로(9:16) 컷신 저장 경로**: `public/anime-character-sheets/cutscenes/epXX_portrait/EPXX-CUT01.jpg` ~
- **매니페스트/로그**: `public/anime-character-sheets/cutscenes/epXX_portrait/cutscene_manifest.json`
