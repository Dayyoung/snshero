# SNS히어로 디자인 가이드 (DESIGN_GUIDE.md)

이 가이드는 SNS히어로 프로젝트 내 모든 화면의 일관성과 프리미엄 비주얼을 유지하기 위한 공식 UI 표준 정의서입니다. 파편화된 네오브루탈리즘 요소를 배제하고, 현대적인 대중적 디자인 가이드에 맞춰 전격 통일합니다.

---

## 1. 기본 타이포그래피 (Typography)
- **기본 폰트**: 모든 화면에 `font-sans`를 적용합니다. 터미널 로그, 해시코드 등 특수한 디버깅/로그 화면을 제외하고 `font-mono` 사용을 전면 금지합니다.
- **제목(Title)**: `text-lg` 내지 `text-xl` 크기의 `font-bold` 또는 `font-extrabold`를 적용하여 굵고 깔끔하게 표현합니다.
- **본문**: `text-slate-600` 또는 `text-slate-700` 색상 및 `font-medium`을 활용하여 가독성을 높입니다.

---

## 2. 공통 페이지 레이아웃 (Header / Body / Footer)
- **공통 헤더 (Header)**:
  - 클래스: `h-16 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white shrink-0`
  - 좌측 영역: 뒤로가기 버튼 (`p-2 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm cursor-pointer text-slate-600 flex items-center justify-center`)
  - 중앙 영역: 제목 (`text-base md:text-lg font-bold text-slate-800 tracking-tight`)
  - 우측 영역: 보조 정보 또는 아이콘 영역
- **바디 영역 (Body)**:
  - 여백: `p-4 md:p-6 space-y-6 overflow-y-auto`
  - 배경: 뷰 최상단 컴포넌트는 연회색 테마(`bg-slate-50/30` 또는 `bg-transparent`)를 자연스럽게 노출시킵니다.
- **공통 푸터 (Footer)**:
  - 뷰 하단 고정 제어 영역이 필요할 때 적용합니다.
  - 클래스: `p-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0`

---

## 3. 공통 버튼 스타일 (Buttons)
모든 버튼은 `transition-all duration-200` 및 활성 상태 스케일 다운 효과(`active:scale-95`)를 가집니다.

1. **주요 버튼 (Primary)**:
   - 클래스: `px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer`
2. **보조 버튼 (Secondary)**:
   - 클래스: `px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/85 text-slate-700 font-semibold rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer`
3. **경고 / 취소 버튼 (Danger)**:
   - 클래스: `px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md shadow-rose-600/10 hover:shadow-lg active:scale-95 transition-all cursor-pointer`
4. **포인트 액센트 버튼 (Accent)**:
   - 클래스: `px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all cursor-pointer`

---

## 4. 모달 / 다이얼로그 가이드 (Modals & Dialogs)
- **오버레이**: `absolute inset-0 bg-slate-900/60 backdrop-blur-xs`
- **모달 컨테이너**: `bg-white text-slate-800 w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-100/80`
- **모달 버튼**: 본 디자인 가이드의 주요/보조/경고 버튼 공통 클래스를 상속받습니다.
