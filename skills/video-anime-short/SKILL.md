---
name: video-anime-short
description: 지정한 회차(예: /video-anime-short 1화)의 /script-anime 스크립트 및 /cutscene-anime-short 컷신 존재 여부를 확인(없으면 자동 생성)한 뒤, Google Flow 프로젝트(72ee6e60-2819-43a6-bb8c-700a7d599bdf)에서 생성된 나노바나나 2.1 세로(9:16) 컷신 이미지를 기준(시작 프레임)으로 Veo 3.1 Lite 세로(9:16 숏폼) 6초 애니메이션 효과 동영상(대사 6초 요약 / 전원 침묵 / 배경 남자 나레이션 규칙 적용)들을 전수 생성하고 1개의 통합 동영상으로 병합해 유튜브 업로드 준비를 완료하는 스킬
---

# `/video-anime-short` 스킬 지침서 (생성된 컷신 기반 세로 9:16 Veo 3.1 Lite 6초 숏폼 동영상 생성 및 통합 병합)

사용자가 `/video-anime-short 1화` (또는 `/video-anime-short 1회`, `/video-anime-short 2화` 등)를 호출하면 아래 절차를 순차적으로 수행합니다.

## 1. 핵심 동작 워크플로우

1. **스크립트 및 세로 컷신 존재 여부 확인 (없으면 자동 생성)**:
   - 대상 회차(`XX`)의 `/script-anime` 프롬프트 스크립트(`public/anime-character-sheets/cutscene-prompts/episode_XX_cutscene_prompts.json`)가 존재하는지 확인하고, 없으면 자동으로 생성합니다.
   - 대상 회차(`XX`)의 `/cutscene-anime-short` 세로(9:16) 컷신(`public/anime-character-sheets/cutscenes/epXX_portrait/cutscene_generation_status.json` 및 `images/EPXX_CUTYY_cutscene.jpg`)이 모두 생성·저장되어 있는지 확인하고, 누락된 컷신이 있으면 먼저 `generate_flow_cutscenes.py --orientation portrait`를 호출해 생성합니다.
2. **Google Flow 프로젝트 연동 (`Veo 3.1 - Lite` 세로 9:16 · 6초 · 프레임 모드 기준)**:
   - 대상 Flow 프로젝트 URL: `https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf`
   - 모드: **동영상 (`videocam\n동영상`)** + **프레임 (`crop_free\n프레임`)**
   - 모델: **Veo 3.1 - Lite (`Veo 3.1 light`)**
   - 화면 비율: **세로 (`9:16` Portrait / YouTube Shorts)**
   - 길이 기준: **컷당 6초 (`6-Second Cutscene`)**
3. **생성된 컷신 이미지 기준 애니메이션 효과 프롬프트 및 3대 오디오 규칙 적용**:
   - **첨부 기준 이미지**: `/cutscene-anime-short`에서 나노바나나 2.1로 **실제 생성된 세로 컷신 이미지(`EPXX_CUTYY_cutscene.jpg`)**를 `Veo 3.1 - Lite`의 `시작` 프레임으로 첨부합니다.
   - **애니메이션 효과 프롬프트 (`cutsceneAnimationPromptEn`)**: 첨부된 컷신 이미지의 구도·인물·복장·소품을 그대로 유지하면서 6초 동안 애니메이션 움직임과 이펙트를 부여합니다.
   - **3대 대사 / 침묵 / 전지적 남자 나레이션 규칙**:
     1. **캐릭터 대사가 필요한 컷신**: 해당 발화 캐릭터만 대사를 **6초 이내로 요약**하여 말하고, 화면의 다른 인물들은 침묵합니다.
     2. **대사가 없는 순수 연출 컷신**: 등장하는 **모든 인물은 입을 굳게 다물고 아무 말도 해서는 안 됩니다**.
     3. **장면을 설명해야 하는 전지적 시점 나레이션이 필요한 컷신**: 화면의 **모든 인물은 입을 다물고 대사를 해서는 안 되며, 오직 배경에서만 중후한 남자 나레이션이 6초 이내로 장면을 설명**합니다.
   - **글자 포함 절대 금지**: 영상 내 어떠한 자막, 텍스트, 말풍선, 워터마크도 렌더링하지 않습니다.
4. **전체 컷신 동영상 병합 및 유튜브 업로드 패키지 준비**:
   - 회차 내 모든 컷신 동영상이 생성되면 `ffmpeg`를 이용해 **1개의 통합 세로 숏폼 동영상(`SNSHero_Anime_EPXX_<Title>_9x16_Shorts.mp4`)**으로 병합하고 유튜브 쇼츠 업로드 준비를 완료합니다.

## 2. 실행 명령어

```bash
python3 skills/video-anime/scripts/generate_flow_videos.py 1화 --orientation portrait
```
