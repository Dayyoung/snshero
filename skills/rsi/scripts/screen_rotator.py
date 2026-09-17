#!/usr/bin/env python3
"""
screen_rotator.py
/rsi 스킬용 12대 핵심 화면 순환 트래커 및 신규 md 리포트 템플릿 생성기
"""

import os
import sys
import json
import argparse
from datetime import datetime

SCREENS = [
    {
        "id": "SCR-01",
        "name_ko": "홈 & 메인 로비",
        "name_en": "Home & Main Lobby",
        "view": "home",
        "files": ["src/views/HomeView.tsx", "src/components/MainLobbyBannerCarousel.tsx"],
        "core_goals": "첫 3분 온보딩, 직관적인 시작 버튼 동선, 한손 퓨어 터치, 공지 및 보상 인지율 극대화",
    },
    {
        "id": "SCR-02",
        "name_ko": "배틀 아레나 (3x3 보드 대전)",
        "name_en": "Battle Arena (3x3 Board)",
        "view": "play",
        "files": ["src/views/PlayGameView.tsx", "src/components/BattleMinimalTopBar.tsx", "src/lib/BattleFXEngine.ts"],
        "core_goals": "연쇄 플립 손맛, 역전 피니셔 도파민, 60fps 무지연 드래그, 승리/패배 후 리텐션 루프",
    },
    {
        "id": "SCR-03",
        "name_ko": "마이덱 & 카드 성장 (다마고치)",
        "name_en": "My Deck & Hero Care",
        "view": "mydeck",
        "files": ["src/views/MyDeckView.tsx", "src/components/CardItem.tsx"],
        "core_goals": "덱 편성 터치 편의성, 카드 돌봄/포만감/친밀도 육성 몰입감, 고가치 카드 분해 방지",
    },
    {
        "id": "SCR-04",
        "name_ko": "상점 & 카드팩 가챠",
        "name_en": "Shop & Pack Gacha",
        "view": "shop",
        "files": ["src/views/ShopView.tsx"],
        "core_goals": "팩 개봉 도파민 연출, 30회 천장(Pity) 체감, 첫 충전/스타터팩 과금 전환율 증대",
    },
    {
        "id": "SCR-05",
        "name_ko": "카드 P2P 마켓플레이스",
        "name_en": "Card P2P Marketplace",
        "view": "marketplace",
        "files": ["src/views/CardMarketplaceView.tsx"],
        "core_goals": "호가창 직관성, 자동 매수 예약(Limit Order), 100% 가스비 페이백, P2P 거래 활성화",
    },
    {
        "id": "SCR-06",
        "name_ko": "가상 주식 거래소 (지분 & 배당)",
        "name_en": "Stock Market & Dividends",
        "view": "stock",
        "files": ["src/views/StockMarketView.tsx"],
        "core_goals": "캐릭터 주식 변동률 차트, 배당금 1탭 복리 재투자, 거래 수수료 페이백 금고",
    },
    {
        "id": "SCR-07",
        "name_ko": "승부 예측 시장 (베팅 아레나)",
        "name_en": "Prediction Market",
        "view": "prediction",
        "files": ["src/views/PredictionMarketView.tsx"],
        "core_goals": "AI 배틀 및 스포츠 예측 베팅 쾌감, 원터치 베팅 UX, 실시간 정산 및 2.5배 배당금",
    },
    {
        "id": "SCR-08",
        "name_ko": "시련의 탑 & 보스 레이드",
        "name_en": "Tower of Trials & Boss Raid",
        "view": "tower",
        "files": ["src/views/PlayGameView.tsx", "src/components/BattleBossHUD.tsx"],
        "core_goals": "층별 등반 성취감, 보스 기믹 예고 텔레그래프, 단계별 한정 칭호 및 코스튬 보상",
    },
    {
        "id": "SCR-09",
        "name_ko": "미션 게임 캔버스 아레나 (Poki 110선)",
        "name_en": "Mission Game Canvas Arena",
        "view": "mission_games",
        "files": ["src/views/PlayGameView.tsx"],
        "core_goals": "모바일 원핸드 퓨어 제스처 완결성, 60fps 2D 캔버스, 승리 시 카드 획득 및 잠재력 강화",
    },
    {
        "id": "SCR-10",
        "name_ko": "소셜, 친구 친선전 & 길드",
        "name_en": "Social, Friends & Guild",
        "view": "guild",
        "files": ["src/views/GuildDetailView.tsx", "src/components/FriendBattlePanel.tsx", "src/views/CommunityView.tsx"],
        "core_goals": "비동기 친선 대전 링크, 길드전 승부 예측, 대표 카드 용병 대여, 조각 교환",
    },
    {
        "id": "SCR-11",
        "name_ko": "웹소설·웹툰 미디어 허브",
        "name_en": "Novel, Webtoon & Movie Hub",
        "view": "novel",
        "files": ["src/views/NovelView.tsx", "src/views/AnimeView.tsx", "src/views/MovieView.tsx"],
        "core_goals": "IP 세계관 몰입, 뷰어 읽기 보상 연계, 스크롤 위치 영구 복원, 완독률 증대",
    },
    {
        "id": "SCR-12",
        "name_ko": "설정, 데일리 미션 & 출석 보상 센터",
        "name_en": "Settings, Missions & Attendance",
        "view": "setting",
        "files": ["src/views/SettingView.tsx", "src/components/DailyMissions.tsx", "src/components/AttendanceStreakModal.tsx"],
        "core_goals": "에너지 번 환급 마일스톤, 7일 출석 스트릭, 저사양 60fps 최적화 모드, 음향 제어",
    },
]

STATE_FILE = "docs/screen_audits/.last_inspected"

def get_last_screen_idx():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("last_index", -1)
        except Exception:
            pass
    return -1

def set_last_screen_idx(idx):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"last_index": idx, "updated_at": datetime.now().isoformat()}, f, indent=2)

def generate_report_template(screen_data):
    scr_id = screen_data["id"]
    scr_name = screen_data["name_ko"]
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    filename = f"docs/screen_audits/{scr_id}_{screen_data['view'].upper()}.md"

    content = f"""# [{scr_id}] {scr_name} 전면 검토 및 개선 보고서

- **검토 일시**: {now_str}
- **대상 화면**: {scr_name} ({screen_data['name_en']})
- **주요 파일**: `{", ".join(screen_data['files'])}`
- **핵심 목표**: {screen_data['core_goals']}

---

## 1. 5대 핵심 지표별 분석 결과

### ① 사용자 유치 & 온보딩 (User Acquisition & FTUE)
- **현황 진단**: 
- **문제점 및 개선 기회**: 

### ② 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **현황 진단**: 
- **문제점 및 개선 기회**: 

### ③ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **현황 진단**: 
- **문제점 및 개선 기회**: 

### ④ 성능 및 반응속도 (Performance & 60fps)
- **현황 진단**: 
- **문제점 및 개선 기회**: 

### ⑤ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **현황 진단**: 
- **문제점 및 개선 기회**: 

---

## 2. 도출된 개선 작업 항목 (Action Items)

| No | 카테고리 | 부서 | 개선 과제명 | 문제점 | 구체적 해결책 | 예상 기대효과 | 구현 파일 |
|---|---|---|---|---|---|---|---|
| 1 | 재미/도파민 | 기획/개발 | | | | | |
| 2 | 모바일 UX | 디자인/개발 | | | | | |
| 3 | 과금전환/성능 | 기획/개발 | | | | | |

---

## 3. 프로덕션 소스코드 구현 내역
*(실제 변경된 소스코드 내용 요약 및 핵심 함수/컴포넌트 명시)*

---

## 4. 검증 결과
- [ ] `npm run build` 오류 0건 통과
- [ ] 100% 로컬스토리지 영구 저장 무결점 유지
- [ ] 모바일 390x844 뷰포트 레이아웃 무결점 확인
- [ ] Git 커밋 및 구글 폼 보고 완료
"""
    return filename, content

def main():
    parser = argparse.ArgumentParser(description="SNSHero Screen Rotator")
    parser.add_argument("--next", action="store_true", help="Get next screen to inspect")
    parser.add_argument("--status", action="store_true", help="Show all screens status")
    parser.add_argument("--init-doc", action="store_true", help="Generate template markdown doc for next screen")
    args = parser.parse_args()

    last_idx = get_last_screen_idx()
    next_idx = (last_idx + 1) % len(SCREENS)
    target = SCREENS[next_idx]

    if args.status:
        print(f"=== SNSHero 12대 화면 점검 현황 ===")
        for i, s in enumerate(SCREENS):
            marker = "👉 [다음]" if i == next_idx else ("✅ [완료]" if i <= last_idx else "⏳ [대기]")
            print(f"{marker} {s['id']}: {s['name_ko']} ({s['view']})")
        return

    if args.init_doc:
        filename, content = generate_report_template(target)
        if not os.path.exists(filename):
            with open(filename, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Created template report: {filename}")
        else:
            print(f"Report already exists: {filename}")
        set_last_screen_idx(next_idx)
        print(f"Target screen set to: {target['id']} ({target['name_ko']})")
        return

    # default: print next screen info
    print(json.dumps(target, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
