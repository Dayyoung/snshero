/**
 * Trust Center Policies
 * 
 * 확률형 아이템, 환불, 개인정보 관련 고지 데이터.
 * 실제 법무 검토 필요 상태를 표시할 수 있는 구조.
 * 
 * 본 문서는 법률 자문을 대체하지 않습니다.
 */

import type { Language } from '../types';

/** 법무 검토 상태 */
export type LegalReviewStatus = 'pending' | 'in_review' | 'approved' | 'needs_update';

/** 개별 정책 섹션 */
export interface PolicySection {
  id: string;
  /** ko/en 번역키 — 장문 정책은 policies.ts 에서 locale별로 관리 */
  titleKey: string;
  bodyKey: string;
  /** 법무 검토 상태 */
  reviewStatus: LegalReviewStatus;
  /** 마지막 업데이트일 (YYYY-MM-DD) */
  updatedAt: string;
  /** 아이콘 이름 (lucide-react) */
  icon: string;
}

/** locale별 장문 정책 본문 */
export interface LocalePolicyBody {
  ko: string;
  en: string;
}

/** 정책 섹션 목록 */
export const POLICY_SECTIONS: PolicySection[] = [
  {
    id: 'probability',
    titleKey: 'policy_probability_title',
    bodyKey: 'policy_probability_body',
    reviewStatus: 'pending',
    updatedAt: '2026-07-01',
    icon: 'Dices',
  },
  {
    id: 'refund',
    titleKey: 'policy_refund_title',
    bodyKey: 'policy_refund_body',
    reviewStatus: 'pending',
    updatedAt: '2026-07-01',
    icon: 'RotateCcw',
  },
  {
    id: 'privacy',
    titleKey: 'policy_privacy_title',
    bodyKey: 'policy_privacy_body',
    reviewStatus: 'pending',
    updatedAt: '2026-07-01',
    icon: 'Shield',
  },
  {
    id: 'terms',
    titleKey: 'policy_terms_title',
    bodyKey: 'policy_terms_body',
    reviewStatus: 'pending',
    updatedAt: '2026-07-01',
    icon: 'FileText',
  },
];

/** 장문 정책 본문 — locale별로 분리 */
export const POLICY_BODIES: Record<string, LocalePolicyBody> = {
  probability: {
    ko: `본 게임은 확률형 아이템(카드 뽑기)을 포함하고 있습니다. 모든 확률 정보는 게임 내 '확률 정보' 화면에서 투명하게 공개됩니다.

■ 확률 공개 원칙
- 각 카드팩(일반/매직/희귀)의 등급별 획득 확률은 소수점 둘째 자리까지 명시합니다.
- 확률은 게임 서버에서 검증되며, 클라이언트 단독으로 결정되지 않습니다.
- 확률 정보는 법령 또는 운영 정책 변경 시 즉시 갱신됩니다.

■ 천장 시스템 (Pity System)
- 일정 횟수 이상 카드팩을 개봉해도 희귀 등급을 획득하지 못한 경우, 보장 시스템이 작동합니다.
- 팩별 천장 기준: 일반 50회, 매직 30회, 희귀 20회.

■ 주의사항
- 확률형 아이템의 결과는 무작위이며, 과도한 구매는 재정적 손실을 초래할 수 있습니다.
- 본 게임은 건전한 게임 이용을 권장합니다.

※ 본 고지는 2026년 7월 1일 기준이며, 법률 자문을 대체하지 않습니다.`,
    en: `This game includes probability-based items (card draws). All probability information is transparently disclosed on the 'Probability Info' screen within the game.

■ Probability Disclosure Principles
- The acquisition probability for each rarity tier in every card pack (Common/Magic/Rare) is specified to two decimal places.
- Probabilities are verified by the game server and are not determined by the client alone.
- Probability information is updated immediately upon changes to applicable laws or operational policies.

■ Pity System (Guarantee)
- If a certain number of card packs are opened without obtaining a rare tier, a guarantee system activates.
- Pity thresholds per pack: Common 50, Magic 30, Rare 20.

■ Caution
- Results of probability-based items are random, and excessive purchasing may lead to financial loss.
- This game encourages healthy gaming habits.

※ This notice is effective as of July 1, 2026, and does not constitute legal advice.`,
  },

  refund: {
    ko: `■ 환불 정책

1. 일반 원칙
   - 디지털 콘텐츠(카드, 아이템 등)는 구매 즉시 제공되므로, 전자상거래법 등 관련 법령에 따라 청약철회가 제한될 수 있습니다.
   - 단, 다음과 같은 경우에는 예외적으로 환불이 가능합니다.

2. 환불 가능 사유
   - 구매한 아이템이 정상적으로 지급되지 않은 경우 (시스템 오류)
   - 미성년자가 법정대리인의 동의 없이 결제한 경우 (증빙 필요)
   - 기타 관련 법령에서 정하는 사유

3. 환불 불가 사유
   - 단순 변심에 의한 환불 요청
   - 이미 사용(개봉, 장착, 소비)한 아이템
   - 이벤트/프로모션으로 무료 지급된 아이템

4. 환불 신청 방법
   - 설정 > 피드백 메뉴를 통해 '환불 요청' 유형으로 신청
   - 운영팀이 접수 후 영업일 기준 7일 이내에 검토 결과를 안내

※ 본 정책은 대한민국 전자상거래법 등 관련 법령을 준수하며, 구체적인 사안에 대해서는 법률 전문가의 조언을 받으시기 바랍니다.`,
    en: `■ Refund Policy

1. General Principles
   - Digital content (cards, items, etc.) is provided immediately upon purchase, and the right of withdrawal may be restricted under applicable laws such as the E-Commerce Act.
   - However, refunds may be granted in the following exceptional cases.

2. Refundable Cases
   - Purchased items not properly delivered (system error)
   - Payment made by a minor without legal guardian consent (documentation required)
   - Other grounds specified by applicable laws

3. Non-Refundable Cases
   - Change of mind
   - Items already used (opened, equipped, consumed)
   - Items received free via events/promotions

4. How to Request a Refund
   - Submit via Settings > Feedback menu, selecting 'Refund Request' type
   - Operations team will review and respond within 7 business days

※ This policy complies with applicable laws. Please consult a legal professional for specific cases.`,
  },

  privacy: {
    ko: `■ 개인정보 처리방침

1. 수집하는 개인정보
   - 필수: Google 계정 이메일, 프로필 사진, 표시 이름
   - 선택: 닉네임, 게임 플레이 데이터 (덱 구성, 전적)
   - 자동: 브라우저 언어 설정, 접속 로그, 기기 정보

2. 수집 목적
   - 게임 서비스 제공 및 계정 관리
   - 게임 데이터 동기화 및 백업
   - 서비스 개선 및 통계 분석

3. 보관 기간
   - 서비스 이용 기간 동안 보관
   - 회원 탈퇴 시 즉시 파기 (단, 법령에 따른 보관 의무가 있는 경우 제외)

4. 제3자 제공
   - 원칙적으로 제3자에게 개인정보를 제공하지 않습니다.
   - 단, Firebase(Google Cloud) 등 서비스 운영에 필요한 인프라 제공업체에 한해 데이터가 저장됩니다.

5. 이용자 권리
   - 열람, 정정, 삭제, 처리정지 요청 가능
   - 설정 메뉴 또는 고객센터를 통해 요청

6. 쿠키
   - 서비스 개선 및 사용자 경험 향상을 위해 쿠키를 사용합니다.
   - 브라우저 설정에서 쿠키 사용을 거부할 수 있습니다.

※ 본 방침은 개인정보 보호법 등 관련 법령을 준수합니다.`,
    en: `■ Privacy Policy

1. Personal Information Collected
   - Required: Google account email, profile picture, display name
   - Optional: Nickname, gameplay data (deck composition, match records)
   - Automatic: Browser language settings, access logs, device information

2. Purpose of Collection
   - Game service provision and account management
   - Game data synchronization and backup
   - Service improvement and statistical analysis

3. Retention Period
   - Retained during the service usage period
   - Immediately destroyed upon account deletion (except where retention is required by law)

4. Third-Party Disclosure
   - In principle, personal information is not provided to third parties.
   - However, data may be stored with infrastructure providers necessary for service operation, such as Firebase (Google Cloud).

5. User Rights
   - Right to access, correct, delete, and restrict processing of personal data
   - Requests can be made via the Settings menu or Customer Support

6. Cookies
   - Cookies are used to improve service and enhance user experience.
   - Cookie usage can be declined in browser settings.

※ This policy complies with applicable data protection laws.`,
  },

  terms: {
    ko: `■ 이용약관 (초안)

제1조 (목적)
본 약관은 SNSHero(이하 "회사")가 제공하는 SNSHero 카드게임 서비스(이하 "서비스")의 이용 조건 및 절차를 규정함을 목적으로 합니다.

제2조 (정의)
- "이용자"란 서비스에 접속하여 본 약관에 따라 서비스를 이용하는 모든 자를 말합니다.
- "SNS 포인트"란 서비스 내에서 사용되는 가상 화폐를 의미합니다.

제3조 (약관의 효력 및 변경)
- 회사는 본 약관을 서비스 초기 화면 또는 연결 화면에 게시합니다.
- 회사는 합리적인 사유가 있을 경우 약관을 변경할 수 있으며, 변경 시 사전 공지합니다.

제4조 (서비스 이용)
- 이용자는 본 약관에 동의함으로써 서비스를 이용할 수 있습니다.
- 이용자는 타인의 계정을 도용하거나 부정한 방법으로 서비스를 이용할 수 없습니다.

제5조 (SNS 포인트)
- SNS 포인트는 게임 플레이, 이벤트 참여, 구매 등을 통해 획득할 수 있습니다.
- SNS 포인트는 현금으로 환급되지 않습니다. (단, 약관 및 법령에 따른 환불 정책 적용)

제6조 (이용 제한)
- 회사는 다음 각 호의 경우 이용을 제한할 수 있습니다.
  1. 타인의 개인정보 도용
  2. 서비스 운영을 방해하는 행위
  3. 비정상적인 방법으로 SNS 포인트를 획득하는 행위

제7조 (면책)
- 회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.

※ 본 약관은 초안이며, 법무 검토 후 최종 확정됩니다.`,
    en: `■ Terms of Service (Draft)

Article 1 (Purpose)
These Terms govern the terms and conditions for using the SNSHero card game service (the "Service") provided by SNSHero (the "Company").

Article 2 (Definitions)
- "User" means any person who accesses the Service and uses it in accordance with these Terms.
- "SNS Points" means the virtual currency used within the Service.

Article 3 (Effect and Modification of Terms)
- The Company shall post these Terms on the initial screen or a linked screen of the Service.
- The Company may modify these Terms with reasonable cause, providing prior notice of changes.

Article 4 (Use of Service)
- Users may use the Service by agreeing to these Terms.
- Users shall not impersonate others or use the Service in fraudulent ways.

Article 5 (SNS Points)
- SNS Points may be obtained through gameplay, event participation, purchases, etc.
- SNS Points are not redeemable for cash (except as provided in the refund policy under these Terms and applicable laws).

Article 6 (Use Restrictions)
- The Company may restrict use in the following cases:
  1. Misappropriation of another's personal information
  2. Interference with service operation
  3. Obtaining SNS Points through abnormal methods

Article 7 (Disclaimer)
- The Company shall not be liable for service interruptions caused by force majeure such as natural disasters or system failures.

※ These Terms are a draft and will be finalized after legal review.`,
  },
};

/** 법무 검토 상태 라벨 조회 */
export function getReviewStatusLabel(status: LegalReviewStatus, language: Language): string {
  const labels: Record<LegalReviewStatus, Record<string, string>> = {
    pending: { ko: '검토 대기', en: 'Pending Review' },
    in_review: { ko: '검토 중', en: 'Under Review' },
    approved: { ko: '검토 완료', en: 'Approved' },
    needs_update: { ko: '업데이트 필요', en: 'Needs Update' },
  };
  return labels[status]?.[language] ?? labels[status]?.en ?? status;
}

/** 정책 요약 (짧은 버전 — i18n 키로 사용) */
export const POLICY_SUMMARIES: Record<string, Record<string, string>> = {
  probability: {
    ko: '확률형 아이템의 등급별 획득 확률과 천장 시스템을 투명하게 공개합니다.',
    en: 'Transparently discloses acquisition probabilities by tier and the pity system.',
  },
  refund: {
    ko: '디지털 콘텐츠 환불 정책과 신청 절차를 안내합니다.',
    en: 'Guide to digital content refund policies and application procedures.',
  },
  privacy: {
    ko: '수집하는 개인정보 항목, 이용 목적, 보관 기간을 안내합니다.',
    en: 'Information on collected personal data, usage purposes, and retention periods.',
  },
  terms: {
    ko: '서비스 이용약관 초안입니다. 법무 검토 후 확정됩니다.',
    en: 'Draft terms of service. To be finalized after legal review.',
  },
};

/** 개별 정책 섹션 본문을 locale에 맞게 가져오기 */
export function getPolicyBody(sectionId: string, language: Language): string {
  const body = POLICY_BODIES[sectionId];
  if (!body) return '';
  return language === 'ko' ? body.ko : body.en;
}

