---
name: imp-mission
description: 3D 복셀 미션 게임을 엄격한 기준으로 심사하여 모바일 적합도/재미/보상 미달 시 즉시 폐기하고, 배틀/아케이드/퍼즐/캐주얼 등 다양한 장르의 고품질 신규 게임으로 개발·대체하여 장르 균형을 맞추고 구글 폼 보고를 수행하는 스킬
---

# /imp-mission 스킬 지침서 (3D 복셀 엄격 심사 & 신규 다장르 대체 개발)

## 개요
현재 SNSHero의 110종 미션 게임 중 3D 복셀 게임의 비율(78종)이 과도하게 높으므로, **3D 복셀 게임들에 대해 엄격한 기준을 적용하여 모바일 적합도, 조작 편의성, 재미, 보상이 미달될 경우 즉시 폐기(Decommission)**합니다.
폐기된 3D 복셀 게임은 **배틀 / 아케이드 / 퍼즐 / 캐주얼 / 2D 전략 등 다양한 장르의 고품질 신규 게임으로 새로 개발하여 대체**하고 등록합니다.

---

## 3D 복셀 엄격 심사 기준 (엄격 기준 적용)

1. **모바일 원핸드 적합도 & 뷰포트 (엄격)**:
   - 작은 모바일 화면에서 3D 카메라 앵글이 답답하거나 왜곡되지 않는가?
   - `100dvh` 내에서 불필요한 스크롤이나 오버플로우가 없는가?
   - 상단 5% 1줄 슬림 HUD(`MinimalistMissionHUD`)와의 어울림.
   - **미달 시**: 즉시 폐기 대상.

2. **터치 플레이 편의성 & 조작감 (엄격)**:
   - 복잡한 3D 가상 조이스틱 없이 직관적인 퓨어 제스처(스와이프, 드래그, 원터치 탭)로 100% 쾌적하게 조작 가능한가?
   - 터치 딜레이나 어색한 3D 물리 충돌 판정이 있는가?
   - **미달 시**: 즉시 폐기 대상.

3. **게임 재미 & 몰입도 (엄격)**:
   - 단순 반복이나 지루함 없이 직관적인 손맛, 타격감, 두뇌 퍼즐, 콤보, 스피드감이 있는가?
   - 3D 복셀의 무거운 렌더링 대비 게임성 만족도가 충분한가?
   - **미달 시**: 즉시 폐기 대상.

4. **보상 형평성 & 동기부여 (엄격)**:
   - 분당 50P 표준 정산(`calculateAndDepositMissionReward`) 및 `VictoryRewardModal` 팡파레와 잘 결합되어 있는가?

---

## 신규 대체 게임 개발 가이드라인 (배틀 / 아케이드 / 퍼즐 / 캐주얼)

3D 복셀 게임이 폐기되면, 다음 장르 중 신선하고 완성도 높은 **2D / Canvas / 반응형 인터랙티브 신규 게임**을 개발하여 대체합니다:

- **배틀 / 액션 (Battle & Action)**: 카드 스킬 결투, 보스 레이드, 패링 대전, 슈팅 탄막, 격투 콤보 등
- **아케이드 (Arcade)**: 리듬 비트, 타이밍 러너, 핀볼, 닷지, 반사신경 캐치 등
- **퍼즐 / 두뇌 (Puzzle & Brain)**: 매치3, 라인 연결, 숫자 연산, 타일 배치, 미로 탈출, 스도쿠 변형 등
- **캐주얼 / 스포츠 (Casual & Sports)**: 원터치 골프/양궁/다트, 물리 드로우, 다마고치 미니게임 등

### 신규 게임 개발 필수 규격:
1. `src/components/MinimalistMissionHUD.tsx` 1줄 슬림 HUD (최상단 5%) 탑재
2. Zero-Button 퓨어 제스처 컨트롤러 (화면 탭, 드래그, 스와이프 등)
3. `UniversalTutorialModal` 3단계 인터랙티브 온보딩 (목표, 조작법, 확정보상)
4. `VictoryRewardModal` & `calculateAndDepositMissionReward` 확정 SNS 보상 원자적 입금
5. `DESIGN.md` 준수: Monospace 폰트, 웜크림/잉크 팔레트, 플랫 1px 테두리

---

## 수행 절차

### 1단계: 점검 대상 3D 복셀 게임 선정
- `AGENTS.md`의 `imp-mission 마지막 점검 게임`을 확인하고 다음 3D 복셀 게임을 선정합니다.
- 스크립트: `python3 skills/imp-mission/scripts/mission_evaluator.py` 실행

### 2단계: 엄격 심사 및 폐기/대체 결정
- 해당 3D 복셀 게임의 코드와 모바일 적합도, 재미를 엄격 심사합니다.
- 기준 미달 시 과감히 **폐기(REPLACE / DECOMMISSION)**를 결정하고, 대체할 신규 게임 장르 및 기획을 수립합니다.

### 3단계: 신규 다장르 게임 개발 및 교체
- 폐기된 컴포넌트 파일에 신규 게임 코드를 고품질로 완벽히 구현합니다.
- `MinimalistMissionHUD`, 퓨어 제스처, `UniversalTutorialModal`, `VictoryRewardModal`을 기본 탑재합니다.

### 4단계: 빌드 검증 (`tsc --noEmit`)
- `./node_modules/.bin/tsc --noEmit`을 실행하여 0 오류(PASS)를 확인합니다.

### 5단계: Git 커밋 & 푸시
- 변경 사항을 명확한 커밋 메시지로 커밋 및 푸시합니다:
  ```bash
  git add src/components/[게임명].tsx AGENTS.md WORK_LOGS.md skills/imp-mission/
  git commit -m "feat(mission): [imp-mission] decommission voxel game and replace with new [장르] game ([게임명])"
  git push origin main
  ```

### 6단계: 영구 로그 기록 및 구글 폼 제출
- `WORK_LOGS.md`에 폐기 사유, 신규 개발 게임 내역, 4대 평가 결과를 기록합니다.
- `AGENTS.md`의 진행 상태를 갱신합니다.
- 구글 폼 보고서를 제출합니다:
  ```bash
  python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[imp-mission] 3D 복셀 폐기 및 신규 [장르] 게임([게임명]) 개발 대체 완료" --status "작업완료" --details "[폐기 사유, 신규 게임 특징, 4대 기준 평가, tsc 통과]"
  ```

### 7단계: 대화창 상세 보고
- 폐기된 복셀 게임의 문제점, 새로 개발된 게임의 장르와 게임성, 검증 결과 및 구글 폼 제출 내역을 한국어로 명확히 보고합니다.
