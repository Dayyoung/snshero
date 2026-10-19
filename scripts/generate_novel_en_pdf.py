import os
import re
import glob
import asyncio
from playwright.async_api import async_playwright

HTML_TEMPLATE_EN = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SNSHero: Kadan & Arcane Echoes (Part 1)</title>
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
    line-height: 1.9;
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
    font-size: 11pt;
    letter-spacing: 0.3em;
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
    font-size: 22pt;
    font-weight: 600;
    color: #6ee7b7;
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-family: 'Noto Sans KR', sans-serif;
    font-size: 12.5pt;
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
    line-height: 1.9;
    color: #e2e8f0;
    max-width: 500px;
    margin: 0 auto;
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

<!-- COVER -->
<div class="cover-page">
  <div class="cover-top">
    <span class="cover-badge">Official e-Book Edition · Full Edition</span>
    <span class="cover-volume">VOLUME 1</span>
  </div>
  <div class="cover-center">
    <div class="cover-series">SNSHero Official Web Novel Series</div>
    <div class="cover-title">SNSHero</div>
    <div class="cover-subtitle-kadan">Kadan &amp; Arcane Echoes</div>
    <div class="cover-subtitle">Part 1 · Complete Edition (Episodes 1 – 40)</div>
    <div class="cover-divider"></div>
    <p class="cover-desc">
      Born amidst the tragedy of Elwin Village on the frozen frontier of Lighthaven,<br>
      Kadan inherits the shattered shield and sacred vows of the Holy Knights—<br>
      an epic dark fantasy chronicle uniting 11 continental realms and 100 Guardians.
    </p>
  </div>
  <div class="cover-bottom">
    <div class="cover-meta">
      <strong>Created &amp; Published By</strong>
      <span>ModooSoft · SNSHero Revolution</span>
    </div>
    <div class="cover-meta" style="text-align: right;">
      <strong>Complete 40 Episodes</strong>
      <span>Official English e-Book Edition</span>
    </div>
  </div>
</div>

<!-- CHARACTERS -->
<div class="characters-page">
  <div class="section-header">
    <h2 class="section-title">Main Characters</h2>
    <span class="section-subtitle">Kadan &amp; Arcane Echoes Dramatis Personae</span>
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
    {TOC_ITEMS}
  </div>
</div>

<!-- CHAPTERS -->
{CHAPTERS_HTML}

<!-- COLOPHON -->
<div class="colophon-page">
  <div class="colophon-box">
    <div class="colophon-title">SNSHero: Kadan &amp; Arcane Echoes (Part 1)</div>
    <div class="colophon-sub">Official Complete e-Book Edition</div>
    <table class="colophon-table">
      <tr>
        <td>Title</td>
        <td>SNSHero: Kadan &amp; Arcane Echoes (Part 1)</td>
      </tr>
      <tr>
        <td>Copyright</td>
        <td>ModooSoft / SNSHero Revolution</td>
      </tr>
      <tr>
        <td>Publication Date</td>
        <td>October 2026 (Official Revised Edition)</td>
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
        <td>SNSHero Revolution Media Lounge (https://snshero.com)</td>
      </tr>
    </table>
    <div style="font-size: 8pt; color: #94a3b8; line-height: 1.6;">
      This e-Book is protected under international copyright laws. Unauthorized reproduction or distribution is prohibited.<br>
      © 2026 ModooSoft. All rights reserved.
    </div>
  </div>
</div>

</body>
</html>
"""


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
        if clean.startswith('SNSHero Novel'):
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


async def generate_en_pdf():
    files = sorted(glob.glob('public/book/image_narrations/english_txt/SNSHero_Novel_Episode_*_EN.txt'))
    toc_items = []
    chapters_html = []

    for fpath in files:
        ep_num, ep_title, paragraphs = parse_en_episode(fpath)
        toc_items.append(f"""
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

        chapter_html = f"""
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
        """
        chapters_html.append(chapter_html)

    full_html = HTML_TEMPLATE_EN.replace('{TOC_ITEMS}', '\n'.join(toc_items))
    full_html = full_html.replace('{CHAPTERS_HTML}', '\n'.join(chapters_html))

    tmp_html_path = 'public/snshero_part1_en_temp.html'
    with open(tmp_html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"Generated English HTML: {tmp_html_path}")

    output_pdf_public = 'public/snshero_part1.pdf'
    output_pdf_dist = 'dist/snshero_part1.pdf'

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        abs_html_path = os.path.abspath(tmp_html_path)
        await page.goto(f'file://{abs_html_path}', wait_until='networkidle')
        await page.evaluate("() => document.fonts.ready")

        footer_template = """
        <div style="font-size: 8.5pt; width: 100%; text-align: center; color: #94a3b8; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          — <span class="pageNumber"></span> —
        </div>
        """
        header_template = """
        <div style="font-size: 7.5pt; width: 100%; display: flex; justify-content: space-between; padding: 0 18mm; color: #cbd5e1; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          <span>SNSHero: Kadan &amp; Arcane Echoes</span>
          <span>Official Web Novel Complete Edition (Part 1)</span>
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

    with open(output_pdf_public, 'wb') as f:
        f.write(pdf_bytes)
    print(f"Saved English PDF to {output_pdf_public} ({len(pdf_bytes)} bytes)")

    if os.path.exists('dist'):
        with open(output_pdf_dist, 'wb') as f:
            f.write(pdf_bytes)
        print(f"Saved English PDF to {output_pdf_dist} ({len(pdf_bytes)} bytes)")

    if os.path.exists(tmp_html_path):
        os.remove(tmp_html_path)


if __name__ == '__main__':
    asyncio.run(generate_en_pdf())
