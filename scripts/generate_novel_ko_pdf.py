import os
import re
import glob
import asyncio
from playwright.async_api import async_playwright

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>SNSHero: 카단 & 아케인 에코즈 (Part 1)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
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
    color: #24292f;
    background-color: #ffffff;
    font-size: 10.5pt;
    line-height: 1.85;
    letter-spacing: -0.01em;
    word-break: keep-all;
    overflow-wrap: break-word;
  }

  /* Cover Page */
  .cover-page {
    page-break-after: always;
    height: 250mm;
    max-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 32px;
    background: linear-gradient(145deg, #06281e 0%, #0d3d2c 50%, #081d16 100%);
    color: #ffffff;
    border: 1.5px solid #10b981;
    border-radius: 4px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .cover-top {
    border-bottom: 1px solid rgba(16, 185, 129, 0.4);
    padding-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cover-badge {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid #10b981;
    color: #34d399;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    border-radius: 2px;
  }

  .cover-volume {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 8.5pt;
    color: #a7f3d0;
    letter-spacing: 0.1em;
    font-weight: 500;
  }

  .cover-center {
    text-align: center;
    padding: 20px 0;
  }

  .cover-series {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12pt;
    letter-spacing: 0.35em;
    color: #a7f3d0;
    text-transform: uppercase;
    margin-bottom: 18px;
    font-weight: 600;
  }

  .cover-title {
    font-family: 'Noto Serif KR', serif;
    font-size: 32pt;
    font-weight: 700;
    line-height: 1.25;
    color: #ffffff;
    margin: 0 0 10px 0;
    letter-spacing: -0.02em;
  }

  .cover-subtitle-kadan {
    font-family: 'Noto Serif KR', serif;
    font-size: 23pt;
    font-weight: 600;
    color: #6ee7b7;
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 13pt;
    font-weight: 500;
    color: #d1fae5;
    margin: 0 0 24px 0;
    letter-spacing: 0.05em;
  }

  .cover-divider {
    width: 60px;
    height: 3px;
    background: #10b981;
    margin: 0 auto 24px auto;
    border-radius: 2px;
  }

  .cover-desc {
    font-size: 10pt;
    line-height: 1.85;
    color: #e2e8f0;
    max-width: 490px;
    margin: 0 auto;
    word-break: keep-all;
  }

  .cover-bottom {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid rgba(16, 185, 129, 0.4);
    padding-top: 18px;
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 9pt;
    color: #94a3b8;
  }

  .cover-meta strong {
    color: #f1f5f9;
    display: block;
    margin-bottom: 4px;
    font-size: 9.5pt;
  }

  /* Characters Page */
  .characters-page {
    page-break-before: always;
    page-break-after: always;
    padding-top: 10px;
  }

  .section-header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 22px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }

  .section-title {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 16pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .section-subtitle {
    font-size: 9pt;
    color: #64748b;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .char-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .char-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #10b981;
    padding: 12px 14px;
    border-radius: 4px;
  }

  .char-name {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .char-role {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 8.5pt;
    color: #059669;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .char-desc {
    font-size: 9pt;
    line-height: 1.6;
    color: #475569;
    margin: 0;
  }

  /* Table of Contents Page */
  .toc-page {
    page-break-before: always;
    page-break-after: always;
    padding-top: 10px;
  }

  .toc-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    font-size: 9pt;
  }

  .toc-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 4px 0;
    border-bottom: 1px dotted #e2e8f0;
  }

  .toc-num {
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 700;
    color: #059669;
    margin-right: 8px;
    font-size: 8.5pt;
    min-width: 48px;
  }

  .toc-name {
    color: #334155;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Chapter content */
  .chapter-wrapper {
    page-break-before: always;
    padding-top: 14px;
  }

  .chapter-header {
    margin-bottom: 22px;
    padding-bottom: 12px;
    border-bottom: 1.5px solid #059669;
  }

  .chapter-badge {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 8.5pt;
    font-weight: 700;
    color: #059669;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .chapter-title {
    font-family: 'Noto Serif KR', serif;
    font-size: 16.5pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 10px 0;
    line-height: 1.35;
  }

  .chapter-meta {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 8.5pt;
    color: #64748b;
    display: flex;
    gap: 12px;
  }

  .chapter-range {
    background: #ecfdf5;
    color: #047857;
    padding: 2px 8px;
    border-radius: 3px;
    font-weight: 500;
  }

  .chapter-body p {
    margin: 0 0 1.15em 0;
    text-align: justify;
    line-height: 1.9;
  }

  .chapter-body p.dialogue {
    padding-left: 0.4em;
    color: #1e293b;
    font-weight: 500;
  }

  /* Colophon Page */
  .colophon-page {
    page-break-before: always;
    height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-family: 'Noto Sans KR', sans-serif;
  }

  .colophon-box {
    border: 1px solid #cbd5e1;
    padding: 36px 40px;
    max-width: 500px;
    background: #f8fafc;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .colophon-title {
    font-size: 13pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 6px;
  }

  .colophon-sub {
    font-size: 9pt;
    color: #64748b;
    margin-bottom: 20px;
  }

  .colophon-table {
    width: 100%;
    font-size: 8.5pt;
    color: #475569;
    text-align: left;
    margin-bottom: 22px;
    border-collapse: collapse;
  }

  .colophon-table td {
    padding: 7px 4px;
    border-bottom: 1px solid #e2e8f0;
  }

  .colophon-table td:first-child {
    font-weight: 600;
    color: #334155;
    width: 30%;
  }
</style>
</head>
<body>

<!-- 표지 (COVER) -->
<div class="cover-page">
  <div class="cover-top">
    <span class="cover-badge">Official e-Book Edition · Full Edition</span>
    <span class="cover-volume">VOLUME 1</span>
  </div>
  <div class="cover-center">
    <div class="cover-series">SNSHero Official Web Novel Series</div>
    <div class="cover-title">SNS히어로</div>
    <div class="cover-subtitle-kadan">카단 & 아케인 에코즈</div>
    <div class="cover-subtitle">Part 1 · 제 1화 ~ 제 40화 완결본</div>
    <div class="cover-divider"></div>
    <p class="cover-desc">
      라이트헤븐 제국의 변경 엘윈 마을의 비극 속에서 태어난 카단.<br>
      성기사단의 부서진 방패와 아케인의 서약을 이어받아<br>
      대륙 11대 종족과 100인의 가디언을 아우르는 대서사시.
    </p>
  </div>
  <div class="cover-bottom">
    <div class="cover-meta">
      <strong>기획 / 제작</strong>
      <span>ModooSoft · SNSHero Revolution</span>
    </div>
    <div class="cover-meta" style="text-align: right;">
      <strong>총 40화 수록</strong>
      <span>공식 한글 e-Book 완결판</span>
    </div>
  </div>
</div>

<!-- 주요 인물 소개 (CHARACTERS) -->
<div class="characters-page">
  <div class="section-header">
    <h2 class="section-title">주요 등장인물 (Characters)</h2>
    <span class="section-subtitle">카단 & 아케인 에코즈 인물 열전</span>
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
    {TOC_ITEMS}
  </div>
</div>

<!-- 본문 에피소드들 -->
{CHAPTERS_HTML}

<!-- 판권지 (COLOPHON) -->
<div class="colophon-page">
  <div class="colophon-box">
    <div class="colophon-title">SNS히어로: 카단 & 아케인 에코즈 (Part 1)</div>
    <div class="colophon-sub">공식 전자책 완결본 (Official e-Book)</div>
    <table class="colophon-table">
      <tr>
        <td>도서명</td>
        <td>SNS히어로: 카단 & 아케인 에코즈 (Part 1)</td>
      </tr>
      <tr>
        <td>저작권자</td>
        <td>ModooSoft / SNSHero Revolution</td>
      </tr>
      <tr>
        <td>발행일</td>
        <td>2026년 10월 (공식 개정판)</td>
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
        <td>SNSHero Revolution Media Lounge</td>
      </tr>
    </table>
    <div style="font-size: 8pt; color: #94a3b8; line-height: 1.6;">
      이 전자책은 저작권법에 의해 보호를 받는 저작물이므로 무단 전재와 복제를 금합니다.<br>
      © 2026 ModooSoft. All rights reserved.
    </div>
  </div>
</div>

</body>
</html>
"""

def parse_episode(file_path):
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

async def generate_pdf():
    files = sorted(glob.glob('public/book/episode_*.md'))
    episodes = []
    toc_items = []
    chapters_html = []

    for fpath in files:
        ep_num, ep_title, range_text, paragraphs = parse_episode(fpath)
        episodes.append((ep_num, ep_title, range_text, paragraphs))
        
        toc_items.append(f"""
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

        chapter_html = f"""
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
        """
        chapters_html.append(chapter_html)

    full_html = HTML_TEMPLATE.replace('{TOC_ITEMS}', '\n'.join(toc_items))
    full_html = full_html.replace('{CHAPTERS_HTML}', '\n'.join(chapters_html))

    tmp_html_path = 'public/snshero_part1_ko_temp.html'
    with open(tmp_html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Generated HTML: {tmp_html_path}")

    output_pdf_public = 'public/snshero_part1_ko.pdf'
    output_pdf_dist = 'dist/snshero_part1_ko.pdf'

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        abs_html_path = os.path.abspath(tmp_html_path)
        await page.goto(f'file://{abs_html_path}', wait_until='networkidle')
        await page.evaluate("() => document.fonts.ready")
        
        footer_template = """
        <div style="font-size: 8.5pt; width: 100%; text-align: center; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
          — <span class="pageNumber"></span> —
        </div>
        """
        header_template = """
        <div style="font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; padding: 0 18mm; color: #cbd5e1; font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;">
          <span>SNSHero: Kadan & Arcane Echoes</span>
          <span>공식 웹소설 완결본 (Part 1)</span>
        </div>
        """

        pdf_bytes = await page.pdf(
            format='A4',
            margin={
                'top': '20mm',
                'bottom': '20mm',
                'left': '18mm',
                'right': '18mm'
            },
            display_header_footer=True,
            header_template=header_template,
            footer_template=footer_template,
            print_background=True
        )
        await browser.close()

    # Save to public
    with open(output_pdf_public, 'wb') as f:
        f.write(pdf_bytes)
    print(f"Saved PDF to {output_pdf_public} ({len(pdf_bytes)} bytes)")

    # Save to dist if exists
    if os.path.exists('dist'):
        with open(output_pdf_dist, 'wb') as f:
            f.write(pdf_bytes)
        print(f"Saved PDF to {output_pdf_dist} ({len(pdf_bytes)} bytes)")

    # Clean up temp html
    if os.path.exists(tmp_html_path):
        os.remove(tmp_html_path)

if __name__ == '__main__':
    asyncio.run(generate_pdf())
