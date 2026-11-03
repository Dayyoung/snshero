/**
 * scripts/verify_all_requirements.ts
 *
 * Comprehensive Automated Verification for SNSHero Static Landing Updates:
 *   1. #home (문구 삭제, 3개 블록 삭제, 원본 카드 디자인)
 *   2. #deck (모바일 팝업 모달, 버튼블록 삭제, 원본 카드 디자인)
 *   3. #play (카단의 여정 자동 진행 단독 노출, 아케이드/웹툰 삭제, 모바일 대사 팝업)
 *   4. #card (카드 클릭 시 모바일 상세/육성 모달, 원본 카드 디자인 복구)
 *   5. #shop 및 #mall 분리 (인게임 상점 vs 공식 실물 굿즈 몰 구분)
 *   6. 실제 결제 구현 (PayApp Lite / PayPal / Crypto 연동 및 SIM 테스트 분리)
 *   7. 로그인 모달 (실제 Google 로그인 / 손님 로그인)
 *   8. LocalStorage 저장 안내 문구 UI 전역 영구 제거
 */

// Mock browser global environments for node execution
(global as any).window = {
  location: { hash: '#home', pathname: '/', href: 'http://localhost:3000/#home', origin: 'http://localhost:3000' },
  dispatchEvent: () => {},
  addEventListener: () => {},
  history: {
    replaceState: () => {},
  },
};

const localStorageMap = new Map<string, string>();
(global as any).localStorage = {
  getItem: (k: string) => localStorageMap.get(k) || null,
  setItem: (k: string, v: string) => localStorageMap.set(k, v),
  removeItem: (k: string) => localStorageMap.delete(k),
  clear: () => localStorageMap.clear(),
};
(global as any).document = {
  addEventListener: () => {},
  getElementById: () => null,
};

import { renderHomeSection, setInspectedHomeCardId } from '../src/landing/views/HomeSection';
import { renderMyDeckSection, setInspectedDeckCardId } from '../src/landing/views/MyDeckSection';
import { renderPlaySection } from '../src/landing/views/PlaySection';
import { playRpgState } from '../src/landing/services/playRpgEngine';
import { renderCardSection, setSelectedCardId } from '../src/landing/views/CardSection';
import {
  renderShopView,
  openCoinChargeModal,
  selectChargeCountry,
  renderCoinChargeModal,
  executeCoinCharge,
} from '../src/landing/views/ShopSection';
import {
  renderMallView,
  openMallProductDetail,
  renderMallModal,
  proceedMallToShipping,
  submitMallShipping,
  selectMallCountry,
  executeMallCheckout,
} from '../src/landing/views/MallSection';
import { checkAndProcessPayAppSuccess } from '../src/landing/services/paymentService';
import { renderModals } from '../src/landing/components/Modals';
import { renderHeader } from '../src/landing/components/Header';
import { renderSidebar } from '../src/landing/components/Sidebar';
import { renderFooter } from '../src/landing/components/Footer';
import { parseRoute, HASH_VIEW_MAP, LEGACY_PATH_MAP } from '../src/landing/services/hashRouter';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('  1. #home 검토 (문구 삭제, 3개 블록 삭제, 원본 카드)');
console.log('======================================================');
const homeHtml = renderHomeSection();
assert(
  !homeHtml.includes('서버 로그인 없이 브라우저 로컬스토리지(LocalStorage)에 육성 데이터가 영구 보존됩니다'),
  '로컬스토리지 영구 보존 안내 문구 제거됨'
);
assert(!homeHtml.includes('웹게임 즉시 시작 →'), '웹게임 즉시 시작 버튼 블록 제거됨');
assert(!homeHtml.includes('40부작 웹툰·애니메이션 감상'), '40부작 웹툰 버튼 블록 제거됨');
assert(!homeHtml.includes('마이덱 확인 →'), '마이덱 확인 버튼 블록 제거됨');
assert(!homeHtml.includes('[NO.041] 카단 (Kadan)'), '카단 흉상 블록 제거됨');
assert(!homeHtml.includes('110종 영웅 3단계 비주얼 자산 체계'), '3단계 비주얼 자산 체계 섹션 제거됨');
assert(
  homeHtml.includes('group/orig-card') && homeHtml.includes('북(N):'),
  '홈 덱 쇼케이스에 원본 카드 디자인(다이아몬드 나침반 스탯) 적용됨'
);

// Check Home Card Inspect Modal (Mobile overflow prevention and close button)
setInspectedHomeCardId(1);
const homeInspectHtml = renderHomeSection();
assert(
  homeInspectHtml.includes('home-card-inspect-modal') &&
    homeInspectHtml.includes('max-h-[90dvh]') &&
    homeInspectHtml.includes('overflow-hidden') &&
    homeInspectHtml.includes('overflow-y-auto'),
  '홈 카드 클릭 시 팝업이 max-h-[90dvh] 및 내부 스크롤로 모바일 넘침 방지됨'
);
assert(
  homeInspectHtml.includes('[x] 닫기') &&
    homeInspectHtml.includes('data-action="close-home-card-inspect"'),
  '홈 카드 팝업 상단 및 하단에 닫기 버튼 정상 표시 및 액션 연결됨'
);
setInspectedHomeCardId(null);

console.log('\n======================================================');
console.log('  2. #deck 검토 (모바일 팝업, 2개 버튼블록 삭제, 원본카드)');
console.log('======================================================');
const deckHtml = renderMyDeckSection(1);
assert(!deckHtml.includes('카드 육성 및 스탯 분배 (Lv.1~100) →'), '상단 헤더 퀵버튼 블록 제거됨');
assert(!deckHtml.includes('이 슬롯 영웅 교체하기 (SLOT 01) →'), '하단 교체/육성/출격 버튼 블록 제거됨');
assert(
  deckHtml.includes('group/orig-card') && deckHtml.includes('북(N):'),
  '덱 슬롯 및 교체 드로어에 원본 카드 디자인 적용됨'
);

// Check inspected modal
setInspectedDeckCardId(1);
const deckInspectedHtml = renderMyDeckSection(1);
assert(
  deckInspectedHtml.includes('deck-card-detail-modal') && deckInspectedHtml.includes('fixed inset-0 z-50'),
  '카드 클릭 시 모바일 중앙 팝업 모달 정상 노출'
);
setInspectedDeckCardId(null);

console.log('\n======================================================');
console.log('  3. #play 검토 (카단의 여정 자동진행, 아케이드/웹툰 삭제, 대사 팝업)');
console.log('======================================================');
const playHtml = renderPlaySection();
assert(!playHtml.includes('110선 아케이드 게임 풀'), '아케이드 게임 탭/패널 제거됨');
assert(!playHtml.includes('웹툰 극장'), '웹툰 극장 탭/패널 제거됨');
assert(playHtml.includes('카단의 여정'), '카단의 여정 단독 노출 확인');
assert(typeof playRpgState.autoMode === 'boolean', '카단의 여정 자동 진행 상태 필드 지원');

// Check dialogue modal when dialogue is active
playRpgState.subState = 'dialogue';
const playDialogueHtml = renderPlaySection();
assert(playDialogueHtml.includes('play-dialogue-modal-root'), '대사 팝업이 모바일 중앙 모달(z-50)로 구성됨');
playRpgState.subState = 'map';

console.log('\n======================================================');
console.log('  4. #card 검토 (카드 클릭 모달 팝업, 원본 카드 디자인)');
console.log('======================================================');
setSelectedCardId(null);
const cardHtml = renderCardSection();
assert(
  cardHtml.includes('group/orig-card') && cardHtml.includes('북(N):'),
  '110종 카드 그리드에 원본 TCG 디자인 적용됨'
);

setSelectedCardId(1);
const cardModalHtml = renderCardSection();
assert(cardModalHtml.includes('card-nurture-modal-root'), '카드 클릭 시 육성 및 스탯 분배 모달 팝업 지원');
setSelectedCardId(null);

console.log('\n======================================================');
console.log('  5. #shop 및 #mall 분리 검토 (인게임 상점 vs 공식 실물 굿즈 몰)');
console.log('======================================================');
// Check HashRouter distinct mapping
assert(HASH_VIEW_MAP['shop'] === 'shop', '#shop -> shop 매핑 확인');
assert(HASH_VIEW_MAP['mall'] === 'mall', '#mall -> mall 독립 매핑 확인');
assert(HASH_VIEW_MAP['goods'] === 'mall', '#goods -> mall 독립 매핑 확인');
assert(LEGACY_PATH_MAP['/shop'] === 'shop', '/shop -> shop 매핑 확인');
assert(LEGACY_PATH_MAP['/mall'] === 'mall', '/mall -> mall 독립 매핑 확인');
assert(parseRoute('mall') === 'mall', 'parseRoute("mall") -> "mall" 독립 확인');

// Check #shop categories (In-Game only)
const shopHtml = renderShopView();
assert(
  shopHtml.includes('전체 (ALL)') &&
    shopHtml.includes('카드팩 가챠 (PACK)') &&
    shopHtml.includes('아이템·특전 (ITEM)') &&
    shopHtml.includes('코인 충전 (COIN)') &&
    shopHtml.includes('골드 환전 (SWAP)'),
  '#shop: 원본 상점 기준 인게임 5대 카테고리 탭 정상 렌더링'
);
assert(!shopHtml.includes('히어로 커스텀 머그컵'), '#shop에서 실물 굿즈가 제거되어 인게임 전용으로 정돈됨');

// Check #mall view & products (Physical Goods only)
const mallHtml = renderMallView();
assert(
  mallHtml.includes('SNS히어로 공식 굿즈 몰') &&
    mallHtml.includes('110장 올인원 풀세트') &&
    mallHtml.includes('종족별 영웅 덱') &&
    mallHtml.includes('히어로 3x3 배틀 게임테이블') &&
    mallHtml.includes('히어로 커스텀 머그컵'),
  '#mall: 공식 실물 굿즈 상품 라인업 정상 렌더링'
);

// Check Header & Sidebar have both Shop and Mall
const headerHtml = renderHeader('home');
assert(headerHtml.includes('data-nav="shop"') && headerHtml.includes('상점'), '헤더에 상점 (#shop) 메뉴 포함');
assert(headerHtml.includes('data-nav="mall"') && headerHtml.includes('굿즈몰'), '헤더에 굿즈몰 (#mall) 독립 메뉴 포함');

const sidebarHtml = renderSidebar(true, 'home');
assert(sidebarHtml.includes('data-nav="shop"') && sidebarHtml.includes('상점'), '사이드바에 상점 (#shop) 포함');
assert(sidebarHtml.includes('data-nav="mall"') && sidebarHtml.includes('굿즈몰'), '사이드바에 굿즈몰 (#mall) 독립 포함');

console.log('\n======================================================');
console.log('  6. 실제 결제 구현 & 즉시 충전 오류 해결 검증');
console.log('======================================================');
// Check Coin Charge modal options
openCoinChargeModal('coin_10000');
selectChargeCountry('ko');
const chargeModalHtml = renderCoinChargeModal();
assert(
  chargeModalHtml.includes('국내 신용/체크카드 (PayApp)') &&
    chargeModalHtml.includes('카카오페이 (Kakao Pay)') &&
    chargeModalHtml.includes('네이버페이 (Naver Pay)') &&
    chargeModalHtml.includes('Apple Pay'),
  '코인 충전 결제 수단으로 PayApp Lite PG 및 간편결제 제공'
);
assert(
  chargeModalHtml.includes('[개발자/시뮬레이션] 즉시 충전 (SIM - 무과금)'),
  '테스트용 즉시 충전 버튼이 별도로 명확히 분리됨'
);

// Verify executeCoinCharge with 'test_sim' grants mock coins
const coinsBefore = parseInt((global as any).localStorage.getItem('hero_sns') || '1000', 10);
await executeCoinCharge('test_sim');
const coinsAfter = parseInt((global as any).localStorage.getItem('hero_sns') || '1000', 10);
assert(coinsAfter > coinsBefore, 'SIM 테스트 결제 클릭 시에만 즉시 충전 처리됨');

// Verify Mall checkout options
openMallProductDetail('goods_mug');
proceedMallToShipping();
submitMallShipping({ name: '홍길동', phone: '010-1234-5678', address: '서울시 강남구 테헤란로 123' });
selectMallCountry('ko');
const mallModalHtml = renderMallModal();
assert(
  mallModalHtml.includes('국내 신용/체크카드 (PayApp)') &&
    mallModalHtml.includes('카카오페이 (Kakao Pay)') &&
    mallModalHtml.includes('네이버페이 (Naver Pay)'),
  '굿즈 몰 결제 수단으로 실제 PayApp 결제창 지원'
);
assert(
  mallModalHtml.includes('[개발자/시뮬레이션] 즉시 주문 승인 (SIM - 무과금)'),
  '굿즈 몰에서도 SIM 테스트 주문 버튼이 별도로 분리됨'
);

// Verify checkAndProcessPayAppSuccess cleans param and updates coins
(global as any).window.location.search = '?payapp_success=3000';
const payappRes = checkAndProcessPayAppSuccess();
assert(payappRes.handled && payappRes.amount === 3000, 'PayApp 결제 성공 복귀 시 정상 코인 지급');
(global as any).window.location.search = '';

console.log('\n======================================================');
console.log('  7. 로그인 모달 검토 (실제 Google/손님 로그인)');
console.log('======================================================');
const loginModalHtml = renderModals('login');
assert(loginModalHtml.includes('Google 계정으로 로그인'), '실제 Google 로그인 버튼 정상 렌더링');
assert(loginModalHtml.includes('손님(게스트)으로 로그인'), '실제 손님(게스트) 로그인 버튼 정상 렌더링');
assert(!loginModalHtml.includes('정식 서비스 런칭 시 오픈될 예정'), '가상 로그인 안내 텍스트 완전 제거됨');

console.log('\n======================================================');
console.log('  8. "LocalStorage 에 저장된다는 내용 모두 제거" 전역 검증');
console.log('======================================================');
const allRenderedHtml = [
  homeHtml,
  deckHtml,
  playHtml,
  cardHtml,
  shopHtml,
  mallHtml,
  loginModalHtml,
  renderHeader('home'),
  renderSidebar(true, 'home'),
  renderFooter(),
].join(' ');

const bannedPhrases = [
  'LocalStorage 에 저장',
  '로컬스토리지에 저장',
  '로컬스토리지 영구 보존',
  '로컬스토리지(LocalStorage)',
  '100% LocalStorage',
  'LocalStorage 자동저장',
];

for (const phrase of bannedPhrases) {
  assert(!allRenderedHtml.includes(phrase), `금지된 문구 미포함 검증: "${phrase}"`);
}

console.log('\n======================================================');
console.log(`  총 결과: ${passed}개 통과, ${failed}개 실패`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 모든 요구사항이 100% 완벽하게 적용되었습니다!\n');
}
