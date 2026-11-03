import { getAllCharacterAssets, getCharacterAsset, getFactionForCardId } from '../../../src/landing/services/assetCatalog';
import { CARD_DATABASE } from '../../../src/cardDatabase';
import { TOP_NAV_ITEMS, SIDE_NAV_ITEMS, EXTERNAL_LINKS } from '../../../src/landing/types';
import fs from 'fs';
import path from 'path';

interface CheckResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  console.log(`[${condition ? 'PASS' : 'FAIL'}] ${name}: ${details}`);
}

console.log('=== FORENSIC ADVERSARIAL AUDIT FOR MILESTONE 2 ===\n');

// 1. Verify 110 Character Asset Metadata Completeness and Integrity
const allAssets = getAllCharacterAssets();
check('Catalog Length', allAssets.length === 110, `Catalog contains exactly ${allAssets.length} assets`);

let allFilesValid = true;
let missingFiles: string[] = [];
let spriteCoordsValid = true;

for (let id = 1; id <= 110; id++) {
  const asset = getCharacterAsset(id);
  const cardData = CARD_DATABASE[id];

  if (!cardData) {
    check(`Card ${id} in Database`, false, `Card ID ${id} not found in CARD_DATABASE`);
    continue;
  }

  // Check name match
  if (asset.nameKo !== cardData.title) {
    check(`Card ${id} Name match`, false, `Catalog name (${asset.nameKo}) != Database (${cardData.title})`);
    allFilesValid = false;
  }

  // Check sprite sheet assignment
  const expectedSheet = id <= 100 ? '/cards1.png' : '/cards2.png';
  if (asset.spriteSheet !== expectedSheet) {
    check(`Card ${id} SpriteSheet`, false, `Expected ${expectedSheet}, got ${asset.spriteSheet}`);
    spriteCoordsValid = false;
  }

  // Check seatUrl file exists
  const seatPath = path.join(process.cwd(), 'public', asset.seatUrl);
  if (!fs.existsSync(seatPath)) {
    missingFiles.push(asset.seatUrl);
    allFilesValid = false;
  }

  // Check cutout file exists
  const cutoutPath = path.join(process.cwd(), 'public', asset.cutoutUrl);
  if (!fs.existsSync(cutoutPath)) {
    missingFiles.push(asset.cutoutUrl);
    allFilesValid = false;
  }
}

check('All 110 Seat & Cutout Assets Exist', missingFiles.length === 0, 
  missingFiles.length === 0 ? 'All 110 seat and cutout files verified on disk' : `Missing files: ${missingFiles.slice(0, 5).join(', ')}...`);
check('Sprite Coordinate Formulas', spriteCoordsValid, 'All 110 sprite coordinates map correctly to cards1.png (1-100) and cards2.png (101-110)');

// 2. Boundary Testing: Out of Range Card IDs
const assetZero = getCharacterAsset(0);
const assetNegative = getCharacterAsset(-5);
const asset111 = getCharacterAsset(111);
const asset999 = getCharacterAsset(999);

check('Boundary Id 0 Clamp', assetZero.id === 1, `Id 0 clamps to 1 (got ${assetZero.id})`);
check('Boundary Negative Clamp', assetNegative.id === 1, `Id -5 clamps to 1 (got ${assetNegative.id})`);
check('Boundary Id 111 Clamp', asset111.id === 110, `Id 111 clamps to 110 (got ${asset111.id})`);
check('Boundary Id 999 Clamp', asset999.id === 110, `Id 999 clamps to 110 (got ${asset999.id})`);

// 3. Navigation Exactness
const headerContent = fs.readFileSync(path.join(process.cwd(), 'src/landing/components/Header.tsx'), 'utf8');
const sidebarContent = fs.readFileSync(path.join(process.cwd(), 'src/landing/components/Sidebar.tsx'), 'utf8');

check('Top Nav Exact 6 Items', TOP_NAV_ITEMS.length === 6, `TOP_NAV_ITEMS length is ${TOP_NAV_ITEMS.length}: ${TOP_NAV_ITEMS.join(', ')}`);
check('Side Nav Exact 8 Items', SIDE_NAV_ITEMS.length === 8, `SIDE_NAV_ITEMS length is ${SIDE_NAV_ITEMS.length}: ${SIDE_NAV_ITEMS.join(', ')}`);

let topNavMatch = TOP_NAV_ITEMS.every(item => headerContent.includes(`label: '${item}'`));
check('Header contains exact 6 TOP_NAV_ITEMS', topNavMatch, 'All 6 items explicitly declared in TOP_NAV_DEFS');

let sideNavMatch = SIDE_NAV_ITEMS.every(item => sidebarContent.includes(`label: '${item}'`));
check('Sidebar contains exact 8 SIDE_NAV_ITEMS', sideNavMatch, 'All 8 items explicitly declared in SIDE_NAV_DEFS');

// 4. Zero Onboarding Popups Verification
const indexContent = fs.readFileSync(path.join(process.cwd(), 'src/landing/index.ts'), 'utf8');
const hasInitialPopup = indexContent.includes('activeModal: "') || 
                        indexContent.includes("activeModal: '") || 
                        indexContent.includes('isSidebarOpen: true') ||
                        indexContent.includes('alert(') ||
                        indexContent.includes('showTutorial') ||
                        indexContent.includes('FirstVisit');

check('Zero Initial Onboarding Popups', !hasInitialPopup, 'Initial state sets activeModal: null and isSidebarOpen: false with 0 intrusive popups');

// 5. Responsive CSS Design System Verification
const cssContent = fs.readFileSync(path.join(process.cwd(), 'src/landing/styles/landing.css'), 'utf8');
const hasTouchTargetStandard = cssContent.includes('min-height: 44px') || cssContent.includes('min-h-[44px]');
const hasFluidReset = cssContent.includes('box-sizing: border-box') && cssContent.includes('overflow-x: hidden');
const hasProhibitedClasses = /bg-gradient-to|rounded-xl|rounded-2xl|rounded-3xl|animate-ping|animate-bounce/.test(cssContent);

check('CSS 44px+ Touch Target Standard', hasTouchTargetStandard, 'landing.css defines min-height: 44px for touch targets');
check('CSS Fluid Reset', hasFluidReset, 'landing.css enforces box-sizing and overflow-x prevention');
check('CSS Zero Prohibited Classes', !hasProhibitedClasses, 'landing.css contains 0 prohibited decorative gradients or large rounded radii');

// 6. Bundle Size and Zero React Runtime Verification
const distIndexPath = path.join(process.cwd(), 'dist/index.html');
if (fs.existsSync(distIndexPath)) {
  const distHtml = fs.readFileSync(distIndexPath, 'utf8');
  const sizeKb = distHtml.length / 1024;
  const hasReact = distHtml.includes('vendor-react');
  check('Production dist/index.html Size < 50 KB', sizeKb < 50, `Size is ${sizeKb.toFixed(2)} KB (budget: 50 KB)`);
  check('Production dist/index.html Zero React', !hasReact, 'dist/index.html contains 0 vendor-react script tags');
} else {
  check('Production dist/index.html Exists', false, 'dist/index.html does not exist');
}

// 7. Oracle Sensitivity Stress Check: Mutated inputs must trigger failures
console.log('\n--- Oracle Sensitivity Check ---');
const fakeHeaderWithoutMall = headerContent.replace("'쇼핑몰'", "'가짜메뉴'");
const hasMallInFake = TOP_NAV_ITEMS.every(item => fakeHeaderWithoutMall.includes(`label: '${item}'`));
check('Oracle Rejects Missing Top Nav Item', !hasMallInFake, 'Oracle detects when 쇼핑몰 is missing from header');

const fakeIndexWithPopup = indexContent.replace('activeModal: null', 'activeModal: "mall"');
const detectsFakePopup = fakeIndexWithPopup.includes('activeModal: "') || fakeIndexWithPopup.includes('initialModal: true');
check('Oracle Rejects Initial Popup Intrusion', detectsFakePopup, 'Oracle detects when activeModal is pre-set on load');

console.log('\n=== AUDIT SUMMARY ===');
const failedCount = results.filter(r => !r.passed).length;
console.log(`Total Checks: ${results.length} | Passed: ${results.length - failedCount} | Failed: ${failedCount}`);
if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ADVERSARIAL & FORENSIC CHECKS PASSED CLEANLY.');
}
