---
name: rsi-snshero
description: 공개 구글 스프레드시트 CSV(2PACX-1vTJLidMIGaaE_tsui-CydxadPU2vesb4cCF_iQIfuq7mFILYrCxgdcSbgRHxUi8--D6oq1ii-TEPIKC)의 바이브코딩 프롬프트 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 순환 화면 혁신 스킬
---

# /rsi-snshero 스킬 지침서

## 개요
`/rsi-snshero`는 공개 구글 스프레드시트 CSV 웹게시 링크 기반의 바이브코딩 프롬프트(기획/디자인/개발 통합 명세)를 차례대로 확인하고,
아직 적용되지 않은 모든 바이브코딩 프롬프트를 소스코드(React 19 + TypeScript 5.8 + Tailwind CSS 4.1)에 전수 구현 및 빌드 검증을 완료하며,
`AGENTS.md`에 진행 과정을 기록하여 다음 실행 시 마지막 완료 항목 이후부터 중단 없이 이어서 진행하는 순환 혁신 스킬입니다.

## 스프레드시트 연동 정보
- **공개 CSV URL**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRMzW-MBD2QmqWD2GZ4KVoKSzO0UdewPXt7Qvsx-z8hpjv3gnT35o4Kgkbxz6CNw4ABnioVkEywSVCv/pub?output=csv`
- **기록 파일**: `AGENTS.md`, `WORK_LOGS.md`

## 필수 수행 원칙

### 1. 디자인 가이드 철저 준수 (DESIGN.md OpenCode 터미널 플랫 미학)
- **100% 모노스페이스 서체 통일**: 모든 텍스트, 라벨, 수치, 버튼 캡션은 `font-mono` (Berkeley Mono, JetBrains Mono, ui-monospace 등)로 일관되게 렌더링합니다. 비-모노스페이스 서체 사용을 엄격히 금지합니다.
- **ASCII 브래킷 및 마커 시스템**: 불릿, 인디케이터, 버튼 액션명에 `[+]`, `[-]`, `[x]`, `[TAP]`, `[v]`, `[!]` 등 터미널 ASCII 브래킷 표기를 적극 활용합니다.
- **모서리 반경(Border Radius) 엄격한 2단계 규칙**:
  - 모달 팝업, 윈도우 박스, 섹션 컨테이너, 카드 외곽 프레임: 반드시 `rounded-none` (0px)을 적용합니다.
  - 버튼, 인풋 필드, 상태 배지 등 터치 가능한 인터랙티브 요소: 최대 `rounded-sm` (4px)만 허용합니다.
  - `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` 등 둥근 모서리는 일체 사용하지 않습니다.
- **촌스러운 그라데이션 및 네온 효과 원천 배제**:
  - 다색 그라데이션(`bg-gradient-to-...`), 과도한 네온 발광, 번쩍이는 핑(`animate-ping`), 바운스(`animate-bounce`), 박스 그림자(`shadow-2xl`, `shadow-[0_0_...]`)를 배제합니다.
  - 웜크림 캔버스(`bg-[#fdfcfc]`) 또는 정갈한 잉크 흑요석 다크(`bg-[#201d1d]`, `#090d16`, `#141212`) 단일 플랫 서피스를 유지합니다.
  - 영역 구분은 1px hairline 보더(`border border-[#646262]/30`, `border-stone-800`, `border-white/10`)를 사용합니다.
- **표준 버튼 스타일 (`button-primary`)**:
  - 배경 `#201d1d` (또는 `#090d16`), 텍스트 `#fdfcfc`, 테두리 1px hairline `border-stone-700`, 모서리 `rounded-sm` (4px), 터치 높이 최소 44px 이상.

### 2. 사용자 경험(UX) 및 화면 미니멀리즘 절대 원칙 (Progressive Disclosure)
- **플레이어 시야 및 조작 영역 침범 원천 차단 (Zero Intrusion)**:
  - 플로팅 버튼이나 고정 HUD가 배틀 뷰(카드 패, 3x3 슬롯, 턴 종료 버튼)나 미니게임 화면의 터치 조작부를 가로막아서는 절대 안 됩니다.
  - 무관한 화면(예: 110종 미니게임 목록 `view === 'play'`)에 배틀 전용 위젯이 노출되지 않도록 라우트 격리를 엄격히 유지합니다.
  - 화면에 상주하는 위젯은 반드시 `[—]` 최소화 접기 토글을 제공하여 언제든 얇은 터미널 탭 형태로 접어둘 수 있도록 구현합니다.
- **연속 자동 팝업 폭탄 방지 (스마트 디퍼링)**:
  - 홈 화면 진입 시 여러 개의 팝업이 연쇄적으로 연속 발동하여 사용자의 시야와 조작을 방해하지 않도록, 세션/일일 단위로 우선순위가 높은 1개만 부드럽게 노출하고 나머지는 유예(defer)합니다.
- **사용자 통제권 및 이탈 방지 (건너뛰기/닫기 상시 제공)**:
  - 모든 온보딩, 튜토리얼, 스토리 대화 모달은 상단 우측에 언제든 즉시 종료할 수 있는 `[x]` 닫기 버튼과 `[건너뛰기 (SKIP)]` 버튼을 최상위 레이어에 명확하게 배치합니다.
- **모바일 원핸드 44px+ 터치 타깃 보장**:
  - 스마트폰 한 손 엄지 조작 환경을 위해 모든 클릭/터치 요소는 최소 44px (`min-h-[44px]`) 이상의 터치 영역을 보장합니다.

### 3. Zero-Emoji & 순수 인라인 SVG 원칙
- 모든 코드, 주석, 다국어 텍스트, 모달 콘텐츠에서 유니코드 이모지(0개)를 절대 배제합니다.
- 모든 아이콘은 `strokeWidth="1.75"` 규격의 경량 인라인 SVG 벡터 또는 `lucide-react`로 정밀하게 렌더링합니다.

### 4. 12대 언어 다국어 지원 (i18n)
- 한국어(`ko`)를 기본으로 하며 영어(`en`), 일본어(`ja`), 중국어 간체(`zh-CN`) 등 12개 주요 언어 사전 객체를 내장하여 하드코딩 없는 다국어를 지원합니다.

### 5. 인프라 무손실 보존
- Google AdSense 광고 슬롯, SEO/GEO 메타태그, `llms.txt`, 암호화폐/카드 결제 모듈, Web MCP를 철저히 보존합니다.

### 6. 엄격한 검증 및 보고
- 소스 변경 후 `npx tsc --noEmit` (0 Errors) 및 `npm run build` 성공을 필수로 검증합니다.
- 로컬 Git 커밋(`git commit`)만 수행하며, 원격 저장소 푸시는 오직 사용자가 `/git-push`를 명시적으로 요청할 때만 실행합니다.
- 작업 완료 후 반드시 연동된 구글 폼(`submit_report.py`)을 통해 작업 완료 보고서를 제출합니다.
