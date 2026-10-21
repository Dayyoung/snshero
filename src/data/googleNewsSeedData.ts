/**
 * googleNewsSeedData.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 기반 실시간 뉴스 시드 데이터
 * 스프레드시트: https://docs.google.com/spreadsheets/d/e/2PACX-1vQkHP5pQDdSMrx3f0GyUz_rK5yqmMj5J12apkSom3JvF-NVk2yD55tFAk_Ka7qKM54dPr1ru3LP15Zu/pubhtml
 */

import { RedditPost } from '../lib/reddit/redditTypes';

export interface RawGoogleNewsItem {
  timestamp: string;      // 수집일시 (e.g. 2026-10-22 8:00)
  category?: string;      // 카테고리 (e.g. Trump Administration SI Policy & Federal Agencies)
  keywords?: string;      // 핵심 키워드
  title: string;          // 제목
  summary: string;        // 본문 요약
  imageUrl: string;       // 이미지 링크
  sourceUrl: string;      // 원문 링크
}

export const INITIAL_GOOGLE_NEWS: RawGoogleNewsItem[] = [
  {
    "timestamp": "2026-10-22 8:00",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SpaceXSI, AI Native",
    "title": "SpaceX AI 매출, SpaceXSI 사업부 영업이익 4억 3,100만 달러 달성하며 3분기 실적 견인",
    "summary": "Payload Space는 SpaceX의 전담 인공지능 사업부인 SpaceXSI가 2026년 3분기에 4억 3,100만 달러의 영업이익을 달성하며, 상업용 위성 네트워크와 자율 운영 전반에 걸친 일론 머스크의 우주·지능 수직 통합에서 결정적인 상업적 이정표를 세웠다고 보도했습니다.",
    "imageUrl": "https://payloadspace.com/wp-content/uploads/2026/10/spacex-ai-revenue.png",
    "sourceUrl": "https://payloadspace.com/spacexs-ai-revenue-leads-q3-earnings/"
  },
  {
    "timestamp": "2026-10-22 7:59",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "SI (Super Intelligence), White House SI Pact",
    "title": "미 국무부, 모든 외교 및 공식 문서에 '슈퍼 인텔리전스(SI)' 용어 사용 의무화",
    "summary": "Nextgov/FCW는 미 국무부가 행정명령 14434호를 준수하고 백악관 SI 이니셔티브의 국제적 확산을 추진하기 위해 모든 산하 국과 해외 대사관 및 외교 공관에 기존 AI 용어 대신 '슈퍼 인텔리전스(Super Intelligence)' 및 'SI'를 공식 채택하도록 지시했다고 보도했습니다.",
    "imageUrl": "https://cdn.defenseone.com/assets/nextgov/images/super-intelligence-white-house.jpg",
    "sourceUrl": "https://www.nextgov.com/artificial-intelligence/2026/10/state-department-orders-super-intelligence-wording-across-all-official-communications/416703/"
  },
  {
    "timestamp": "2026-10-22 7:58",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "트럼프 '슈퍼 인텔리전스 포스(SIF)', 첫 공식 회의 소집 및 프론티어 AI 연구소 의무 보고 규칙 제정",
    "summary": "The Next Web은 백악관 AI 차르이자 국가정보국(DNI) 국장인 제이 클레이턴이 의장을 맡은 신설 '슈퍼 인텔리전스 포스(SIF)'가 첫 집행 회의를 열고, 주요 상업용 프론티어 모델 개발사를 대상으로 연방 감독 프로토콜과 이상 징후 의무 보고 지침을 수립했다고 보도했습니다.",
    "imageUrl": "https://img-cdn.tnwcdn.com/image?url=https%3A%2F%2Fthenextweb.com%2Fwp-content%2Fblogs.dir%2F1%2Ffiles%2F2026%2F10%2Fjay-clayton-super-intelligence.jpg",
    "sourceUrl": "https://thenextweb.com/news/super-intelligence-force-charter-first-meeting-anthropic"
  },
  {
    "timestamp": "2026-10-22 7:57",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "앤드루 퍼거슨 FTC 위원장, 백악관 슈퍼 인텔리전스 포스 지침의 핵심 집행관으로 부상",
    "summary": "Punchbowl News는 연방거래위원회(FTC) 앤드루 퍼거슨 위원장이 슈퍼 인텔리전스 포스 내에서 맡은 핵심 역할을 조명하며, 트럼프 행정부의 국가 컴퓨팅 어젠다를 관철하기 위해 반독점 집행과 연산 시장 경쟁 및 규제 준수가 어떻게 활용될지 상세히 분석했습니다.",
    "imageUrl": "https://punchbowl.news/wp-content/uploads/2026/10/andrew-ferguson-ftc-ai.jpg",
    "sourceUrl": "https://punchbowl.news/article/tech/trump-ai-enforcer/"
  },
  {
    "timestamp": "2026-10-22 7:56",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Agentic AI, SI AX (System Integration AI Transformation)",
    "title": "액센츄어와 워크데이, 엔터프라이즈 에이전틱 AI 통합 가속화를 위한 전방 배치 엔지니어링 프로그램 출범",
    "summary": "액센츄어 뉴스룸은 워크데이와 공동으로 전방 배치 엔지니어링(Forward Deployed Engineering) 프로그램을 출범하여, 전문 시스템 통합(SI) 아키텍트를 포춘 500대 기업에 직접 파견해 자율 재무 및 HR 에이전틱 워크플로우를 구축·배포한다고 발표했습니다.",
    "imageUrl": "https://newsroom.accenture.com/content/1101/images/accenture-workday-agentic-ai.jpg",
    "sourceUrl": "https://newsroom.accenture.com/news/2026/accenture-and-workday-launch-forward-deployed-engineering-program-to-accelerate-enterprise-ai-adoption"
  },
  {
    "timestamp": "2026-10-22 7:55",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Agentic AI, SI AX (System Integration AI Transformation)",
    "title": "액센츄어와 델 테크놀로지스, 확장형 에이전틱 AI 인프라 구축을 위한 엔터프라이즈 동맹 확대",
    "summary": "액센츄어와 델 테크놀로지스는 하이브리드 클라우드 및 온프레미스 환경에서 보안이 보장된 프라이빗 자율 에이전트 클러스터로 전환하려는 글로벌 기업들을 위해 턴키 방식의 AI 네이티브 엔지니어링 및 시스템 통합(SI AX)을 제공하는 파트너십을 확대했습니다.",
    "imageUrl": "https://newsroom.accenture.com/content/1101/images/accenture-dell-ai-alliance.jpg",
    "sourceUrl": "https://newsroom.accenture.com/news/2026/accenture-and-dell-technologies-expand-alliance-to-help-organizations-scale-ai-adoption"
  },
  {
    "timestamp": "2026-10-22 7:54",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Agentic AI, SI AX (System Integration AI Transformation)",
    "title": "엔비디아, 유럽 공영 방송 및 글로벌 콘텐츠 파이프라인 전반에 에이전틱 보안 아키텍처 구축",
    "summary": "엔비디아 블로그는 미디어 시스템 통합(SI) 기업들이 유럽 방송 네트워크 전반에서 고처리량 라이브 스트리밍 및 콘텐츠 제작 인프라를 보호하기 위해 NVIDIA NIM 및 BlueField DPU 기반의 특화된 에이전틱 사이버보안 파이프라인을 어떻게 구축하고 있는지 상세히 소개했습니다.",
    "imageUrl": "https://blogs.nvidia.com/wp-content/uploads/2026/10/nvidia-agentic-broadcasting-security.jpg",
    "sourceUrl": "https://blogs.nvidia.com/blog/agentic-ai-european-broadcasting-security/"
  },
  {
    "timestamp": "2026-10-22 7:53",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Agentic AI, SI AX (System Integration AI Transformation)",
    "title": "워크데이 채널 리더십, 에이전틱 엔터프라이즈 전환의 핵심 엔진으로 시스템 통합(SI) 동맹 강조",
    "summary": "CRN은 글로벌 시스템 통합업체(GSI)가 레거시 ERP 데이터베이스와 차세대 자율 에이전트 오케스트레이션 계층을 연결하는 중추적 역할을 수행하고 있음을 강조한 워크데이 채널 리더십의 발표를 보도했습니다.",
    "imageUrl": "https://www.crn.com/assets/images/2026/10/workday-channel-si-alliances.jpg",
    "sourceUrl": "https://www.crn.com/news/software/2026/workday-channel-chief-on-why-partners-are-critical-to-agentic-ai-adoption"
  },
  {
    "timestamp": "2026-10-22 7:52",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "AI Czar, Super Intelligence Force (SIF)",
    "title": "백악관 AI 차르 제이 클레이턴, 슈퍼 인텔리전스 포스의 전략적 우선순위 및 연방 기관 역할 분담 공개",
    "summary": "벤턴 광대역·사회 연구소(Benton Institute)는 백악관 AI 차르 제이 클레이턴이 제시한 운영 로드맵을 조명하며, 국가 통신 인프라와 주(State) 단위 광대역 데이터 파이프라인이 슈퍼 인텔리전스 포스(SIF)의 권한 아래 어떻게 통합될지 설명했습니다.",
    "imageUrl": "https://www.benton.org/sites/default/files/styles/header_image/public/jay-clayton-sif-priorities.jpg",
    "sourceUrl": "https://www.benton.org/headlines/white-house-ai-czar-jay-clayton-details-super-intelligence-force-priorities"
  },
  {
    "timestamp": "2026-10-22 7:51",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Agentic AI, Multi-Agent Orchestration",
    "title": "파일럿에서 프로덕션까지: 엔터프라이즈 자율 분석을 위한 다중 에이전트 오케스트레이션 표준 플레이북",
    "summary": "Solutions Review는 기업이 격리된 생성형 AI 파일럿 프로젝트에서 상태 공유, 가드레일 검증, 엔터프라이즈 데이터 거버넌스를 갖춘 프로덕션급 다중 에이전트 오케스트레이션으로 전환하는 방법을 분석한 케빈 페트리의 아키텍처 가이드를 게재했습니다.",
    "imageUrl": "https://solutionsreview.com/business-intelligence/files/2026/10/multi-agent-orchestration-playbook.jpg",
    "sourceUrl": "https://solutionsreview.com/business-intelligence/from-pilot-to-production-the-enterprise-playbook-for-agentic-ai/"
  },
  {
    "timestamp": "2026-10-22 6:11",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "마이크로소프트 에이전트 프레임워크의 워크플로우 오케스트레이션: 순차 및 동시 다중 에이전트 라우팅",
    "summary": "Microsoft Learn은 엔터프라이즈 아키텍트가 결정론적 핸드오프와 병렬 작업 실행을 통해 순차적, 동시적, 계층적 다중 에이전트 토폴로지를 체이닝할 수 있도록 지원하는 Microsoft Agent Framework의 기술 사양을 공개했습니다.",
    "imageUrl": "https://learn.microsoft.com/en-us/media/open-graph-image.png",
    "sourceUrl": "https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/orchestrations/"
  },
  {
    "timestamp": "2026-10-22 6:10",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "아마존 베드록 AgentCore: 2026년 AWS 엔터프라이즈 에이전틱 AI 전략을 이끄는 핵심 인프라 계층",
    "summary": "AWS Builder는 미션 크리티컬 엔터프라이즈 시스템 통합을 위해 장기 실행 에이전트 메모리, 엔터프라이즈 IAM 권한 격리, 고속 에이전트 간 메시지 라우팅을 제공하는 Amazon Bedrock AgentCore의 아키텍처 역량을 상세히 소개했습니다.",
    "imageUrl": "https://d2908q01vomqb2.cloudfront.net/f1f836cb4ea6efb2a0b1b99f41ad8b103eff4b59/2026/10/bedrock-agentcore-aws.png",
    "sourceUrl": "https://builder.aws.com/content/2x8K9mLpQrStUvWxYz/amazon-bedrock-agentcore-enterprise-agentic-ai"
  },
  {
    "timestamp": "2026-10-22 6:09",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "AWS 다중 에이전트 오케스트레이션 가이드: 엔터프라이즈 시스템 통합을 위한 프로덕션 프레임워크",
    "summary": "AWS 솔루션 라이브러리는 감독자 에이전트(Supervisor Agent), Amazon EventBridge, 서버리스 상태 머신을 활용해 복잡한 다중 부서 엔터프라이즈 워크플로우를 조율하는 검증된 다중 에이전트 시스템 구축 아키텍처 가이드를 발표했습니다.",
    "imageUrl": "https://d1.awsstatic.com/architecture-diagrams/ArchitectureDiagrams/multi-agent-orchestration-on-aws.png",
    "sourceUrl": "https://aws.amazon.com/solutions/guidance/multi-agent-orchestration-on-aws/"
  },
  {
    "timestamp": "2026-10-22 6:08",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "Bedrock AgentCore를 활용한 AWS 노코드 다중 에이전트 AI 오케스트레이션 구축 가이드",
    "summary": "AWS Solutions는 현업 비즈니스 분석가와 SI 컨설턴트가 엔터프라이즈 API 및 사내 데이터 레이크에 직접 연결된 협업형 에이전트 스웜을 시각적으로 조립할 수 있는 노코드 다중 에이전트 오케스트레이션 레퍼런스 블루프린트를 제공합니다.",
    "imageUrl": "https://d1.awsstatic.com/architecture-diagrams/ArchitectureDiagrams/no-code-multi-agent-aws.png",
    "sourceUrl": "https://aws.amazon.com/solutions/guidance/no-code-multi-agent-ai-orchestration-on-aws/"
  },
  {
    "timestamp": "2026-10-22 6:07",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "구글 클라우드 에이전트 개발자 새 소식: 서브 에이전트 동적 생성 및 병렬 다중 에이전트 오케스트레이션",
    "summary": "구글 클라우드 블로그는 기본 에이전트가 런타임에 특화된 서브 에이전트를 동적으로 생성하고, 병렬 추론 스레드를 관리하며, Vertex AI 전반에서 구조화된 JSON 출력을 취합할 수 있는 새로운 개발자 기능을 소개했습니다.",
    "imageUrl": "https://storage.googleapis.com/gweb-cloudblog-publish/images/google-cloud-agent-developers-2026.max-1000x1000.jpg",
    "sourceUrl": "https://cloud.google.com/blog/products/ai-machine-learning/news-for-agent-developers-on-google-cloud"
  },
  {
    "timestamp": "2026-10-22 6:06",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, SI AX (System Integration AI Transformation)",
    "title": "Google Cloud Next 2026 하이라이트: 제미나이 엔터프라이즈 에이전트 및 다중 에이전트 시스템 통합",
    "summary": "월드와이드테크놀로지(WWT)는 Google Cloud Next의 핵심 발표를 요약하며, 기업들이 Agent2Agent(A2A) 상호운용성 프로토콜을 통해 이기종 SaaS 환경 전반에서 제미나이 기반 에이전트들을 어떻게 통합하고 있는지 시연했습니다.",
    "imageUrl": "https://www.wwt.com/assets/images/articles/google-cloud-next-2026-multi-agent.jpg",
    "sourceUrl": "https://www.wwt.com/article/google-cloud-next-highlights-gemini-enterprise-and-multi-agent-systems"
  },
  {
    "timestamp": "2026-10-22 6:05",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "구글 클라우드 엔터프라이즈 AI: 에이전트 개발 키트(ADK) 블루프린트를 활용한 프로덕션 다중 에이전트 시스템",
    "summary": "Bicara IT는 구글 클라우드 ADK를 활용한 프로덕션 엔지니어링 패턴을 분석하며, 대규모 시스템 통합 프로젝트에서 결정론적 라우팅, 폴백 복구, 실시간 관측성(Observability)을 구현하는 방법을 제시했습니다.",
    "imageUrl": "https://bicarait.com/wp-content/uploads/2026/10/google-cloud-adk-multi-agent.png",
    "sourceUrl": "https://bicarait.com/blog/google-cloud-enterprise-ai-production-multi-agent-systems-with-adk"
  },
  {
    "timestamp": "2026-10-22 6:04",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "2026년 최고의 AI 에이전트 오케스트레이션 플랫폼: Amazon Bedrock, Azure AI, Vertex AI 전격 비교",
    "summary": "DevTools Academy는 3대 클라우드 에이전트 오케스트레이션 플랫폼을 비교 분석하여, 다중 에이전트 상태 관리, 지연 시간 오버헤드, MCP 도구 연동 및 엔터프라이즈 SI 배포 비용 측면에서 각 플랫폼을 평가했습니다.",
    "imageUrl": "https://www.devtoolsacademy.com/images/blog/agent-orchestration-comparison-2026.png",
    "sourceUrl": "https://www.devtoolsacademy.com/blog/best-ai-agent-orchestration-platforms/"
  },
  {
    "timestamp": "2026-10-22 6:03",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "엔터프라이즈 확장을 위해 아마존 베드록에 네이티브 다중 에이전트 오케스트레이션 프레임워크가 필요한 이유",
    "summary": "AWS Builder는 엔터프라이즈 워크플로우가 수십 개의 자율 서브 에이전트로 확장될 때 커스텀 글루 코드(Glue Code)를 대체하기 위해 왜 네이티브 고수준 오케스트레이션 프리미티브가 필수적인지 다루는 엔지니어링 분석을 게재했습니다.",
    "imageUrl": "https://d2908q01vomqb2.cloudfront.net/f1f836cb4ea6efb2a0b1b99f41ad8b103eff4b59/2026/10/native-multi-agent-bedrock.png",
    "sourceUrl": "https://builder.aws.com/content/2y9L0nMqRsTuVwXyZa/why-amazon-bedrock-needs-native-multi-agent-orchestration"
  },
  {
    "timestamp": "2026-10-22 6:02",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, AI Native",
    "title": "Cloud Run으로 엔터프라이즈 AI 가속화: 컨테이너 기반 다중 에이전트 오케스트레이션 및 오토스케일링",
    "summary": "Google Cloud OnAir는 엔지니어링 팀이 온디맨드 GPU 오토스케일링을 지원하는 상태 비저장(Stateless) Cloud Run 컨테이너에 다중 에이전트 AI 마이크로서비스를 패키징하고 배포하는 방법을 다루는 기술 브리핑을 진행했습니다.",
    "imageUrl": "https://cloudonair.withgoogle.com/assets/events/cloud-run-enterprise-ai-2026.jpg",
    "sourceUrl": "https://cloudonair.withgoogle.com/events/accelerate-enterprise-ai-cloud-run"
  }
];

/**
 * URL에서 도메인 추출 (e.g. https://www.nytimes.com/... -> nytimes.com)
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'news.google.com';
  }
}

/**
 * 다양한 날짜/시간 문자열(YYYY-MM-DD H:mm, YYYY-MM-DD HH:mm:ss, ISO 등)을 안전하게 Unix timestamp(ms)로 파싱
 * - 1자리 시간(예: "2026-10-22 8:00", "2026-10-22 7:59")도 NaN 없이 100% 일관되게 KST(UTC+9) 기준으로 파싱
 */
function parseTimestampSafe(raw: string, fallbackIdx: number): number {
  if (!raw || !raw.trim()) {
    return Date.now() - (fallbackIdx + 1) * 1000 * 60 * 30;
  }
  const clean = raw.trim();

  // 1. YYYY-M-D H:m(:s) 형식 정규식 매칭 (1자리/2자리 월·일·시·분·초 완벽 지원, KST UTC+9 기준 고정 변환)
  const m = clean.match(
    /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
  );
  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const day = parseInt(m[3], 10);
    const hour = m[4] !== undefined ? parseInt(m[4], 10) : 0;
    const min = m[5] !== undefined ? parseInt(m[5], 10) : 0;
    const sec = m[6] !== undefined ? parseInt(m[6], 10) : 0;
    return Date.UTC(year, month - 1, day, hour, min, sec) - 9 * 60 * 60 * 1000;
  }

  // 2. 이미 'Z'나 '+', '-' 등 타임존 오프셋이 있는 경우
  if (/Z|[+-]\d{2}(?::?\d{2})?$/i.test(clean)) {
    const parsed = Date.parse(clean);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  const parsed = Date.parse(clean);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  return Date.now() - (fallbackIdx + 1) * 1000 * 60 * 30;
}

import { resolveAccurateNewsImage, extractFirstValidImageUrl } from '../lib/reddit/googleNewsImageResolver';

/**
 * RawGoogleNewsItem을 정규 RedditPost 모델로 변환 (구글 시트 이미지 링크 100% 일치 적용)
 */
export function convertGoogleNewsToRedditPost(
  item: RawGoogleNewsItem,
  idx: number,
  urlUsageMap?: Map<string, number>
): RedditPost {
  const domain = extractDomain(item.sourceUrl);

  // 타임스탬프 파싱 (최신순 정렬의 기준)
  const createdAt = parseTimestampSafe(item.timestamp, idx);
  const id = `gnews_${createdAt}_${idx}`;

  // 구글 시트 원본 이미지 링크 100% 일치 최우선 적용
  const sheetImage = extractFirstValidImageUrl(item.imageUrl);
  const accurateImageUrl = sheetImage || resolveAccurateNewsImage(item, idx, urlUsageMap || new Map());

  // 카테고리 태그 뱃지 매핑
  const flairText = item.category
    ? item.category.length > 25
      ? item.category.slice(0, 24) + '…'
      : item.category
    : '구글뉴스 / Breaking';

  return {
    id,
    subreddit: 'news',
    subredditIcon: 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png',
    title: item.title,
    originalTitle: item.title,
    body: item.summary,
    originalBody: item.summary,
    author: `GoogleNews_${domain.split('.')[0] || 'Bot'}`,
    authorAvatar: 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png',
    createdAt,
    score: Math.max(120, 8400 - idx * 35),
    commentCount: Math.max(12, 320 - idx * 4),
    flair: { text: flairText, bgColor: '#DC2626', textColor: '#FFFFFF' },
    isOriginalContent: false,
    upvoteRatio: 0.94,
    media: accurateImageUrl
      ? {
          type: 'image',
          url: accurateImageUrl,
          domain,
        }
      : {
          type: 'link',
          url: item.sourceUrl,
          domain,
        },
    permalink: `/r/news/comments/${id}`,
    sourceUrl: item.sourceUrl,
  };
}
