# Poki No.009: Blocky Blast Puzzle 3D 리마스터 구현 프롬프트

## 1. 개요
- **게임명**: Blocky Blast Puzzle 3D (복셀 블록 라인 폭파 퍼즐)
- **장르**: 3D 복셀 블록 배치 & 라인 클리어 퍼즐
- **엔진**: Three.js (JavaScript 3D Library)
- **참조 링크**: `https://poki.com/kr/g/blocky-blast-puzzle`
- **카드 스프라이트**: No.09 영웅 배지 및 3D 보드 중앙 엠블럼

## 2. 핵심 게임플레이 메커니즘
1. **8x8 3D 복셀 보드 그리드**:
   - 64개의 오목한 3D 네온 슬레이트 그리드 슬롯.
   - 블록 드래그 시 실시간 착지 예상 칸(Ghost Preview) 하이라이트.
2. **다양한 3D 복셀 블록 피스 & 드래그 앤 드롭**:
   - 하단에 3개의 무작위 블록 피스 (1x1, 2x2, 3x3, L자, T자, 1x4 막대 등 다채로운 보석 큐브).
   - 모바일 터치 시 손가락에 블록이 가려지지 않는 **Finger Offset (Y축 오프셋)** 스마트 드래그.
3. **라인 클리어 & 3D 복셀 블록 폭파 (Blast Effect)**:
   - 가로 또는 세로 8칸이 꽉 차면 3D 큐브들이 파편으로 산산조각 폭발하며 제거.
   - 다중 라인 동시 클리어 시 'COMBO x2, x3' 텍스트 및 사운드/진동 햅틱 보너스.
4. **HOLD 슬롯**:
   - 까다로운 블록 1개를 보관하여 위기 상황을 타개할 수 있는 전술적 홀드 시스템.
5. **모바일 100% 최적화 표준**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - Three.js 캔버스 뷰포트 `absolute inset-0 w-full h-full`
   - `ResizeObserver` + `orientationchange`로 실시간 화면 크기 및 종횡비 완벽 동기화.
   - 터치 드래그 앤 드롭 0ms 반응 및 햅틱 진동 피드백.
6. **미션 정산 & 로컬스토리지 보존**:
   - `MinimalistMissionHUD` 연동: 중도 포기/뒤로가기 시 확인 팝업 및 점수/클리어 라인 수에 비례한 SNS 포인트 보상 정산 지급!
