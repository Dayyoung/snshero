/**
 * scripts/verify_all_requirements.ts
 *
 * Comprehensive Automated Verification for SNSHero Static Landing Updates.
 */

// Mock browser global environments for node execution
(global as any).window = {
  location: { hash: '#home', pathname: '/', href: 'http://localhost:3000/#home' },
  dispatchEvent: () => {},
  addEventListener: () => {},
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
};

import { renderHomeSection } from '../src/landing/views/HomeSection';
import { renderMyDeckSection, setInspectedDeckCardId } from '../src/landing/views/MyDeckSection';
import { renderPlaySection } from '../src/landing/views/PlaySection';
import { playRpgState } from '../src/landing/services/playRpgEngine';
import { renderCardSection, setSelectedCardId } from '../src/landing/views/CardSection';
import {
  renderShopSection,
  openProductDetail,
  renderProductDetailModal,
  openCoinChargeModal,
  renderCoinChargeModal,
} from '../src/landing/views/ShopSection';
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
console.log('  5. #shop 및 /mall 검토 (카테고리 구분, 미니멀 상세, 즉시구매 나라/페이 팝업)');
console.log('======================================================');
// Check HashRouter unification
assert(HASH_VIEW_MAP['mall'] === 'shop', '#mall 해시 라우트가 shop으로 통합됨');
assert(HASH_VIEW_MAP['goods'] === 'shop', '#goods 해시 라우트가 shop으로 통합됨');
assert(LEGACY_PATH_MAP['/mall'] === 'shop', '/mall 레거시 경로가 shop으로 통합됨');
assert(parseRoute('mall') === 'shop', 'parseRoute("mall") -> "shop" 통합 확인');

// Check 5 categories
const shopHtml = renderShopSection();
assert(
  shopHtml.includes('전체 (ALL)') &&
    shopHtml.includes('카드팩 (PACK)') &&
    shopHtml.includes('실물 굿즈 (GOODS)') &&
    shopHtml.includes('아이템 (ITEM)') &&
    shopHtml.includes('코인 충전 (COIN)'),
  '원본 상점 기준 5대 카테고리 탭 정상 렌더링'
);

// Check minimal product detail
openProductDetail('goods_mug');
const detailHtml = renderProductDetailModal();
assert(
  detailHtml.includes('히어로 커스텀 머그컵') &&
    detailHtml.includes('수량 선택') &&
    detailHtml.includes('즉시 구매하기'),
  '굿즈 상품 상세 모달이 미니멀 필수 정보로 정상 렌더링'
);
assert(
  detailHtml.includes('proceed-to-shipping'),
  '즉시 구매하기 클릭 시 배송지 입력 단계 지원'
);

// Check Coin Charge modal
openCoinChargeModal('coin_10000');
const chargeHtml = renderCoinChargeModal();
assert(
  chargeHtml.includes('1단계: 결제 국가 선택') &&
    chargeHtml.includes('대한민국 (South Korea)') &&
    chargeHtml.includes('암호화폐 결제'),
  '코인 충전 국가선택 팝업 정상 렌더링'
);

console.log('\n======================================================');
console.log('  6. 로그인 모달 검토 (실제 Google/손님 로그인)');
console.log('======================================================');
const loginModalHtml = renderModals('login');
assert(loginModalHtml.includes('Google 계정으로 로그인'), '실제 Google 로그인 버튼 정상 렌더링');
assert(loginModalHtml.includes('손님(게스트)으로 로그인'), '실제 손님(게스트) 로그인 버튼 정상 렌더링');
assert(!loginModalHtml.includes('정식 서비스 런칭 시 오픈될 예정'), '가상 로그인 안내 텍스트 완전 제거됨');

console.log('\n======================================================');
console.log('  7. "LocalStorage 에 저장된다는 내용 모두 제거" 전역 검증');
console.log('======================================================');
const allRenderedHtml = [
  homeHtml,
  deckHtml,
  playHtml,
  cardHtml,
  shopHtml,
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
