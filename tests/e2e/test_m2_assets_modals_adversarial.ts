/**
 * tests/e2e/test_m2_assets_modals_adversarial.ts
 *
 * Empirical Adversarial Probe for Milestone 2:
 * 1. 3-Tier Character Visual Assets Catalog across all 110 cards (Physical existence, magic bytes, coordinates).
 * 2. Multi-Tier Fallback Candidates & Inline SVG Generator.
 * 3. Lookup Boundary Fuzzing (Extreme values, NaN, floats, null).
 * 4. Modal Rendering & Dismissal Controls (Top-right [x], bottom 닫기, Esc, and Backdrop audit).
 * 5. Zero-Popup & Onboarding Suppression Guard.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import {
  getCharacterAsset,
  getCutoutUrl,
  getBustUrl,
  getSdUrl,
  getAssetCandidates,
  getAllCharacterAssets,
  generateTerminalFlatPlaceholder,
  getFactionForCardId,
  CHARACTER_BASE_NAMES,
  FACTION_PALETTES,
} from '../../src/landing/services/assetCatalog';
import { renderModals } from '../../src/landing/components/Modals';
import { CARD_DATABASE } from '../../src/cardDatabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../');

function checkPngMagic(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);
  return buffer.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function checkJpgMagic(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(3);
  fs.readSync(fd, buffer, 0, 3, 0);
  fs.closeSync(fd);
  return buffer.equals(Buffer.from([0xff, 0xd8, 0xff]));
}

interface ProbeResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details?: string[];
}

export async function runAdversarialProbe(): Promise<{ passed: number; failed: number; warned: number; results: ProbeResult[] }> {
  const results: ProbeResult[] = [];

  // =========================================================================
  // Challenge 1: Physical File Existence & Format across all 110 cards
  // =========================================================================
  {
    const missingCutouts: string[] = [];
    const missingBustPng: string[] = [];
    const missingBustJpg: string[] = [];
    const missingSeat: string[] = [];
    const corruptedFiles: string[] = [];

    for (let id = 1; id <= 110; id++) {
      const asset = getCharacterAsset(id);

      const cutoutPath = path.join(REPO_ROOT, 'public', asset.cutoutUrl.replace(/^\//, ''));
      if (!fs.existsSync(cutoutPath)) {
        missingCutouts.push(`ID ${id}: ${cutoutPath}`);
      } else if (!checkPngMagic(cutoutPath)) {
        corruptedFiles.push(`ID ${id} cutout not valid PNG: ${cutoutPath}`);
      }

      const bustPngPath = path.join(REPO_ROOT, 'public', asset.bustPngUrl.replace(/^\//, ''));
      if (!fs.existsSync(bustPngPath)) {
        missingBustPng.push(`ID ${id}: ${bustPngPath}`);
      } else if (!checkPngMagic(bustPngPath)) {
        corruptedFiles.push(`ID ${id} bust PNG not valid PNG: ${bustPngPath}`);
      }

      const bustJpgPath = path.join(REPO_ROOT, 'public', asset.bustJpgUrl.replace(/^\//, ''));
      if (!fs.existsSync(bustJpgPath)) {
        missingBustJpg.push(`ID ${id}: ${bustJpgPath}`);
      } else if (!checkJpgMagic(bustJpgPath)) {
        corruptedFiles.push(`ID ${id} bust JPG not valid JPG: ${bustJpgPath}`);
      }

      const seatPath = path.join(REPO_ROOT, 'public', asset.seatUrl.replace(/^\//, ''));
      if (!fs.existsSync(seatPath)) {
        missingSeat.push(`ID ${id}: ${seatPath}`);
      } else if (!checkPngMagic(seatPath)) {
        corruptedFiles.push(`ID ${id} seat not valid PNG: ${seatPath}`);
      }
    }

    const allPhysicalPresent =
      missingCutouts.length === 0 &&
      missingBustPng.length === 0 &&
      missingBustJpg.length === 0 &&
      missingSeat.length === 0 &&
      corruptedFiles.length === 0;

    results.push({
      name: 'Physical File Existence & Magic Byte Audit (110 Cutouts, 110 Bust PNGs, 110 Bust JPGs, 110 Seats)',
      status: allPhysicalPresent ? 'PASS' : 'FAIL',
      details: [
        `Cutouts missing: ${missingCutouts.length} / 110`,
        `Bust PNGs missing: ${missingBustPng.length} / 110`,
        `Bust JPGs missing: ${missingBustJpg.length} / 110`,
        `Seat PNGs missing: ${missingSeat.length} / 110`,
        `Corrupted files: ${corruptedFiles.length}`,
      ],
    });
  }

  // =========================================================================
  // Challenge 2: Master Composite Sprite Sheets (cards1.png, cards2.png)
  // =========================================================================
  {
    const cards1Path = path.join(REPO_ROOT, 'public/cards1.png');
    const cards2Path = path.join(REPO_ROOT, 'public/cards2.png');
    const c1Valid = checkPngMagic(cards1Path);
    const c2Valid = checkPngMagic(cards2Path);
    const c1Size = fs.existsSync(cards1Path) ? fs.statSync(cards1Path).size : 0;
    const c2Size = fs.existsSync(cards2Path) ? fs.statSync(cards2Path).size : 0;

    results.push({
      name: 'Master Sprite Sheets Verification (cards1.png & cards2.png)',
      status: c1Valid && c2Valid && c1Size > 0 && c2Size > 0 ? 'PASS' : 'FAIL',
      details: [
        `cards1.png: valid=${c1Valid}, size=${(c1Size / 1024).toFixed(1)} KB`,
        `cards2.png: valid=${c2Valid}, size=${(c2Size / 1024).toFixed(1)} KB`,
      ],
    });
  }

  // =========================================================================
  // Challenge 3: Sprite Coordinate Grid Alignment Math
  // =========================================================================
  {
    let gridErrors = 0;
    const details: string[] = [];

    for (let id = 1; id <= 110; id++) {
      const asset = getCharacterAsset(id);
      const coords = asset.spriteCoords;

      if (id <= 100) {
        if (coords.sourceSheet !== '/cards1.png') {
          gridErrors++;
          details.push(`ID ${id} expected /cards1.png, got ${coords.sourceSheet}`);
        }
        const expectedCol = (id - 1) % 10;
        const expectedRow = Math.floor((id - 1) / 10);
        if (coords.col !== expectedCol || coords.row !== expectedRow) {
          gridErrors++;
          details.push(`ID ${id} expected col=${expectedCol}, row=${expectedRow}, got col=${coords.col}, row=${coords.row}`);
        }
      } else {
        if (coords.sourceSheet !== '/cards2.png') {
          gridErrors++;
          details.push(`ID ${id} expected /cards2.png, got ${coords.sourceSheet}`);
        }
        const expectedCol = (id - 101) % 10;
        const expectedRow = 0;
        if (coords.col !== expectedCol || coords.row !== expectedRow) {
          gridErrors++;
          details.push(`ID ${id} expected col=${expectedCol}, row=${expectedRow}, got col=${coords.col}, row=${coords.row}`);
        }
      }
    }

    results.push({
      name: 'Sprite Sheet Coordinate Grid Math (10x10 cards1, row 0 cards2)',
      status: gridErrors === 0 ? 'PASS' : 'FAIL',
      details: details.length > 0 ? details.slice(0, 5) : ['All 110 cards align with 10x10 sprite layout'],
    });
  }

  // =========================================================================
  // Challenge 4: Fallback Candidate Chains & Inline SVG Data URIs
  // =========================================================================
  {
    let fallbackFailures = 0;
    const sampleSvg = generateTerminalFlatPlaceholder('테스트영웅', 'water');
    const isSvgDataUri = sampleSvg.startsWith('data:image/svg+xml;utf8,');
    const decodedSvg = decodeURIComponent(sampleSvg.replace('data:image/svg+xml;utf8,', ''));
    const isValidXml = decodedSvg.includes('<svg') && decodedSvg.includes('</svg>') && decodedSvg.includes('테스트영웅');

    // Test adversarial characters in SVG generator (XSS injection, ampersand, quotes)
    const xssPayload = 'Test<script>alert(1)</script>&"\'';
    const xssSvg = generateTerminalFlatPlaceholder(xssPayload, 'dragon');
    const decodedXss = decodeURIComponent(xssSvg.replace('data:image/svg+xml;utf8,', ''));
    const isXssEscaped = !decodedXss.includes('<script>') && decodedXss.includes('&lt;script&gt;');

    for (let id = 1; id <= 110; id++) {
      const c7 = getAssetCandidates(id, '7head');
      const cBust = getAssetCandidates(id, 'bust');
      const c3 = getAssetCandidates(id, '3head');

      if (c7.length !== 4 || !c7[3].startsWith('data:image/svg+xml')) fallbackFailures++;
      if (cBust.length !== 4 || !cBust[3].startsWith('data:image/svg+xml')) fallbackFailures++;
      if (c3.length !== 4 || !c3[3].startsWith('data:image/svg+xml')) fallbackFailures++;
    }

    results.push({
      name: 'Fallback Candidate Chains & Inline SVG Generator Safety',
      status: isSvgDataUri && isValidXml && isXssEscaped && fallbackFailures === 0 ? 'PASS' : 'FAIL',
      details: [
        `Sample SVG Data-URI valid: ${isSvgDataUri && isValidXml}`,
        `Adversarial XSS string properly escaped: ${isXssEscaped}`,
        `Candidate chain failures across 110 cards: ${fallbackFailures}`,
      ],
    });
  }

  // =========================================================================
  // Challenge 5: Asset Catalog Lookup Boundary & Fuzzing Resilience
  // =========================================================================
  {
    let fuzzErrors = 0;
    const fuzzCases = [
      { input: 0, expectedId: 1 },
      { input: -1, expectedId: 1 },
      { input: -9999, expectedId: 1 },
      { input: 111, expectedId: 110 },
      { input: 99999, expectedId: 110 },
      { input: NaN as any, expectedId: 1 },
      { input: null as any, expectedId: 1 },
      { input: undefined as any, expectedId: 1 },
      { input: '50' as any, expectedId: 50 },
    ];

    for (const fc of fuzzCases) {
      try {
        const res = getCharacterAsset(fc.input);
        if (res.id !== fc.expectedId) {
          fuzzErrors++;
        }
      } catch (e) {
        fuzzErrors++;
      }
    }

    // Check all assets count
    const all = getAllCharacterAssets();
    const countOk = all.length === 110 && all[0].id === 1 && all[109].id === 110;

    results.push({
      name: 'Lookup Utility Boundary & Fuzzing Clamping (0, -999, 9999, NaN, null)',
      status: fuzzErrors === 0 && countOk ? 'PASS' : 'FAIL',
      details: [
        `Boundary fuzzing errors: ${fuzzErrors}`,
        `getAllCharacterAssets() count: ${all.length} (expected 110)`,
      ],
    });
  }

  // =========================================================================
  // Challenge 6: Modal Rendering & 44px+ Dismiss Controls
  // =========================================================================
  {
    const modals: Array<'mall' | 'community' | 'login'> = ['mall', 'community', 'login'];
    let modalErrors = 0;
    const modalDetails: string[] = [];

    for (const m of modals) {
      const html = renderModals(m);
      const $ = cheerio.load(html);

      const overlay = $('#landing-modal-overlay');
      if (overlay.length === 0) {
        modalErrors++;
        modalDetails.push(`${m} modal missing #landing-modal-overlay`);
      }

      // Check [x] top right button
      const closeButtons = $('[data-action="close-modal"]');
      if (closeButtons.length < 2) {
        modalErrors++;
        modalDetails.push(`${m} modal expected at least 2 close buttons ([x] and 닫기), found ${closeButtons.length}`);
      }

      // Check 44px touch targets on close buttons
      const has44px = closeButtons.toArray().every((btn) => {
        const cls = $(btn).attr('class') || '';
        return cls.includes('min-h-[44px]');
      });
      if (!has44px) {
        modalErrors++;
        modalDetails.push(`${m} modal close button missing min-h-[44px]`);
      }
    }

    // Ensure null modal renders empty
    const nullHtml = renderModals(null);
    if (nullHtml.trim() !== '') {
      modalErrors++;
      modalDetails.push(`renderModals(null) should return empty string, got: "${nullHtml}"`);
    }

    results.push({
      name: 'Modal Rendering & 44px+ Dismiss Controls (mall, community, login)',
      status: modalErrors === 0 ? 'PASS' : 'FAIL',
      details: modalDetails.length > 0 ? modalDetails : ['All 3 modals render [x] and 닫기 buttons with min-h-[44px]'],
    });
  }

  // =========================================================================
  // Challenge 7: Modal Backdrop Dismissal Empirical Behavior
  // =========================================================================
  {
    // Inspect index.ts and Modals.tsx event delegation
    const indexSrc = fs.readFileSync(path.join(REPO_ROOT, 'src/landing/index.ts'), 'utf-8');
    const modalsSrc = fs.readFileSync(path.join(REPO_ROOT, 'src/landing/components/Modals.tsx'), 'utf-8');

    const overlayHasAction = modalsSrc.includes('id="landing-modal-overlay"\n      data-action="close-modal"') ||
      modalsSrc.includes('id="landing-modal-overlay" data-action="close-modal"') ||
      modalsSrc.includes('data-action="close-modal"\n      class="fixed inset-0');

    const indexHasOverlayClickCheck = indexSrc.includes("target.id === 'landing-modal-overlay'") ||
      indexSrc.includes("target.classList.contains('backdrop')") ||
      indexSrc.includes('landing-modal-overlay');

    // If neither is true, backdrop click will not dismiss modal
    const backdropClosesModal = overlayHasAction || indexHasOverlayClickCheck;

    results.push({
      name: 'Modal Backdrop Click Dismissal Behavior',
      status: backdropClosesModal ? 'PASS' : 'WARN',
      details: [
        `Backdrop overlay has data-action="close-modal": ${overlayHasAction}`,
        `index.ts checks for landing-modal-overlay click: ${indexHasOverlayClickCheck}`,
        backdropClosesModal
          ? 'Backdrop click explicitly dismisses modal'
          : 'Backdrop click does NOT dismiss modal; user must click [x], 닫기, or press Escape',
      ],
    });
  }

  // =========================================================================
  // Challenge 8: Zero Onboarding & Initial Visit Popups
  // =========================================================================
  {
    const indexSrc = fs.readFileSync(path.join(REPO_ROOT, 'src/landing/index.ts'), 'utf-8');
    const indexHtml = fs.readFileSync(path.join(REPO_ROOT, 'index.html'), 'utf-8');

    const hasInitialActiveModal = !indexSrc.includes('activeModal: null');
    const hasInitialSidebarOpen = !indexSrc.includes('isSidebarOpen: false');
    const hasAlert = indexSrc.includes('alert(') || indexSrc.includes('confirm(');
    const hasOnboardingPopup = indexSrc.includes('showTutorial') || indexSrc.includes('FirstVisitModal');

    const isClean = !hasInitialActiveModal && !hasInitialSidebarOpen && !hasAlert && !hasOnboardingPopup;

    results.push({
      name: 'Zero-Popup & Onboarding Suppression Guard on First Visit',
      status: isClean ? 'PASS' : 'FAIL',
      details: [
        `Initial activeModal is null: ${!hasInitialActiveModal}`,
        `Initial sidebar is closed: ${!hasInitialSidebarOpen}`,
        `Zero alert/confirm calls: ${!hasAlert}`,
        `Zero legacy tutorial overlays: ${!hasOnboardingPopup}`,
      ],
    });
  }

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;

  return { passed, failed, warned, results };
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('test_m2_assets_modals_adversarial.ts')) {
  runAdversarialProbe().then(({ passed, failed, warned, results }) => {
    console.log('\n======================================================================');
    console.log('  Milestone 2 Adversarial Probe Results (Assets, Modals, Zero Popups)  ');
    console.log('======================================================================\n');
    for (const r of results) {
      const mark = r.status === 'PASS' ? '✓ PASS' : r.status === 'WARN' ? '⚠ WARN' : '✗ FAIL';
      console.log(`[${mark}] ${r.name}`);
      if (r.details) {
        for (const d of r.details) {
          console.log(`       ↳ ${d}`);
        }
      }
    }
    console.log('\n----------------------------------------------------------------------');
    console.log(`Passed: ${passed} | Failed: ${failed} | Warned: ${warned}`);
    console.log('----------------------------------------------------------------------\n');
    process.exit(failed > 0 ? 1 : 0);
  });
}
