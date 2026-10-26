import os
import re
import glob
import asyncio
from playwright.async_api import async_playwright

COMMON_MOBILE_CSS = """
  @page {
    size: A4;
    margin: 14mm 10mm 14mm 10mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Noto Serif KR', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'AppleGothic', serif;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 18pt;
    font-weight: 500;
    line-height: 1.95;
    letter-spacing: -0.01em;
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  /* Cover Page */
  .cover-page {
    page-break-after: always;
    height: 265mm;
    max-height: 265mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 44px 34px;
    background: linear-gradient(145deg, #06281e 0%, #0d3d2c 50%, #081d16 100%);
    color: #ffffff;
    border: 2px solid #10b981;
    border-radius: 4px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .cover-top {
    border-bottom: 1.5px solid rgba(16, 185, 129, 0.45);
    padding-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cover-badge {
    display: inline-block;
    padding: 6px 14px;
    background: rgba(16, 185, 129, 0.25);
    border: 1.5px solid #10b981;
    color: #6ee7b7;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 11.5pt;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    border-radius: 3px;
  }

  .cover-volume {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12pt;
    color: #a7f3d0;
    letter-spacing: 0.1em;
    font-weight: 700;
  }

  .cover-center {
    text-align: center;
    padding: 24px 0;
  }

  .cover-series {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 14pt;
    letter-spacing: 0.28em;
    color: #a7f3d0;
    text-transform: uppercase;
    margin-bottom: 22px;
    font-weight: 700;
  }

  .cover-title {
    font-family: 'Noto Serif KR', serif;
    font-size: 40pt;
    font-weight: 700;
    line-height: 1.25;
    color: #ffffff;
    margin: 0 0 14px 0;
    letter-spacing: -0.02em;
  }

  .cover-subtitle-kadan {
    font-family: 'Noto Serif KR', serif;
    font-size: 28pt;
    font-weight: 700;
    color: #6ee7b7;
    margin-bottom: 20px;
  }

  .cover-subtitle {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 16.5pt;
    font-weight: 700;
    color: #d1fae5;
    margin: 0 0 28px 0;
    letter-spacing: 0.04em;
  }

  .cover-divider {
    width: 80px;
    height: 4px;
    background: #10b981;
    margin: 0 auto 28px auto;
    border-radius: 2px;
  }

  .cover-desc {
    font-size: 14.5pt;
    line-height: 1.9;
    color: #f1f5f9;
    max-width: 560px;
    margin: 0 auto;
    word-break: keep-all;
  }

  .cover-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1.5px solid rgba(16, 185, 129, 0.45);
    padding-top: 20px;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12pt;
    color: #cbd5e1;
  }

  .cover-meta strong {
    color: #ffffff;
    display: block;
    margin-bottom: 4px;
    font-size: 13pt;
  }

  /* Characters Page - 1 Column Large Cards for Mobile */
  .characters-page {
    page-break-before: always;
    page-break-after: always;
    padding-top: 6px;
  }

  .section-header {
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 20px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .section-title {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 22pt;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }

  .section-subtitle {
    font-size: 12.5pt;
    color: #475569;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 600;
  }

  .char-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .char-card {
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-left: 5px solid #10b981;
    padding: 14px 18px;
    border-radius: 4px;
    page-break-inside: avoid;
  }

  .char-name {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .char-role {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12.5pt;
    color: #047857;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .char-desc {
    font-size: 14pt;
    line-height: 1.75;
    color: #334155;
    margin: 0;
  }

  /* Table of Contents Page - 1 Column Large List for Mobile */
  .toc-page {
    page-break-before: always;
    page-break-after: always;
    padding-top: 6px;
  }

  .toc-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    font-size: 14.5pt;
  }

  .toc-item {
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    padding: 7px 4px;
    border-bottom: 1.5px dotted #cbd5e1;
    page-break-inside: avoid;
  }

  .toc-num {
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 800;
    color: #047857;
    margin-right: 14px;
    font-size: 14pt;
    min-width: 78px;
  }

  .toc-name {
    color: #0f172a;
    font-weight: 600;
    flex: 1;
  }

  /* Chapter content - Large Mobile Typography */
  .chapter-wrapper {
    page-break-before: always;
    padding-top: 10px;
  }

  .chapter-header {
    margin-bottom: 26px;
    padding-bottom: 14px;
    border-bottom: 2px solid #059669;
  }

  .chapter-badge {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12.5pt;
    font-weight: 800;
    color: #059669;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .chapter-title {
    font-family: 'Noto Serif KR', serif;
    font-size: 24pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 12px 0;
    line-height: 1.35;
  }

  .chapter-meta {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12pt;
    color: #475569;
    display: flex;
    gap: 12px;
  }

  .chapter-range {
    background: #ecfdf5;
    color: #047857;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 700;
  }

  .chapter-body p {
    margin: 0 0 1.25em 0;
    text-align: left;
    line-height: 1.95;
  }

  .chapter-body p.dialogue {
    padding-left: 12px;
    border-left: 3.5px solid #10b981;
    color: #0f172a;
    font-weight: 600;
  }

  /* Colophon Page */
  .colophon-page {
    page-break-before: always;
    height: 265mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .colophon-box {
    border: 1.5px solid #cbd5e1;
    padding: 40px 36px;
    width: 100%;
    max-width: 580px;
    background: #f8fafc;
    border-radius: 6px;
  }

  .colophon-title {
    font-size: 18pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 8px;
  }

  .colophon-sub {
    font-size: 13pt;
    color: #475569;
    margin-bottom: 24px;
    font-weight: 600;
  }

  .colophon-table {
    width: 100%;
    font-size: 13pt;
    color: #334155;
    text-align: left;
    margin-bottom: 24px;
    border-collapse: collapse;
  }

  .colophon-table td {
    padding: 10px 6px;
    border-bottom: 1px solid #cbd5e1;
  }

  .colophon-table td:first-child {
    font-weight: 700;
    color: #0f172a;
    width: 34%;
  }
"""

HTML_TEMPLATE_KO_MOBILE = f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>눈히어로.com - 카단의 여정 (Part 1 · 모바일 큰글자판)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
{COMMON_MOBILE_CSS}
</style>
</head>
<body>

<!-- 표지 (COVER) -->
<div class="cover-page">
  <div class="cover-top">
    <span class="cover-badge">MOBILE LARGE-PRINT EDITION · 모바일 큰글자판</span>
    <span class="cover-volume">VOLUME 1</span>
  </div>
  <div class="cover-center">
    <div class="cover-series">눈히어로.com Official Web Novel Series</div>
    <div class="cover-title">눈히어로.com</div>
    <div class="cover-subtitle-kadan">카단의 여정</div>
    <div class="cover-subtitle">Part 1 · 제 1화 ~ 제 40화 완결본 (모바일 큰글자판)</div>
    <div class="cover-divider"></div>
    <p class="cover-desc">
      라이트헤븐 제국의 변경 엘윈 마을의 비극 속에서 태어난 카단.<br>
      성기사단의 부서진 방패와 아케인의 서약을 이어받아<br>
      대륙 11대 종족과 100인의 가디언을 아우르는 대서사시.<br>
      (스마트폰 화면에서 확대 없이 편안하게 읽을 수 있는 모바일 큰글자 전용 에디션)
    </p>
  </div>
  <div class="cover-bottom">
    <div class="cover-meta">
      <strong>기획 / 제작</strong>
      <span>ModooSoft · SNSHero Revolution</span>
    </div>
    <div class="cover-meta" style="text-align: right;">
      <strong>총 40화 수록</strong>
      <span>모바일 큰글자 공식 e-Book</span>
    </div>
  </div>
</div>

<!-- 주요 인물 소개 (CHARACTERS) -->
<div class="characters-page">
  <div class="section-header">
    <h2 class="section-title">주요 등장인물 (Characters)</h2>
    <span class="section-subtitle">눈히어로.com - 카단의 여정 인물 열전</span>
  </div>
  <div class="char-grid">
    <div class="char-card">
      <div class="char-name">카단 (Kadan)</div>
      <div class="char-role">성기사단의 마지막 방패 · 아케인의 계승자</div>
      <p class="char-desc">알렉산다르의 아들. 힘이란 남을 누르기 위함이 아니라 약한 이를 감싸는 방패라는 가르침을 품고, 불굴의 의지로 대륙의 진실을 향해 전진한다.</p>
    </div>
    <div class="char-card">
      <div class="char-name">실리아 (Celia)</div>
      <div class="char-role">도성 라이트헤븐의 정보원 · 바람의 안내자</div>
      <p class="char-desc">거리의 부랑아로 자랐으나 누구보다 예리한 눈과 기지를 지닌 소녀. 카단과 동맹을 맺고 궁정의 음모와 비밀 통로를 열어젖힌다.</p>
    </div>
    <div class="char-card">
      <div class="char-name">이그니스 (Ignis)</div>
      <div class="char-role">백색 화염의 황자 · 불꽃의 구도자</div>
      <p class="char-desc">발리안의 아들이었으나 섭정 아르투스의 손에 황자로 길러졌다. 손끝에서 타오르는 백색 불꽃의 정체와 진짜 혈통을 찾아 카단과 운명적으로 맞닥뜨린다.</p>
    </div>
    <div class="char-card">
      <div class="char-name">알렉산다르 (Aleksandar)</div>
      <div class="char-role">쌍검의 수호자 · 카단의 아버지</div>
      <p class="char-desc">몰락한 성기사단의 영웅. 엘윈 마을의 주민들과 임신한 아내를 지키기 위해 홀로 다리 위에서 부서진 검을 쥐고 마지막까지 물러서지 않았다.</p>
    </div>
    <div class="char-card">
      <div class="char-name">발리안 (Balian)</div>
      <div class="char-role">아케인 창술의 달인 · 이그니스의 아버지</div>
      <p class="char-desc">알렉산다르와 피를 나눈 맹우. 붉은 유리 궁정의 기병들에 맞서 아내를 지키려다 절벽 아래 급류로 떨어지며 긴 방랑의 세월을 시작한다.</p>
    </div>
    <div class="char-card">
      <div class="char-name">헤르쿨 (Hercul)</div>
      <div class="char-role">황금 방호진의 순례자 · 성기사</div>
      <p class="char-desc">궁정의 배신자 명단을 쫓아 두 아이에게 은빛 단검을 건넨 원로 성기사. 진실 앞에서 고개를 숙이지 말라는 맹세를 전했다.</p>
    </div>
    <div class="char-card">
      <div class="char-name">데스나이트 아르투스 (Artus)</div>
      <div class="char-role">붉은 유리 궁정의 섭정 · 칠흑의 군주</div>
      <p class="char-desc">섀도우렐름과 내통하여 왕국을 손아귀에 쥐고 금지된 흑마법으로 가디언들의 봉인을 깨뜨리려는 음모의 설계자.</p>
    </div>
    <div class="char-card">
      <div class="char-name">엘윈 (Elwin)</div>
      <div class="char-role">카단의 어머니 · 불굴의 상징</div>
      <p class="char-desc">남편의 희생 속에서 살아남아 와일드랜드의 눈보라를 뚫고 카단을 바르고 강직하게 키워낸 위대한 어머니.</p>
    </div>
  </div>
</div>

<!-- 목차 (TABLE OF CONTENTS) -->
<div class="toc-page">
  <div class="section-header">
    <h2 class="section-title">목차 (Table of Contents)</h2>
    <span class="section-subtitle">Part 1 전 40화 수록 목록</span>
  </div>
  <div class="toc-grid">
    {{TOC_ITEMS}}
  </div>
</div>

<!-- 본문 에피소드들 -->
{{CHAPTERS_HTML}}

<!-- 판권지 (COLOPHON) -->
<div class="colophon-page">
  <div class="colophon-box">
    <div class="colophon-title">눈히어로.com - 카단의 여정 (Part 1)</div>
    <div class="colophon-sub">모바일 큰글자 공식 전자책 완결본 (Mobile Large-Print e-Book)</div>
    <table class="colophon-table">
      <tr>
        <td>도서명</td>
        <td>눈히어로.com - 카단의 여정 (Part 1 · 모바일 큰글자판)</td>
      </tr>
      <tr>
        <td>저작권자</td>
        <td>ModooSoft / 눈히어로.com</td>
      </tr>
      <tr>
        <td>발행일</td>
        <td>2026년 10월 (모바일 큰글자 개정판)</td>
      </tr>
      <tr>
        <td>장르</td>
        <td>정통 판타지 대서사시 웹소설</td>
      </tr>
      <tr>
        <td>수록 분량</td>
        <td>제 1화 ~ 제 40화 (완결)</td>
      </tr>
      <tr>
        <td>발행처</td>
        <td>눈히어로.com 미디어 라운지 (https://snshero.com)</td>
      </tr>
    </table>
    <div style="font-size: 11pt; color: #64748b; line-height: 1.7;">
      이 전자책은 저작권법에 의해 보호를 받는 저작물이므로 무단 전재와 복제를 금합니다.<br>
      © 2026 ModooSoft. All rights reserved.
    </div>
  </div>
</div>

</body>
</html>
"""

HTML_TEMPLATE_EN_MOBILE = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SNSHero.com - Kadan's Journey (Part 1 · Mobile Large-Print Edition)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
{COMMON_MOBILE_CSS}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover-page">
  <div class="cover-top">
    <span class="cover-badge">MOBILE LARGE-PRINT EDITION · FULL EDITION</span>
    <span class="cover-volume">VOLUME 1</span>
  </div>
  <div class="cover-center">
    <div class="cover-series">SNSHero.com Official Web Novel Series</div>
    <div class="cover-title">SNSHero.com</div>
    <div class="cover-subtitle-kadan">Kadan's Journey</div>
    <div class="cover-subtitle">Part 1 · Complete Edition (Episodes 1 – 40 · Mobile Large-Print)</div>
    <div class="cover-divider"></div>
    <p class="cover-desc">
      Born amidst the tragedy of Elwin Village on the frozen frontier of Lighthaven,<br>
      Kadan inherits the shattered shield and sacred vows of the Holy Knights—<br>
      an epic dark fantasy chronicle uniting 11 continental realms and 100 Guardians.<br>
      (Specially typeset with 18pt large print for effortless reading on mobile screens)
    </p>
  </div>
  <div class="cover-bottom">
    <div class="cover-meta">
      <strong>Created &amp; Published By</strong>
      <span>ModooSoft · SNSHero Revolution</span>
    </div>
    <div class="cover-meta" style="text-align: right;">
      <strong>Complete 40 Episodes</strong>
      <span>Mobile Large-Print English e-Book</span>
    </div>
  </div>
</div>

<!-- CHARACTERS -->
<div class="characters-page">
  <div class="section-header">
    <h2 class="section-title">Main Characters</h2>
    <span class="section-subtitle">SNSHero.com - Kadan's Journey Dramatis Personae</span>
  </div>
  <div class="char-grid">
    <div class="char-card">
      <div class="char-name">Kadan</div>
      <div class="char-role">The Last Shield of the Holy Knights · Heir of Arcane</div>
      <p class="char-desc">Son of Aleksandar. Guided by the creed that true strength is a shield raised to protect the weak rather than a blade to dominate, he marches forward to uncover the truth of the continent.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Celia</div>
      <div class="char-role">Informant of Lighthaven · Guide of the Wind</div>
      <p class="char-desc">Raised on the backstreets of the capital yet blessed with peerless wit and perception, she forges a fateful alliance with Kadan to unlock the secret passages of the royal court.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Ignis</div>
      <div class="char-role">Prince of White Flame · Seeker of the Ember</div>
      <p class="char-desc">Son of Balian, raised as an imperial prince in the Red Glass Court. Drawn by the mystery of the white flames at his fingertips and his true bloodline, his path collides with Kadan's.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Aleksandar</div>
      <div class="char-role">Guardian of Twin Blades · Father of Kadan</div>
      <p class="char-desc">A fallen hero of the Holy Knights who stood alone atop the wooden bridge of Elwin with shattered steel until his final breath to save the villagers and his pregnant wife.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Balian</div>
      <div class="char-role">Master of the Arcane Spear · Father of Ignis</div>
      <p class="char-desc">Sworn blood-brother to Aleksandar. Plunging into the mist-shrouded gorge while drawing the imperial cavalry away from his wife Ysela, he began a long, perilous exile.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Hercul</div>
      <div class="char-role">Pilgrim of the Golden Aegis · Elder Paladin</div>
      <p class="char-desc">The veteran paladin who pursued the covenant of court traitors and entrusted the twin silver rune-daggers to the two unborn children as a testament of truth.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Death Knight Artus</div>
      <div class="char-role">Regent of the Red Glass Court · Lord of Obsidian</div>
      <p class="char-desc">The mastermind who conspired with the Shadow Realm to seize the kingdom and unseal forbidden dark magic across the ancient sanctums.</p>
    </div>
    <div class="char-card">
      <div class="char-name">Elwin</div>
      <div class="char-role">Mother of Kadan · Beacon of Endurance</div>
      <p class="char-desc">Surviving her husband's sacrifice, she braved the blizzards of the northern wastes to raise Kadan with unwavering integrity and honor.</p>
    </div>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc-page">
  <div class="section-header">
    <h2 class="section-title">Table of Contents</h2>
    <span class="section-subtitle">Part 1 · Complete 40 Episodes</span>
  </div>
  <div class="toc-grid">
    {{TOC_ITEMS}}
  </div>
</div>

<!-- CHAPTERS -->
{{CHAPTERS_HTML}}

<!-- COLOPHON -->
<div class="colophon-page">
  <div class="colophon-box">
    <div class="colophon-title">SNSHero.com - Kadan's Journey (Part 1)</div>
    <div class="colophon-sub">Mobile Large-Print Official Complete e-Book Edition</div>
    <table class="colophon-table">
      <tr>
        <td>Title</td>
        <td>SNSHero.com - Kadan's Journey (Part 1 · Mobile Large-Print)</td>
      </tr>
      <tr>
        <td>Copyright</td>
        <td>ModooSoft / SNSHero.com</td>
      </tr>
      <tr>
        <td>Publication Date</td>
        <td>October 2026 (Mobile Large-Print Edition)</td>
      </tr>
      <tr>
        <td>Genre</td>
        <td>Epic Dark Fantasy Web Novel</td>
      </tr>
      <tr>
        <td>Contents</td>
        <td>Episode 1 – Episode 40 (Complete)</td>
      </tr>
      <tr>
        <td>Publisher</td>
        <td>SNSHero.com Media Lounge (https://snshero.com)</td>
      </tr>
    </table>
    <div style="font-size: 11pt; color: #64748b; line-height: 1.7;">
      This e-Book is protected under international copyright laws. Unauthorized reproduction or distribution is prohibited.<br>
      © 2026 ModooSoft. All rights reserved.
    </div>
  </div>
</div>

</body>
</html>
"""


def parse_ko_episode(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    title = ""
    range_text = ""
    body_paragraphs = []

    for line in lines:
        s = line.strip()
        if not s:
            continue
        if s.startswith('#'):
            title = s.lstrip('#').strip()
        elif s.startswith('>') or '원문 범위' in s:
            range_text = s.lstrip('>').strip()
        else:
            body_paragraphs.append(s)

    m = re.search(r'(\d+)화\s*[-:—]?\s*(.*)', title)
    if m:
        ep_num = int(m.group(1))
        ep_title = m.group(2).strip()
    else:
        ep_num = 1
        ep_title = title

    return ep_num, ep_title, range_text, body_paragraphs


def parse_en_episode(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    m_file = re.search(r'Episode_(\d+)_', os.path.basename(file_path))
    ep_num = int(m_file.group(1)) if m_file else 1

    raw_blocks = re.split(r'\n\s*\n', content)
    ep_title = f"Episode {ep_num}"
    body_paragraphs = []

    for block in raw_blocks:
        clean = block.replace('\r', '').strip()
        if not clean:
            continue
        if clean.startswith('SNSHero'):
            lines = [l.strip() for l in clean.split('\n') if l.strip()]
            for l in lines:
                if l.startswith('Episode '):
                    m_t = re.match(r'Episode\s+\d+\s*:\s*(.*)', l)
                    if m_t:
                        ep_title = m_t.group(1).strip()
            continue
        if clean.startswith('Episode '):
            m_t = re.match(r'Episode\s+\d+\s*:\s*(.*)', clean.split('\n')[0])
            if m_t:
                ep_title = m_t.group(1).strip()
            rest = '\n'.join(clean.split('\n')[1:]).strip()
            if not rest:
                continue
            clean = rest

        clean = re.sub(r'\(\d{3}\.png\)', '', clean)
        clean = re.sub(r'\[([^\]]+)\]', r'\1', clean)
        clean = re.sub(r'\s+', ' ', clean).strip()
        if clean:
            body_paragraphs.append(clean)

    return ep_num, ep_title, body_paragraphs


async def render_html_to_pdf(browser, html_str, tmp_html_path, out_public, out_dist, header_left_text, header_right_text):
    with open(tmp_html_path, 'w', encoding='utf-8') as f:
        f.write(html_str)

    page = await browser.new_page()
    abs_html_path = os.path.abspath(tmp_html_path)
    await page.goto(f'file://{abs_html_path}', wait_until='networkidle')
    await page.evaluate("() => document.fonts.ready")

    footer_template = """
    <div style="font-size: 10pt; font-weight: 600; width: 100%; text-align: center; color: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
      — <span class="pageNumber"></span> —
    </div>
    """
    header_template = f"""
    <div style="font-size: 9pt; width: 100%; display: flex; justify-content: space-between; padding: 0 10mm; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
      <span>{header_left_text}</span>
      <span>{header_right_text}</span>
    </div>
    """

    pdf_bytes = await page.pdf(
        format='A4',
        margin={
            'top': '14mm',
            'bottom': '14mm',
            'left': '10mm',
            'right': '10mm'
        },
        display_header_footer=True,
        header_template=header_template,
        footer_template=footer_template,
        print_background=True
    )
    await page.close()

    with open(out_public, 'wb') as f:
        f.write(pdf_bytes)
    print(f"Saved Mobile PDF to {out_public} ({len(pdf_bytes):,} bytes)")

    if os.path.exists('dist'):
        with open(out_dist, 'wb') as f:
            f.write(pdf_bytes)
        print(f"Saved Mobile PDF to {out_dist} ({len(pdf_bytes):,} bytes)")

    if os.path.exists(tmp_html_path):
        os.remove(tmp_html_path)


async def main():
    # 1. Build Korean Mobile HTML
    ko_files = sorted(glob.glob('public/book/episode_*.md'))
    ko_toc = []
    ko_chapters = []
    for fpath in ko_files:
        ep_num, ep_title, range_text, paragraphs = parse_ko_episode(fpath)
        ko_toc.append(f"""
        <div class="toc-item">
          <span class="toc-num">제 {ep_num:02d}화</span>
          <span class="toc-name">{ep_title}</span>
        </div>
        """)
        p_tags = []
        for p in paragraphs:
            is_dialogue = p.startswith('“') or p.startswith('"') or p.startswith('「')
            cls = ' class="dialogue"' if is_dialogue else ''
            p_tags.append(f'<p{cls}>{p}</p>')
        ko_chapters.append(f"""
        <div class="chapter-wrapper">
          <div class="chapter-header">
            <div class="chapter-badge">Chapter {ep_num:02d}</div>
            <h2 class="chapter-title">제 {ep_num}화 · {ep_title}</h2>
            <div class="chapter-meta">
              <span class="chapter-range">{range_text}</span>
            </div>
          </div>
          <div class="chapter-body">
            {''.join(p_tags)}
          </div>
        </div>
        """)
    ko_html = HTML_TEMPLATE_KO_MOBILE.replace('{TOC_ITEMS}', '\n'.join(ko_toc)).replace('{CHAPTERS_HTML}', '\n'.join(ko_chapters))

    # 2. Build English Mobile HTML
    en_files = sorted(glob.glob('public/book/image_narrations/english_txt/SNSHero_Novel_Episode_*_EN.txt'))
    en_toc = []
    en_chapters = []
    for fpath in en_files:
        ep_num, ep_title, paragraphs = parse_en_episode(fpath)
        en_toc.append(f"""
        <div class="toc-item">
          <span class="toc-num">Ep. {ep_num:02d}</span>
          <span class="toc-name">{ep_title}</span>
        </div>
        """)
        p_tags = []
        for p in paragraphs:
            is_dialogue = p.startswith('“') or p.startswith('"')
            cls = ' class="dialogue"' if is_dialogue else ''
            p_tags.append(f'<p{cls}>{p}</p>')
        en_chapters.append(f"""
        <div class="chapter-wrapper">
          <div class="chapter-header">
            <div class="chapter-badge">Chapter {ep_num:02d}</div>
            <h2 class="chapter-title">Episode {ep_num} · {ep_title}</h2>
            <div class="chapter-meta">
              <span class="chapter-range">Part 1 · Episode {ep_num:02d} of 40</span>
            </div>
          </div>
          <div class="chapter-body">
            {''.join(p_tags)}
          </div>
        </div>
        """)
    en_html = HTML_TEMPLATE_EN_MOBILE.replace('{TOC_ITEMS}', '\n'.join(en_toc)).replace('{CHAPTERS_HTML}', '\n'.join(en_chapters))

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        await render_html_to_pdf(
            browser,
            ko_html,
            'public/snshero_part1_ko_mobile_temp.html',
            'public/snshero_part1_ko_mobile.pdf',
            'dist/snshero_part1_ko_mobile.pdf',
            '눈히어로.com - 카단의 여정',
            '모바일 큰글자판 (Part 1)'
        )
        await render_html_to_pdf(
            browser,
            en_html,
            'public/snshero_part1_en_mobile_temp.html',
            'public/snshero_part1_mobile.pdf',
            'dist/snshero_part1_mobile.pdf',
            "SNSHero.com - Kadan's Journey",
            'Mobile Large-Print Edition (Part 1)'
        )
        await browser.close()


if __name__ == '__main__':
    asyncio.run(main())
