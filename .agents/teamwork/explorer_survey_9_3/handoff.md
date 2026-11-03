# Handoff Report: Shop Mechanics & Responsive Google AdSense Integration Survey

- **Agent**: explorer_survey_9_3
- **Role**: Explorer (Read-Only Codebase Survey)
- **Date**: 2026-11-02
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_3/`
- **Report Document**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_3/report.md`

---

## 1. Observation

1. **상점 구매 시 피드백 및 모달 부재**:
   - `src/landing/views/ShopSection.tsx` Lines 160-176:
     ```ts
     if (itemId === 'pack_normal' || itemId === 'pack_magic' || itemId === 'pack_rare') {
       const unlockedIds: number[] = [];
       const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
       const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;

       for (let i = 0; i < 3; i++) {
         const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
         cardNurtureStore.addCard(randId);
         unlockedIds.push(randId);
       }

       return {
         success: true,
         message: `${item.name}을 구매하여 영웅 카드 3장(ID: ${unlockedIds.join(', ')})을 획득하였습니다!`,
       };
     }
     ```
   - `src/landing/index.ts` Lines 163-171:
     ```ts
     } else if (action === 'buy-shop-item') {
       const itemId = target.getAttribute('data-item-id');
       if (itemId) {
         const res = executeShopPurchase(itemId);
         if (!res.success) {
           alert(res.message);
         }
         renderApp();
       }
     }
     ```
     `res.success`가 `true`일 때 모달 오픈이나 시각적 카드 공개 연출이 전혀 없으며 `alert`조차 스킵되어 무음으로 카드가 삼켜짐.

2. **인벤토리 저장소 이원화**:
   - `src/landing/services/cardNurtureStore.ts` Lines 164-174:
     `addCard(cardId)`는 오직 `this.ownedCardIds` 배열에 푸시하고 `this.saveToStorage()`를 통해 `localStorage.getItem('hero_card_nurturing')`에만 저장함.
   - `src/App.tsx` Lines 1246-1264 및 4826-4844:
     메인 게임 엔진과 배틀 전장은 `hero_inventory`, `hero_inventory_${season}`에 저장된 `Record<number, { cardIndex, quantity, rarity }>`를 단일 진실 공급원으로 참조함.
     따라서 `#shop`에서 구매한 카드가 본체 게임 인벤토리에 반영되지 않음.

3. **재화 잔액 갱신 불일치**:
   - `src/landing/views/ShopSection.tsx` Lines 119-136:
     `getUserCoins()`와 `setUserCoins()`는 `localStorage.getItem('hero_sns')`만 조작함.
   - `src/App.tsx` Lines 1207-1232 및 4995-5011:
     `purchasedSns` (`hero_purchased_sns`)와 `earnedSns` (`hero_earned_sns`)를 기반으로 합산 동기화하므로, `hero_sns`만 수정될 경우 세션/새로고침 시 잔액 충돌 가능성이 있음.

4. **비무료 통화 충전 체계 부재**:
   - `src/landing/views/ShopSection.tsx` Lines 108-116 및 144-147:
     `coin_charge`는 `priceCoins: 0`으로 100% 무료 무제한 지급으로 임시 구현되어 있으며, 인게임 로컬스토리지 잔액(`hero_gold` 등)을 소모하는 비무료 충전/환전 루프가 부재함.

5. **정적 랜딩 내 애드센스 컨테이너 전무**:
   - `index.html` Line 717에 `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6937094123258335" crossorigin="anonymous"></script>`가 선언되어 있으나,
   - `src/landing/index.ts` Lines 57-89의 `renderApp()` 내부에는 애드센스 광고 컨테이너(`<ins class="adsbygoogle">`)가 0개임.
   - `src/App.tsx` Lines 6770-6784 (좌측 날개), 6797-6813 (모바일 상단 배너), 8691-8705 (우측 날개)에 구현된 애드센스 레이아웃이 정적 랜딩에 미반영 상태임.

---

## 2. Logic Chain

1. **상점 카드팩 개봉 문제**:
   - 관측 1에서 `executeShopPurchase` 성공 시 반환되는 3장의 카드 ID가 UI에 노출되지 않고 `renderApp()`으로 그냥 넘어감을 확인.
   - 따라서 플레이어는 재화가 차감된 후 무엇을 얻었는지 확인할 수 없으므로, 카드팩 구매 성공 시 `state.activeModal = 'pack_reveal'`로 전환하여 3장의 카드 일러스트, 등급, 스탯을 노출하는 `PackRevealModal`이 필수적임.

2. **인벤토리 동기화 문제**:
   - 관측 2에서 `cardNurtureStore`는 `hero_card_nurturing`만 수정하고 본체 게임의 `hero_inventory`를 수정하지 않음을 확인.
   - 따라서 `#shop`에서 카드를 뽑아도 카드 배틀(`MobileCardPlayScreen.tsx`) 및 마이덱(`MyDeckView.tsx`)에서 미보유 상태로 남는 치명적 데이터 단절이 발생함.
   - 그러므로 카드 획득 시 `cardNurtureStore`와 `hero_inventory`를 동시에 갱신하는 Dual-Write 헬퍼가 필수적임.

3. **재화 잔액 동기화 문제**:
   - 관측 3에서 `hero_sns` 단일 키만 갱신될 경우 `App.tsx`의 `purchasedSns + earnedSns` 로직과 충돌함을 확인.
   - 통화 변경 시 `hero_sns`, `hero_earned_sns`, `hero_sns_season1`을 일괄 동기화하고 `snshero_sns_updated`, `hero_sns_updated`를 동시 디스패치해야 함.

4. **비무료 통화 충전 체계**:
   - 관측 4에서 `coin_charge`가 대가 없는 1,000 SNS 무한 지급임을 확인.
   - 요구사항 "non-free currency replenishment using in-game LocalStorage currency balances"를 만족하려면 인게임 골드(`hero_gold`)를 소모하여 SNS 코인으로 환전하거나 일일 1회 한정 보급 쿨타임을 적용하는 교환 모달이 필요함.

5. **애드센스 레이아웃 통합**:
   - 관측 5에서 `index.html`에 스크립트만 로드되고 렌더링 컨테이너가 없음을 확인.
   - 데스크톱(>=1024px)에서는 중앙 콘텐츠(`max-w-[1024px]`) 좌우의 빈 여백(Gutter)에 스카이스크래퍼(120x600/160x600)를 배치하면 게임 UI를 전혀 침범하지 않음.
   - 모바일(<1024px)에서는 상단 헤더 바로 아래에 60~72px 높이의 가로 배너를 배치하면 터치 조작부나 카드 핸드를 가리지 않고 깔끔하게 문서 흐름을 유지함.
   - 광고 제거(`hero_ad_removed === 'true'`) 시에는 이 컨테이너들이 렌더링되지 않도록 가드를 둠.

---

## 3. Caveats

- 본 에이전트는 **Read-Only 조사 에이전트**로서 소스 코드를 직접 수정하지 않고 상세 보고서와 아키텍처 청사진을 작성하였습니다.
- 실제 구현 시 `CARD_DATABASE`의 희귀도 분포(브론즈: 1~50, 실버: 51~80, 골드: 81~100, 보스/SSR: 101~110)를 기반으로 카드팩 등급별 당첨 풀을 정밀하게 구성해야 합니다.
- 애드센스 슬롯 ID(`data-ad-slot`)는 현재 배포 전 플레이스홀더 상태이므로, 프로덕션 배포 시 구글 애드센스 콘솔에서 발급받은 실제 10자리 슬롯 번호로 교체할 수 있도록 `ADSENSE_CONFIG` 상수로 중앙 집중화해야 합니다.

---

## 4. Conclusion

1. **상점 메커니즘 결함 진단 완결**:
   - 카드팩 개봉 모달 누락, 인벤토리 이중 동기화 누락, 재화 서브키 미동기화, 비무료 통화 충전 루프 부재의 원인과 해결 코드를 완벽히 규명하였습니다.
2. **반응형 구글 애드센스 설계 완결**:
   - 데스크톱(>=1024px) 좌우 날개 거터(120x600/160x600)와 모바일(<1024px) 상단 가로 배너(60~72px)의 반응형 계층 구조와 템플릿 스트링 코드를 전수 도출하였습니다.
3. 상세 보고서는 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_3/report.md`에 작성되었습니다.

---

## 5. Verification Method

1. **보고서 파일 무결성 확인**:
   - `view_file`을 통해 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_3/report.md`가 정상 생성되었는지 확인.
2. **구현 후 독립 정적 빌드 검증**:
   - `npm run build` (또는 `vite build`)가 exit code 0으로 성공하는지 검증.
3. **기능 검증**:
   - 브라우저에서 `/#shop` 접속 후 일반/매직/희귀 카드팩 구매 시:
     - 코인이 정확히 차감되는지 확인.
     - 카드팩 개봉 모달이 뜨고 획득한 3장의 카드 일러스트/스탯이 노출되는지 확인.
     - `hero_card_nurturing` 및 `hero_inventory` 양쪽에 카드가 기록되는지 확인.
     - `#deck` 및 `#card`로 이동 시 구매한 카드가 즉시 보유 목록에 나타나는지 확인.
   - 코인 충전 시:
     - 인게임 골드 잔액을 차감하고 SNS 코인을 정상 적립하는지 확인.
   - 애드센스 뷰포트 전환 시:
     - 1024px 이상에서는 좌우 거터에 `<aside id="adsense-desktop-left">`, `<aside id="adsense-desktop-right">`가 표시되고 상단 배너가 숨겨지는지 확인.
     - 1024px 미만에서는 상단 배너 `<div id="adsense-mobile-top">`이 표시되고 좌우 거터가 숨겨지는지 확인.
     - 광고 제거 구매 시 모든 광고가 즉시 사라지는지 확인.
