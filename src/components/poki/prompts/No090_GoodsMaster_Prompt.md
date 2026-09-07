# Poki No.090: Goods Master (Three.js 3D 리마스터 기획 프롬프트)

## 1. 게임 개요
- **게임명**: Goods Master 3D
- **장르**: 3D 슈퍼마켓 선반 정리 & 트리플 매치 퍼즐
- **카테고리**: 두뇌 퍼즐, 캐주얼 게임, 스킬 게임
- **원작 URL**: https://poki.com/kr/g/goods-master
- **연동 카드**: No.090 영웅 카드 (`drawCardSprite` 마켓 선반 상단 간판 엠블럼)

## 2. 핵심 게임 메커니즘
1. **3D 슈퍼마켓 진열대 (Market Shelf Rack)**:
   - 3단 3열의 우드 마켓 랙과 밝은 쇼케이스 스팟 라이트.
   - 선반 상단에 No.090 공식 카드 영웅 배지 대형 네온 간판 각인.
2. **6종 3D 상품 모델링 (총 18개, 각 3개씩)**:
   - 1) 🥤 레드 소다 캔 (Red Soda Can)
   - 2) 🍟 골든 칩스 백 (Chips Bag)
   - 3) 🥛 블루 밀크 보틀 (Milk Bottle)
   - 4) 🍩 퍼플 도넛 박스 (Donut Box)
   - 5) ⚡ 그린 에너지 드링크 (Energy Drink)
   - 6) 🍊 오렌지 쥬스 팩 (Juice Carton)
3. **트리플 매치 & 카트 슬롯 룰**:
   - 상품을 탭하면 하단 7칸 카트 트레이로 비행 안착.
   - 동일 상품 3개가 트레이에 모이면 황금 스파클과 함께 "TRIPLE MATCH! +300" 폭발 제거.
   - 앞줄 상품이 정리되면 뒷줄의 새로운 상품이 노출.
   - 카트 7칸이 꽉 차서 더 이상 둘 곳이 없으면 게임오버.
   - 18개 상품 전원 클리어 시 승리 세레모니 및 콘페티 분출.
4. **모바일 퓨어 터치 조작계 (100% 모바일 제스처)**:
   - 3D 레이캐스팅 다이렉트 탭으로 선반 위 상품 선택.
   - 화면 터치 드래그로 선반 3D 쿼터뷰 미세 틸트 회전 (Screen-relative 완벽 일치).
   - 하단 76px [✨ AUTO MATCH] 원터치 자동 3매치 힌트/완료 버튼 + 64px [↩️ UNDO] 버튼 + 햅틱 연동.
   - `MinimalistMissionHUD` (매칭 완료 6세트 진행도, 카트 슬롯 상태, 실적 비례 20~50 SNS 안전 정산).

## 3. 기술 스택
- React 19 + TypeScript + Three.js + Tailwind CSS 4
- `drawCardSprite(heroCtx, 90, 18, 18, 220, 220, { circleClip: true })`
- `calculateAndDepositMissionReward` 표준 리워드 게이트웨이
