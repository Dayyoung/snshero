# 프로젝트 지침 (SNSHero Revolution)

## 1. 커밋 및 푸시 정책
- 파일이 변경될 때마다 로컬 git 커밋(`git commit`)만 즉시 수행합니다.
- **원격 저장소 푸시(`git push`)는 절대 자동으로 실행하지 않습니다.**
- 오직 사용자가 `/git-push` 명령을 입력하거나 명시적으로 푸시를 요청할 때만 `git push`를 실행합니다.
- 커밋 메시지는 변경 사항을 명확하게 설명해야 합니다.

## 2. 디자인 지침 및 화면 미니멀리즘 원칙 (Progressive Disclosure)
- UI의 일관성과 사용자 경험을 최우선으로 고려합니다.
- **첫 화면 단순화 & 버튼 과밀 원천 방지**: 기능 추가 시 첫 화면에 무분별하게 버튼을 평면 나열하지 않습니다.
- **상위/하위 계층화 및 팝업 허브화**: 첫 화면은 3~4개의 핵심 상위 카테고리만 단순하게 표시하고, 세부 기능은 아코디언 메뉴 또는 팝업(모달 허브)으로 구성하여 짜임새 있는 UX를 유지합니다.
- OpenCode.ai Monospace 서체, 웜크림/잉크 팔레트, 1px hairline 보더, 0px/4px 모서리 반경의 플랫 디자인을 100% 준수합니다.

## 3. 다국어 지원 (i18n)
- 신규 텍스트 추가 또는 기존 텍스트 수정 시, 아래 12개 언어팩을 모두 업데이트해야 합니다:
  - 한국어 (`ko`)
  - 영어 (`en`/`gb`)
  - 일본어 (`ja`)
  - 중국어 간체 (`zh-CN`)
  - 중국어 번체 (`zh-TW`)
  - 독일어 (`de`)
  - 스페인어 (`es`)
  - 프랑스어 (`fr`)
  - 인도네시아어 (`id`)
  - 러시아어 (`ru`)
  - 태국어 (`th`)
  - 베트남어 (`vi`)
- 번역은 문맥에 맞게 정확하게 수행되어야 합니다.

## 4. 데이터 저장소 정책 (LocalStorage Only)
- 모든 변경, 수정, 삭제, 추가되는 게임 데이터(카드 인벤토리, 덱, 재화, 스탯, 아이템, 강화 레벨 등)는 100% 로컬스토리지(LocalStorage) 기반으로 동작 및 영구 보존됩니다.
- 클라우드 인증이나 네트워크 변경으로 인해 로컬스토리지 데이터가 초기화되거나 유실되지 않도록 보장합니다.

## 5. 모든 작업 완료 시 구글 폼 보고서 제출 의무화 (Mandatory Google Form Report)
- 에이전트가 수행하는 **어떠한 작업이든(기능 개발, 버그 수정, 설정 변경, 성능 개선 등) 작업이 완료되면 예외 없이 반드시 연동된 구글 폼을 통해 작업 완료 보고서를 즉시 제출**해야 합니다.
- **제출 구글 폼**: `https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse`
- **반영 구글 시트**: `1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8` (`/modoo` 화면과 실시간 연동)
- **실행 명령**:
  ```bash
  python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[작업명]" --status "작업완료" --details "[작업 상세 내용 및 검증 결과]"
  ```

## 6. AI Studio 및 웹 샌드박스 환경 import-analysis 오류 방지 절대 원칙
- **디렉토리 직접 import 금지**: `from './lib/webMcp'`와 같이 폴더명만으로 import하지 마십시오. 반드시 `src/lib/webMcp.ts`와 같이 루트 단일 진입점 파일을 두고 import하거나, `from './lib/webMcp/index'`처럼 명확한 파일 경로를 지정하십시오.
- **App.tsx 정적 import SPOF 방지**: `App.tsx` 최상단에 신규 모듈/뷰를 추가할 때 파일 누락으로 앱 전체가 Fatal Error(`Failed to resolve import`)로 다운되지 않도록 `safeLazy(loadViewSafely('ViewName'), 'ViewName')` 또는 안전한 fallback 래퍼를 사용하십시오.


