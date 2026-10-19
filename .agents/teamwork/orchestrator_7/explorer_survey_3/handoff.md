# Explorer Survey 3 Handoff Report: 실사 시네마 전 40화 프론트엔드 연동 및 검증 체계 조사

## 1. 직접 관찰 내용 (Observation)

### 1.1 `src/views/CinemaView.tsx` 현행 분석
- **MP4 및 포스터 URL 분기 (Lines 175–184)**:
  ```tsx
  const mp4Url =
    currentEpisodeNum === 1
      ? '/videos/cinema/episode_01.mp4?v=8head72en'
      : `/videos/episodes/episode_${String(currentEpisodeNum).padStart(2, '0')}.mp4`;

  const posterUrl =
    currentEpisodeNum === 1
      ? '/images/cinema/episode_01_acting/seq_01_frame_01.webp'
      : `/images/webtoon/episode_${String(currentEpisodeNum).padStart(2, '0')}/scene_00.webp`;
  ```
  - 에피소드 1화만 실사 시네마 비디오(`/videos/cinema/episode_01.mp4`) 및 실사 1프레임 포스터를 사용함.
  - 2~40화는 기존 2D 웹툰 애니메이션 MP4(`/videos/episodes/episode_XX.mp4`) 및 웹툰 씬 포스터를 참조함.
- **상단 배너 하드코딩 (Lines 217–219)**:
  ```tsx
  <span className="px-1.5 py-0.5 rounded-sm bg-amber-400 text-black text-[10px] font-bold font-mono">
    제1화 72프레임 연속 연기 & PyTorch 모션 워핑 적용
  </span>
  ```
- **비디오 CSS 이중 필터 (Lines 312–316)**:
  ```tsx
  style={
    currentEpisodeNum > 1
      ? { filter: 'contrast(1.16) saturate(0.82) sepia(0.10) brightness(0.95)' }
      : undefined
  }
  ```
  - 2화 이상에서 웹툰 영상에 가상 70mm 톤을 주던 필터로, 렌더링된 실사 MP4 재생 시 이중 필터링 왜곡 발생 원인.
- **회차 정보 바 배지 (Lines 351–361)**:
  ```tsx
  {currentEpisodeNum === 1 ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-400">
      <Sparkles size={12} />
      [★] 100% 실사 마스터 촬영본
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-sky-50 text-sky-900 border border-sky-300">
      <CheckCircle2 size={12} />
      [70mm LUT 리마스터 상영]
    </span>
  )}
  ```
  - 요청 명세: `[★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)` 배지를 40화 전편에 표시해야 함.
- **필터 탭 및 그리드/드로어 배지 (Lines 484–495, 509, 543, 601, 641)**:
  - `const isMasterLive = ep === 1;`, `const isMaster = ep === 1;`로 하드코딩되어 1화만 `★ 실사 마스터`, 2~40화는 `70mm LUT`로 표시됨.

### 1.2 `src/components/movie/LiveActionCinemaPlayer.tsx` 현행 분석
- **플립북 72프레임 매핑 (Lines 440–484)**:
  ```tsx
  const getActiveCinemaFrameUrl = (): string => {
    if (usingFallbackImg) return currentScene.fallbackImageUrl;
    if (episodeNumber === 1 && currentSceneIdx > 0) {
      let seqNum = 1;
      let startFrame = 1;
      let endFrame = 9;
      // ... piecewise 구간 매핑 ...
      return `/images/cinema/episode_01_acting/seq_${String(seqNum).padStart(2, '0')}_frame_${String(frameIdx).padStart(2, '0')}.webp`;
    }
    return currentScene.cinemaImageUrl;
  };
  ```
  - `episodeNumber === 1`만 72프레임 실사 연기 이미지(`/images/cinema/episode_01_acting/seq_XX_frame_YY.webp`)를 로드.
  - 2~40화는 `currentScene.cinemaImageUrl`(`/images/cinema/episode_XX/scene_YY.webp`)로 떨어져 `onError` 시 웹툰 씬으로 fallback됨.
- **플레이어 상단 스테이터스 (Lines 502–510)**:
  - `episodeNumber === 1`만 `[v] 72프레임 연속 동작 플립북` 배지가 켜지고, 나머지는 `[70mm 아나모픽 LUT 리마스터 모드]` 노출.
- **자막 박스 분기 (Lines 605–640)**:
  ```tsx
  {episodeNumber !== 1 && currentSceneIdx > 0 && (
    <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-3 ...">
      ...
    </div>
  )}
  ```
  - 1화만 자막 박스가 억제되어 있고, 2~40화는 자막이 노출됨.
  - 요구사항 R2/R3.2는 40화 전편에 걸쳐 "순수 72프레임 무자막 연기 & 영어 TTS 보이스오버"를 규정함.
- **영어 오프닝 타이틀 (Lines 589–603)**:
  - `currentSceneIdx === 0`일 때 이미 영문 전용(`SNSHERO ORIGINAL LIVE-ACTION CINEMA`, `EPISODE XX`, `{titleEn}`)으로 완벽히 구현되어 있음.
- **영어 TTS 보이스오버 (Lines 284–290)**:
  - `movieAudio.speakNarration(`${spk}${dlg}${currentScene.narrationEn}`, 'en')`으로 이미 영어(`en`) TTS로 호출됨.

### 1.3 기존 빌드 및 테스트 상태 직접 실행 결과
- `npx tsc --noEmit`: 0 errors (종료 코드 0).
- `npm run build`: Vite 프로덕션 번들링 및 정적 52개 페이지 생성 전수 통과 (종료 코드 0).
- 에피소드 01화 MP4 ffprobe:
  - 코덱: `h264`, 해상도: `800x450`, 프레임레이트: `24/1`, 재생시간: `140.29초 (> 60s)`
  - 오디오 코덱: `aac`, 샘플레이트: `44100Hz`, 채널: `2 (stereo)`
  - 용량: `17.96 MB (> 3MB)`
- 에피소드 01화 72프레임 SHA-256 검증:
  - `public/images/cinema/episode_01_acting/seq_01_frame_01.webp` ~ `seq_08_frame_09.webp` 72개 전수 존재 및 고유 해시 72개 확인 (중복 0건).

---

## 2. 논리 체인 (Logic Chain)

1. **관찰 1.1 및 1.2 기반 추론**:
   - 현재 프론트엔드는 Episode 01 파일럿 검증을 위해 하드코딩된 분기문(`currentEpisodeNum === 1`, `episodeNumber === 1`)으로 작성되어 있음.
   - 따라서 프론트엔드에서 40화 전편을 실사 시네마로 동작하게 하려면, 경로 템플릿을 `episode_${padEp}` 형태로 통일하고 분기문을 `1..40` 범위 전체에 적용되도록 수정해야 함.
2. **배지 표기 추론**:
   - 현재 `[★] 100% 실사 마스터 촬영본` 텍스트는 1화에만 켜지며, 뒤에 `(72프레임 연속 연기)` 문구가 누락되어 있음.
   - 요구사항에 맞춰 `[★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)`로 배지 텍스트를 업데이트하고, 활성화 기준을 `ep >= 1 && ep <= 40` (또는 `ep <= TOTAL_EPISODES`)로 전환해야 함.
3. **플립북 연속 72프레임 매핑 추론**:
   - 에피소드별로 `WEBTOON_MANIFEST` 상의 씬 수가 48~52개로 상이함 (Ep 1은 50개, Ep 2는 48개, Ep 10은 51개 등).
   - 따라서 고정된 씬 인덱스 대신, 씬 진행도 정규화 공식 `storyProg = (currentSceneIdx - 1 + sceneProgress) / (scenes.length - 1)`을 사용하여 0.0~1.0을 72개 프레임(8개 시퀀스 × 9개 프레임)으로 연속 매핑하면 모든 회차에서 씬 수 편차에 상관없이 완벽하게 1번부터 72번 프레임까지 재생됨.
4. **자막 오버레이 제거 추론**:
   - `LiveActionCinemaPlayer.tsx` 606행의 `{episodeNumber !== 1 && currentSceneIdx > 0 && (...) }`는 1화에만 자막을 끄고 2~40화는 자막을 켰던 임시 코드임.
   - 요구사항 R2/R3.2의 "ZERO subtitles, ZERO speaker tags, ZERO HUD text on acting frames"를 충족하려면 실사 시네마 모드에서 자막 오버레이 블록을 전체 회차에 대해 렌더링하지 않도록 처리해야 함.

---

## 3. 주의사항 및 미조사 영역 (Caveats)

1. **읽기 전용 조사 원칙**: 본 에이전트는 Explorer 역할이므로 소스 코드 변경을 직접 커밋하지 않으며, 구체적 수정 지침과 검증 스크립트 규격을 제공함.
2. **에셋 생성과의 순서 종속성**:
   - 프론트엔드 코드를 먼저 수정하더라도, `public/videos/cinema/episode_02.mp4`~`episode_40.mp4` 및 `episode_02_acting/` 디렉토리가 생성되기 전에는 브라우저에서 404가 발생할 수 있음.
   - 단, `LiveActionCinemaPlayer.tsx`의 `<img>`에 `onError` 시 `usingFallbackImg = true` 처리가 이미 내장되어 있어 크래시 없이 부드럽게 기존 이미지로 fallback됨.
3. **디스크 용량 모니터링**:
   - 40개 에피소드 × 72프레임 = 2,880개 WebP 파일 (~150MB 예상)
   - 40개 MP4 비디오 (회당 ~15MB) = ~600MB 예상
   - 총 1GB 미만으로 디스크 여유 공간(현재 충분) 내에서 안전하게 수용 가능함.

---

## 4. 최종 결론 (Conclusion)

- **프론트엔드 수정 소요**: `CinemaView.tsx`(6개 위치) 및 `LiveActionCinemaPlayer.tsx`(4개 위치)로 국한되며, 코드 구조 변경 없이 변수 템플릿 및 조건식 완화만으로 100% 대응 가능함.
- **배지 기준**: 40개 전편에 대해 `[★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)` 배지 표시.
- **검증 체계 완비**: 40개 MP4의 ffprobe 파라미터(H.264, 800x450, 24fps, AAC 44.1kHz, >=60s), 2,880개 프레임의 SHA-256 고유성, `tsc --noEmit`, `npm run build`를 일괄 검증하는 파이썬 스크립트 작성 준비 완료.

---

## 5. 상세 수정 명세 및 독립 검증 방법 (Verification Method)

### 5.1 `src/views/CinemaView.tsx` 수정 명세
```tsx
// 1. mp4Url & posterUrl (Lines 175-184)
const padEp = String(currentEpisodeNum).padStart(2, '0');
const mp4Url = `/videos/cinema/episode_${padEp}.mp4`;
const posterUrl = `/images/cinema/episode_${padEp}_acting/seq_01_frame_01.webp`;

// 2. 상단 배너 텍스트 (Line 218)
<span className="px-1.5 py-0.5 rounded-sm bg-amber-400 text-black text-[10px] font-bold font-mono">
  전 40화 72프레임 연속 연기 & PyTorch 모션 워핑 적용
</span>

// 3. 비디오 스타일 인위적 필터 제거 (Lines 312-316)
// style={currentEpisodeNum > 1 ? ... : undefined} 제거 -> style={undefined}

// 4. 회차 정보 바 배지 (Lines 351-361)
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-400 font-mono">
  <Sparkles size={12} />
  [★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)
</span>

// 5. 그리드 & 드로어 마스터 배지 (Lines 509, 601)
const isMasterLive = ep >= 1 && ep <= TOTAL_EPISODES;
const isMaster = ep >= 1 && ep <= TOTAL_EPISODES;
// 둘 다 '★ 실사 마스터' 표시
```

### 5.2 `src/components/movie/LiveActionCinemaPlayer.tsx` 수정 명세
```tsx
// 1. 72프레임 프레임 URL 일반화 (Lines 440-484)
const getActiveCinemaFrameUrl = (): string => {
  if (usingFallbackImg) return currentScene.fallbackImageUrl;
  if (episodeNumber >= 1 && episodeNumber <= totalEpisodes && currentSceneIdx > 0) {
    const padEp = String(episodeNumber).padStart(2, '0');
    const numStoryScenes = Math.max(1, scenes.length - 1);
    const storyProg = Math.max(0, Math.min(0.9999, (currentSceneIdx - 1 + sceneProgress) / numStoryScenes));
    const globalFrame = Math.floor(storyProg * 72); // 0 .. 71
    const seqNum = Math.floor(globalFrame / 9) + 1;  // 1 .. 8
    const frameIdx = (globalFrame % 9) + 1;          // 1 .. 9
    const padSeq = String(seqNum).padStart(2, '0');
    const padFrm = String(frameIdx).padStart(2, '0');
    return `/images/cinema/episode_${padEp}_acting/seq_${padSeq}_frame_${padFrm}.webp`;
  }
  return currentScene.cinemaImageUrl;
};

// 2. 상단 스테이터스 배지 (Lines 502-510)
<span className="px-1.5 py-0.5 rounded-sm bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px]">
  [v] 72프레임 연속 동작 플립북
</span>

// 3. 자막 오버레이 제거 (Line 606)
// 실사 시네마에서는 전체 회차 자막 비활성화 ({false && ...})
```

### 5.3 40개 에피소드 자동화 검증 스크립트 규격
검증 스크립트: `tests/verify_cinema_40_episodes.py`
실행 커맨드: `python3 tests/verify_cinema_40_episodes.py`

검증 항목:
1. **MP4 검증 (Episodes 01–40)**:
   - 파일 존재 및 크기 > 3.0 MB
   - `ffprobe` 파싱: `v:codec_name == 'h264'`, `v:width == 800`, `v:height == 450`, `v:fps == 24`, `v:duration >= 60.0s`
   - `ffprobe` 파싱: `a:codec_name == 'aac'`, `a:sample_rate == 44100`, `a:channels == 2`
2. **프레임 검증 (Episodes 01–40)**:
   - 디렉토리 `public/images/cinema/episode_XX_acting/` 존재
   - 정확히 72개의 `seq_XX_frame_YY.webp` 존재
   - 72개 프레임의 SHA-256 해시가 전부 상이함 (중복 0건)
3. **타입 및 번들 검증**:
   - `npx tsc --noEmit` -> 종료 코드 0
   - `npm run build` -> 종료 코드 0
