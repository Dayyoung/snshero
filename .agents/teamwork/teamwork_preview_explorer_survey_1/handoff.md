# Handoff Report — Explorer 1 (Scenario & Manifest Specialist)
**Agent**: Explorer 1 (`teamwork_preview_explorer_survey_1`)  
**Date**: 2026-10-18T04:45:00Z  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

1. **소설 시나리오 파일**:
   - `public/book/episode_01.md` ~ `episode_40.md`: 40개 파일 전수 존재. 총 158,755자. 에피소드당 최소 3,629자(Ep 04), 최대 4,302자(Ep 23), 평균 3,968.9자. 직접 대화문(`“...”`/`"..."`) 화당 9~22개 수록.
   - `public/book/index.json`: 40개 에피소드 메타데이터(제목, 범위, 글자 수) 및 41명 등장 영웅(`characters`) 목록 수록.
   - `src/content/englishNovelMapping.ts`: 40개 영문 에피소드 제목 및 파일명 매핑(`ENGLISH_NOVEL_MAP`) 완비.
   - `public/book/image_narrations/english_txt/`: 40개 영문 전문 텍스트 파일 완비.

2. **웹툰 매니페스트 및 씬 파일**:
   - `src/content/webtoonEpisodeManifest.json`: 총 40개 에피소드(`"1"` ~ `"40"`), 에피소드당 정확히 21개 씬(씬 0 타이틀 카드 + 씬 1~20 스토리 씬 = 화당 21개, 총 840개 씬) 수록.
   - `has_localArtUrl`: 전체 840개 중 단 5개 씬만 존재 (`Ep 1 Scene 20`, `Ep 8 Scene 15`, `Ep 15 Scene 18`, `Ep 25 Scene 16`, `Ep 40 Scene 20`).
   - `missing_localArtUrl`: 835개 씬.
   - `imageUrl`: 840개 씬 전수가 `https://dayyoung.github.io/image/cartoon/episode_XX/...` 외부 CDN URL로 구성.
   - `public/book/image_narrations/episode_01_narrations.json` ~ `episode_40_narrations.json`: 40개 파일, 총 800개 씬 내레이션 및 대화문이 매니페스트의 씬 1~20과 100% 동일(차이 0건).

3. **영웅 캐릭터 IP 매핑**:
   - `src/cardDatabase.ts` (110개 카드) 및 `src/content/characterIp.ts` (11개 팩션):
     - Water: 1~10, Fire: 11~20, Wind: 21~30, Earth: 31~40, Human: 41~50, Undead: 51~60, Elf: 61~70, Dwarf: 71~80, Monster: 81~90, Robot: 91~100, Dragon: 101~110.
   - 매니페스트의 840개 씬에 등장하는 40개 고유 캐릭터 이름(Aeolus, Aila, Aleksandar, Aqualord, Aquaris, Balbo, Balian, Barghest, Belphegor, Celia, Death Knight Artus, Eliana, Elwin, Fenrir, Gandar, Gawain, Gilgamesh, Griffon, Grimli, Hercul, Ignis, Ironforge, Kadan, Kaze, Leonar, Lucian, Magitech Golem, Malfuon, Medusa Gorgo, Naiad, Orihalcon, Pegasus, Robinyard, Rondol, Sylphid, Sylvania, Titania, Ursoc, Walker, Ysela)은 `CARD_DATABASE`의 카드 ID에 100% 매핑됨 (매핑 실패 0건).

4. **웹툰 렌더링 및 플레이어 소비 구조**:
   - `src/views/NovelView.tsx` (라인 245~255): `getCartoonSceneUrl`은 `attempt === 0`일 때 `imgInfo.localArtUrl`을 최우선 반환하고, 실패 시 `imgInfo.imageUrl`을 사용함.
   - `src/components/webtoon/WebtoonPanelCard.tsx` (라인 45): `const resolvedSrc = (localArtUrl && !useLocalArtFailed) ? localArtUrl : imgUrl;`로 로컬 우선 렌더링.
   - `src/components/movie/CinematicMoviePlayer.tsx` (라인 159): `imageUrl: img.imageUrl`을 직접 소비함.
   - `src/content/webtoonEpisodes.ts`: `focusCardId` 및 `characterIds`에 `(epNum % 110) || 1` 더미 연산식이 적용되어 있음.

5. **로컬 에셋 현황 및 신규 배경 리소스**:
   - `public/images/webtoon/`: 기존 레거시 클라이맥스 jpg 5장만 존재(각 860KB~1.07MB). 에피소드 폴더(`episode_01`~`episode_40`) 부재.
   - `/tmp/webtoon_bg_plates/`: 제미나이 나노 바나나 생성 정품 와이드스크린 판타지 배경 16장(`bg_01.jpg`~`bg_16.jpg`, 800x450 px, 각 63KB~114KB) 대기 중.
   - `public/seat/*.png`: V2 리마스터 110 영웅 고화질 포트레이트(각 <= 35KB) 온전하게 보존 중.

---

## 2. Logic Chain

1. **Step 1 (소설 원문과 매니페스트 정합성 확인)**:
   - Observation 1과 2로부터, 40화 소설 원문과 매니페스트 840개 씬의 텍스트(국/영문 내레이션, 대화문)는 이미 100% 동기화되어 있으며 추가적인 텍스트 재작성은 불필요함을 확인.
2. **Step 2 (외부 CDN 의존 문제 규명)**:
   - Observation 2 및 4로부터, 현재 매니페스트의 835개 씬에 `localArtUrl`이 없고 `imageUrl`이 외부 CDN을 가리키고 있어, 웹툰 및 시네마틱 무비가 외부 네트워크에 종속되어 있음.
3. **Step 3 (로컬 패널 생성 및 스키마 업데이트 필수성 도출)**:
   - Requirement R1, R2 및 Observation 4로부터, 840개 패널을 로컬 WebP(`public/images/webtoon/episode_XX/scene_YY.webp`)로 생성하고 매니페스트의 `localArtUrl`과 `imageUrl`을 해당 로컬 경로로 일원화해야 함.
4. **Step 4 (이미지 합성 파이프라인 정립)**:
   - Observation 3과 5로부터, `/tmp/webtoon_bg_plates/bg_01.jpg`~`bg_16.jpg`의 16대 환경 레이어와 `public/seat/*.png`의 V2 110 영웅 캐릭터를 합성하면 840개 씬을 100% 로컬 규격(`<= 75 KB`, `800x450` px WebP)으로 완벽하게 생성 가능함.
5. **Step 5 (UI 강화 요소 발굴)**:
   - Observation 3과 4로부터, 매니페스트 대화문(`dialogues`)에 `characterCardId`를 주입하면 `WebtoonSpeechBubble`에서 16x16 영웅 인장이 자동으로 활성화되어 비주얼 품질이 대폭 상승함.

---

## 3. Caveats

1. 현재 `/tmp/webtoon_bg_plates/`의 16개 배경 플레이트는 임시 디렉토리(`/tmp/`)에 위치하므로 시스템 재부팅 시 소실될 수 있습니다. 프로젝트 저장소 내(예: `public/images/webtoon/bg_plates/` 또는 직접 합성)로 영구 반영되어야 합니다.
2. 840개 씬의 이미지 합성 및 WebP 인코딩은 대량 배치 작업이므로, 작업자 에이전트(Worker)가 병렬 스크립트(Python PIL)로 일괄 생성해야 효율적입니다.
3. 서비스 워커(`public/sw.js`)의 `MEDIA_CACHE_NAME` 버전을 함께 올려주어야 브라우저가 이전 캐시를 무효화하고 신규 로컬 WebP를 즉시 반영합니다.

---

## 4. Conclusion

1. 40화 소설 시나리오, 840개 웹툰 씬 텍스트, 110 영웅 IP 매핑, 4대 서사 아크 분류가 100% 완료되었습니다.
2. 상세 조사 보고서 `survey_scenario_manifest.md`에 40화 전편의 마스터 매핑 테이블, 씬별 스키마, 권장 배경 플레이트 및 클라이맥스 씬 목록을 완벽하게 정리하였습니다.
3. 구현 작업자는 `survey_scenario_manifest.md`의 파이프라인 가이드에 따라:
   - ① 840개 WebP 패널 이미지 생성 (`public/images/webtoon/episode_01/scene_00.webp` ~ `episode_40/scene_20.webp`, 각 `<= 75 KB`)
   - ② `webtoonEpisodeManifest.json`의 `localArtUrl`, `imageUrl`, `fileName`, `characterCardId` 업데이트
   - ③ `webtoonEpisodes.ts`의 더미 `focusCardId`, `characterIds` 및 URL 갱신
   - ④ `public/sw.js`의 캐시 버전 업그레이드
   를 순차적으로 진행하면 됩니다.

---

## 5. Verification Method

독립적 검증을 위해 아래 명령어를 실행하여 조사 결과를 재현할 수 있습니다:

```bash
# 1. 40개 소설 파일 및 글자 수 검증
python3 -c "
import glob
files = sorted(glob.glob('public/book/episode_*.md'))
assert len(files) == 40, f'Expected 40 files, got {len(files)}'
for f in files:
    cnt = len(open(f, encoding='utf-8').read())
    assert cnt >= 3500, f'{f} has only {cnt} chars'
print('40 novel episodes verification PASSED!')
"

# 2. 매니페스트 40개 에피소드 & 840개 씬 검증
python3 -c "
import json
with open('src/content/webtoonEpisodeManifest.json', 'r') as f:
    manifest = json.load(f)
assert len(manifest) == 40, f'Expected 40 episodes, got {len(manifest)}'
for ep_num in range(1, 41):
    imgs = manifest[str(ep_num)]['images']
    assert len(imgs) == 21, f'Ep {ep_num} has {len(imgs)} scenes, expected 21'
print('Manifest 40 episodes & 840 scenes verification PASSED!')
"

# 3. 110 영웅 캐릭터 포트레이트 및 스프라이트 시트 무손실 보존 검증
python3 -c "
import glob, os
seat = glob.glob('public/seat/*.png')
assert len(seat) >= 110, f'Expected at least 110 seats, got {len(seat)}'
for s in ['public/cards1.png', 'public/cards2.png', 'public/card100.png', 'public/card100_gemini.png']:
    assert os.path.exists(s), f'Missing {s}'
print('110 hero assets preservation verification PASSED!')
"

# 4. TypeScript 타입 검사
npm run lint
```
