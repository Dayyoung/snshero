---
name: update-stone
description: game.html(src/hearthstone/**)의 최신 기술·엔진·성능·UI/UX 업데이트를 분석하여 stone.html(src/stone/**)에 동기화하는 스킬. 원본 하스스톤 고유 리소스·기능·단독 업데이트 가능성을 유지하며, 라이선스 위반 소송 방지를 위해 결제 기능은 절대 추가하지 않고 100% 무료로 유지합니다.
---

# /update-stone 스킬 지침서

## 개요
이 스킬은 `game.html` (`src/hearthstone/**`)에 적용된 최신 기술적 개선·성능 최적화·전투 엔진 버그 수정·UI/UX 편의 기능들을 `stone.html` (`src/stone/**`)로 안전하게 동기화합니다.
동기화 과정에서도 `stone.html`은 **오리지널 하스스톤(Hearthstone) 1:1 재현**이라는 고유 정체성과 단독 업데이트 가능성을 100% 유지하며, **어떠한 유료 결제 기능도 포함하지 않는 완전 무료 버전**으로 유지합니다.

---

## 4대 절대 원칙 (Mandatory Governance)

1. **유료 결제 기능 절대 금지 (100% 무료 유지 / 라이선스 소송 예방)**
   - 블리자드(Blizzard) IP 라이선스 위반 및 법적 분쟁을 원천 방지하기 위해, `stone.html` 및 `src/stone/**`에는 **어떠한 유료 결제·현금 구매·수익화 결제 기능도 절대 추가하지 않습니다.**
   - 금지 대상: `paymentGateway`, PayApp, PayPal, 현금 카드팩/영웅/배틀패스 구매 버튼, 유료 광고 제거 상품, 결제 성공 모달 등 일체의 금전 거래 로직.
   - 카드팩, 투기장, 카드 제작 등은 오직 **무료 인게임 골드, 일일 퀘스트 보상, 무료 지급 팩** 등 순수 무료 게임 내 재화로만 동작해야 합니다.

2. **원본 하스스톤 고유 리소스·기능·정체성 100% 유지**
   - 에셋 경로는 오직 **`public/stone-assets/**`**만 사용합니다. (`public/hs-assets/**`나 눈히어로 전용 이미지/성우 혼입 금지)
   - 오리지널 하스스톤의 영웅(제이나, 우서, 쓰랄, 안두인 등), 카드명, 일러스트, 카드 프레임, 사운드, 여관주인 음성 등 원작 고유 리소스를 훼손하지 않습니다.
   - 눈히어로 독자 IP 기능(`카단의 여정` 40화 스토리모드, 여정 전용 `3장=3배` 각성 법칙, 웹소설 5컷 TTS 극장 등)은 이식하지 않습니다.
   - 수집 가능 카드 풀은 별도의 확장팩 추가 지시가 없는 한 기존 클래식 카드 풀(382장)을 유지합니다.

3. **코드·데이터 완전 독립성 유지 (향후 `stone` 단독 업데이트 가능 구조)**
   - `src/stone/**` 파일 내에서 `src/hearthstone/**`의 모듈을 직접 `import`하지 않습니다.
   - 업데이트 이식 시 반드시 `src/stone/**` 내부 코드로 독립 구현하여, 향후 사용자가 `stone.html` 단독으로 확장팩 추가나 원작 전용 기능을 업데이트하더라도 `game.html`과 간섭 없이 동작할 수 있게 유지합니다.
   - 로컬스토리지는 오직 **`stone_hs_*`** 네임스페이스 키만 사용합니다 (`hero_hs_*`나 `hero_*` 키와 절대 혼합 금지).

4. **명시적 호출 시에만 실행**
   - 사용자가 `/update-stone`을 호출하거나 `stone.html` 동기화를 명시적으로 요청할 때만 `src/stone/**` 및 `stone.html`을 수정합니다.

---

## 동기화 분류 기준 (이식 대상 vs 제외 대상)

| 분류 | 동기화 대상 (`game.html` ➔ `stone.html` 반영) | 제외 대상 (이식 금지) |
| :--- | :--- | :--- |
| **전투 엔진 & AI** | `GameEngine.ts`, `aiController.ts`의 룰 버그 수정, 상태이상 처리, 물리 돌진/충돌(`triggerPhysicalAttack`) 안정화 | 여정 보스 전용 스탯 배율, `3장=3배` 각성 배수 로직 |
| **성능 & 렌더링** | `BoardVfxCanvas.tsx` 레이아웃 스래싱 제거/IDLE 루프, `React.memo`, 순수 `translate3d` GPU 셰이크 최적화 | - |
| **UI / UX** | 영웅 중앙 정렬, 우측하단 마나 트레이, 랭킹/AI 자동플레이 매판 리셋 버튼, 의뢰/보상 토글 버튼, `stone_hs_*` 독립 백업/복원/초기화 | 눈히어로 전용 UI(`SnsHeroArtKit`), 웹소설/뉴스룸 링크, `카단의 여정` 40화 UI |
| **오디오 & 진동** | `audio.ts` 창 포커스 이탈 시 음소거, 데미지 비례 햅틱 진동, BGM/SFX 채널 안정화 | 스토리모드 5컷 TTS 내레이션(필요 시 오디오 포커스 뮤트만 반영) |
| **상점 & 결제** | 무료 골드 카드팩 개봉 확률/천장(Pity Timer) 정확도 개선 | **모든 현금 결제 기능(PayApp/PayPal/결제 모달/유료 상품 전체)** |

---

## 수행 절차 (Step-by-Step)

1. **변경 이력 분석 (`src/hearthstone/**` & `game.html`)**
   - 최근 `git log`를 조회하여 `src/stone/**` 마지막 동기화 이후 `src/hearthstone/**` 및 `game.html`에 추가된 기능, 버그 수정, 성능 최적화 커밋 목록을 파악합니다.
   ```bash
   git log -n 20 --oneline -- src/hearthstone/ game.html
   git log -n 5 --oneline -- src/stone/ stone.html
   ```

2. **이식 항목 선별 및 필터링**
   - 추출된 변경사항에서 **유료 결제 관련 코드**와 **눈히어로 고유 IP(카단의 여정, `hs-assets`, `hero_hs_*`)**를 철저히 제외합니다.
   - 사용자에게 어떤 항목들이 동기화 대상인지(또는 바로 진행 가능한 항목을) 정리해 적용합니다.

3. **`src/stone/**` 및 `stone.html` 독립 이식**
   - `src/stone/` 내 대응 파일(`BattleScreen.tsx`, `CardVisual.tsx`, `BoardVfxCanvas.tsx`, `audio.ts`, `storage.ts`, `Modals.tsx`, `stone.html` 등)에 변경사항을 이식합니다.
   - 이식 과정에서:
     - `src/hearthstone/` 직접 import가 없는지 확인
     - 로컬스토리지 키가 `stone_hs_*`인지 확인
     - 에셋 경로가 `/stone-assets/...`인지 확인
     - 텍스트/영웅명/카드명이 오리지널 하스스톤 기준인지 확인

4. **보안·라이선스·격리 검증 (Grep Sanity Check)**
   - 아래 명령으로 금지된 결제/눈히어로 코드나 타 게임 키가 섞이지 않았는지 반드시 검증합니다.
   ```bash
   grep -rn "paymentGateway\|PayApp\|PayPal\|hero_hs_\|hs-assets\|kadanJourney" src/stone/ stone.html || true
   ```
   - 출력 결과가 0건이어야 통과입니다.

5. **프로덕션 빌드 검증**
   - 전체 빌드를 실행해 TypeScript/Vite 오류가 없음을 확인하고, 포스트빌드에서 생성된 불필요한 SEO 디프를 정리합니다.
   ```bash
   npm run build && git checkout -- public/version.json public/sitemap*.xml public/news-feed.xml public/rss.xml public/animation* public/cinema* public/movie* public/r/news* public/reddit* public/data/google-news.csv 2>/dev/null && git clean -fd public/cinema public/movie 2>/dev/null || true
   ```

6. **기록·로컬 커밋·보고**
   - `WORK_LOGS.md` 상단에 `/update-stone` 동기화 내역을 기록합니다.
   - 변경사항을 로컬에 `git commit`합니다 (`git push`는 사용자가 `/git-push`를 요청할 때만 수행).
   - 구글 폼 완료 보고서를 제출합니다:
     ```bash
     python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[/update-stone] game.html 최신 업데이트 -> stone.html 동기화 완료" --status "작업완료" --details "[동기화된 기능 목록, 무료/결제제외 검증, 빌드 검증 결과]"
     ```
   - 사용자에게 한국어로 동기화 내역 및 검증 결과를 보고합니다.
