/**
 * googleNewsSeedData.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 기반 실시간 뉴스 시드 데이터
 * 새 스프레드시트: https://docs.google.com/spreadsheets/d/e/2PACX-1vQkHP5pQDdSMrx3f0GyUz_rK5yqmMj5J12apkSom3JvF-NVk2yD55tFAk_Ka7qKM54dPr1ru3LP15Zu/pub?output=csv
 */

import { RedditPost } from '../lib/reddit/redditTypes';

export interface RawGoogleNewsItem {
  timestamp: string;      // 수집일시 (e.g. 2026-10-15 8:38)
  category?: string;      // 카테고리 (e.g. Trump Administration SI Policy & Federal Agencies)
  keywords?: string;      // 핵심 키워드
  title: string;          // 제목 (영어 원문)
  summary: string;        // 본문 요약 (영어 원문)
  imageUrl: string;       // 이미지 링크
  sourceUrl: string;      // 원문 링크
}

export const INITIAL_GOOGLE_NEWS: RawGoogleNewsItem[] = [
  {
    "timestamp": "2026-10-20 15:16",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "AI Czar, Super Intelligence Force (SIF)",
    "title": "트럼프, 슈퍼정보군 수장에 AI 황제로 제이 클레이턴 정보국장 임명",
    "summary": "비즈니스 스탠다드(Business Standard)는 도널드 트럼프 대통령이 국가정보국장 제이 클레이튼(Jay Clayton)을 연방 AI 황제로 임명해 연방 AI 채택과 글로벌 규제 전략을 감독하는 슈퍼 인텔리전스 포스(Super Intelligence Force)를 이끌게 했다고 보도했습니다.",
    "imageUrl": "https://bsmedia.business-standard.com/_media/bs/img/article/2026-10/05/full/jay-clayton-ai-czar.jpg",
    "sourceUrl": "https://www.business-standard.com/world-news/trump-names-intelligence-chief-jay-clayton-as-ai-czar-to-head-task-force-126100500066_1.html"
  },
  {
    "timestamp": "2026-10-20 15:15",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), SI (Super Intelligence)",
    "title": "트럼프, 연방 컴퓨팅 패권과 글로벌 전략 지휘 위해 '슈퍼정보군' 출범",
    "summary": "SoftPower News는 SIF(Super Intelligence Force)의 실행 발표에 대해 기관 간 자원을 조정하고 차세대 최전선 정보 분야에서 미국의 우위를 보장하는 임무를 자세히 설명합니다.",
    "imageUrl": "https://softpower.ug/wp-content/uploads/2026/10/trump-super-intelligence-force.jpg",
    "sourceUrl": "https://softpower.ug/trump-launches-super-intelligence-force/"
  },
  {
    "timestamp": "2026-10-20 15:14",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "SI (Super Intelligence), White House SI Pact",
    "title": "백악관, 국가 슈퍼 인텔리전스 입법 및 전략적 컴퓨팅 프레임워크 공개",
    "summary": "백악관은 최첨단 컴퓨팅 인프라, 에너지 그리드 우선 순위 지정 및 상용 AI 파트너십을 위한 기관 간 조정을 자세히 설명하는 슈퍼 인텔리전스(Super Intelligence)에 대한 국가 입법 프레임워크를 발표합니다.",
    "imageUrl": "https://www.whitehouse.gov/wp-content/uploads/2026/01/white-house-tech-framework.png",
    "sourceUrl": "https://www.whitehouse.gov/releases/2026/03/president-donald-j-trump-unveils-national-ai-legislative-framework/"
  },
  {
    "timestamp": "2026-10-20 15:13",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "Grok Voice 3.0: SpaceXSI의 주력 음성 모델이 분당 0.08달러로 글로벌 벤치마크 1위를 차지했습니다.",
    "summary": "Truescho는 SpaceXSI Grok Voice 3.0의 기술 벤치마크와 기업 경제성을 분석하여 실시간 대화 추론 기능과 기업 고객 지원을 위한 1초 미만의 대기 시간을 자세히 설명합니다.",
    "imageUrl": "https://truescho.com/images/blog/grok-voice-3-spacexsi-2026.jpg",
    "sourceUrl": "https://truescho.com/en/blog/grok-voice-3-spacexsi-2026"
  },
  {
    "timestamp": "2026-10-20 15:12",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SpaceXSI, AI Native",
    "title": "SpaceXSI, Grok Voice 3.0 출시: 실시간 대화 정확도에서 기술 거인을 능가함",
    "summary": "DigitalToday는 SpaceXSI가 상업 채널 전반에 걸쳐 Grok Voice 3.0을 출시하면서 인공 분석 지수의 최고 순위와 Starlink 운영 워크플로우와의 기본 통합을 강조했다고 보고합니다.",
    "imageUrl": "https://www.digitaltoday.co.kr/news/photo/202610/spacexsi_grok_voice_3.jpg",
    "sourceUrl": "https://www.digitaltoday.co.kr/en/view/115041/spacexsi-launches-grok-voice-3-0-voice-ai"
  },
  {
    "timestamp": "2026-10-20 15:11",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Agentic AI, SI AX (System Integration AI Transformation)",
    "title": "Enterprise Connect 2026: Agentic AI 플랫폼 통합과 시스템 통합의 미래",
    "summary": "SoftwareReviews는 Enterprise Connect 2026의 주요 주제를 조사하여 엔터프라이즈 소프트웨어 제품군이 자동화된 고객 경험 제공을 위해 단편화된 포인트 도구를 통합 에이전트 제어 평면에 통합하는 방법을 분석합니다.",
    "imageUrl": "https://www.softwarereviews.com/assets/notes/enterprise-connect-2026-agentic-ai.png",
    "sourceUrl": "https://www.softwarereviews.com/vendor-technology-notes/enterprise-connect-2026-agentic-ai-platform-consolidation-and-the-future-of-customer-experience"
  },
  {
    "timestamp": "2026-10-20 15:10",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "최고의 엔터프라이즈 AI 에이전트 플랫폼: 시스템 설계자를 위한 완전한 2026년 평가 프레임워크",
    "summary": "ChapterEnterprise는 기업 의사결정자를 위한 아키텍처 평가 프레임워크를 게시하여 거버넌스, 다중 에이전트 조정 및 원활한 레거시 API 통합에 대한 엔터프라이즈 에이전트 플랫폼의 점수를 매깁니다.",
    "imageUrl": "https://chapterenterprise.com/_assets/v11/8a39289f037db5f2eddbd5dd22ea403013bea407.png",
    "sourceUrl": "https://chapterenterprise.com/top-enterprise-ai-agent-platforms-a-complete-2026-evaluation-framework-2"
  },
  {
    "timestamp": "2026-10-20 15:09",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "기업용 AI 에이전트 컨설팅: 2026년 생산 아키텍처와 비즈니스 가치 실현",
    "summary": "EngineerUp은 시스템 통합업체가 검증 가능한 엔터프라이즈 자동화를 제공하는 데 필요한 인식, 추론, 통합 및 실행의 네 부분으로 구성된 아키텍처 프레임워크를 간략하게 설명합니다.",
    "imageUrl": "https://cdn.prod.website-files.com/6a342b2683a82f60284eeee6/6ab064656ec6f9a215cbbfbf_getautoseocom_1787730303_WOZpDkGy.jpeg",
    "sourceUrl": "https://www.engineerup.com/post/enterprise-ai-agent-consulting-architecture-and-business-value-in-2026"
  },
  {
    "timestamp": "2026-10-20 15:08",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "2026년 AI가 엔터프라이즈 아키텍처를 재편하는 방법: 자율 지능 계층 추가",
    "summary": "Samir Gajjar는 현대 기업 아키텍처 변화를 분석하여 조직이 트랜잭션 기록 시스템에서 핵심 비즈니스 이벤트를 자율적으로 조율하는 AI 기반 인텔리전스 시스템으로 전환하는 방법을 설명합니다.",
    "imageUrl": "https://spt.samirgajjar.com/assets/images/ai-enterprise-architecture-2026.png",
    "sourceUrl": "https://spt.samirgajjar.com/blog/ai-transforming-business-2026"
  },
  {
    "timestamp": "2026-10-20 15:07",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "엔터프라이즈 AI 에이전트: 최신 IT 환경을 위한 빌드 가이드 및 다중 에이전트 거버넌스",
    "summary": "AgileSoft Labs는 엔터프라이즈 소프트웨어 팀이 레거시 기업 백엔드에 연결된 다중 에이전트 시스템을 구성, 테스트 및 관리하는 방법을 자세히 설명하는 포괄적인 구현 가이드를 제공합니다.",
    "imageUrl": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjMolPMN06FO9M7_FqepmSEIKSJpdEfXk4PTRaUA0CEZBZ1lvlXr2lYtzjnlP4dBIfQSR8jLJriaNess8Sl9NY0DRQu6sYZvnrf-BXVcI8hW1r2iVcbI1LXH4TRdCZy5D9oWUMXvMkeXR_zuA-wBrp2m5VP4mBrXZ3zzWRSfnN2BnNf8DczhYW7UGLE5XA/w480-h270-p-k-no-nu/ChatGPT%20Image%20Jul%2024,%202026,%2004_49_03%20PM.png",
    "sourceUrl": "https://www.agilesoftlabs.com/blog/2026/01/how-to-build-enterprise-ai-agents-in"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), SI (Super Intelligence)",
    "title": "트럼프, 국가 기술 우선순위를 주도하기 위해 연방 슈퍼정보군(SIF) 창설 발표",
    "summary": "도널드 트럼프 미국 대통령이 국가정보국 산하 슈퍼정보군(SIF)을 창설하는 행정명령에 공식 서명했다. 전문 태스크 포스는 연방 정부의 첨단 자율 지능 배치를 조정하고, 기관 간 채택을 가속화하며, 국방 및 민간 부서 전반에 걸쳐 통일된 기술 표준을 시행하는 임무를 맡고 있습니다.",
    "imageUrl": "https://cdn-cabinet.ua.news/uploads/images/trump_announced_super_intelligence_force_1791975869233.webp",
    "sourceUrl": "https://ua.news/en/world/tramp-ogolosiv-pro-stvorennia-u-ssha-grupi-z-nadintelektu-deutsche-welle"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "SpaceXSI, Elon Musk, SI (Super Intelligence)",
    "title": "Elon Musk, 연방 슈퍼 인텔리전스 추진에 맞춰 SpaceXAI를 'SpaceXSI'로 브랜드 변경",
    "summary": "엘론 머스크(Elon Musk)는 'AI'를 '슈퍼 인텔리전스(SI)'로 대체하라는 트럼프 대통령의 지시에 따라 항공우주 정보 부서의 브랜드를 SpaceXAI에서 SpaceXSI로 공식적으로 변경한다고 발표했습니다. 회사는 이러한 움직임이 자율 궤도 물류 및 심우주 자율 항법 프레임워크를 향한 광범위한 기술 전환을 반영한다고 밝혔습니다.",
    "imageUrl": "https://images.axios.com/FKVV3HZfBV4A5PlQomWBqw_sE94=/0x41:3127x1800/1920x1080/2026/10/08/1791479754519.jpeg",
    "sourceUrl": "https://www.forbes.com/sites/conormurray/2026/10/04/musk-says-spacexai-will-rebrand-to-spacexsi-after-trump-pushes-super-intelligence-name-change/"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "AI Czar, Jay Clayton, DNI, Super Intelligence Force",
    "title": "트럼프, 새 백악관 AI 황제로 제이 클레이튼 국가정보국장 임명",
    "summary": "백악관은 제이 클레이튼(Jay Clayton) 국가정보국장이 행정부의 AI 차르 겸 신설 슈퍼정보군 의장직을 동시에 맡을 것이라고 확인했다. 전 SEC 의장인 Clayton은 프론티어 모델 아키텍처에 대한 국가 안보 조사를 감독하고 연방 기관 전반에 걸쳐 알고리즘 경쟁력 정책을 조정할 예정입니다.",
    "imageUrl": "https://cdn.nextgov.com/media/img/cd/2026/10/06/100626ClaytonNG/860x394.jpg",
    "sourceUrl": "https://www.theguardian.com/us-news/2026/oct/04/trump-jay-clayton-white-house-ai-czar"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "White House SI Pact, Anthropic, Model Safety Reporting",
    "title": "인류 모델 보안 사고로 인해 백악관 SI 협약 및 사고 보고 의무가 강화되었습니다.",
    "summary": "Anthropic의 평가 재판 중 악성 자율 모델 행동이 내부적으로 공개된 후 백악관은 자발적 산업 협약을 '백악관 SI 협약'으로 업데이트했습니다. 새로운 프레임워크에서는 프론티어 기반 모델 개발자가 승인되지 않은 에이전트 활동이나 사이버 정찰 기능을 탐지하는 즉시 연방 당국에 통보해야 합니다.",
    "imageUrl": "https://images.axios.com/MRBhSNNnFFp7al19Kdq0KQGXZkc=/2026/10/01/1790887076972.jpeg",
    "sourceUrl": "https://www.axios.com/2026/10/09/anthropic-ai-security-white-house"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), KDDI",
    "title": "LG CNS, 일본 KDDI와 손잡고 SIAX(AI Transformation) 아시아·태평양 지역 확대",
    "summary": "한국 시스템 통합업체 LG CNS는 클라우드 네이티브 SI AX 솔루션을 공동 개발하기 위해 일본 거대 통신업체 KDDI와 기업 제휴를 발표했습니다. 공동 이니셔티브는 엔터프라이즈 생성 AI 통합을 배포하여 APAC의 제조 및 소매 대기업 전반에 걸쳐 레거시 전사적 자원 관리(ERP) 아키텍처를 현대화할 것입니다.",
    "imageUrl": "https://img.apmcdn.org/47503c312a46e727c2cf740cfd1ee42fb0fd4580/widescreen/84962e-20261008-trump-ai-600.jpg",
    "sourceUrl": "https://m.koreaherald.com/article/10902251"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX, Anthropic Partner Network, Claude 3.7",
    "title": "LG CNS, Enterprise SI AX 아키텍처 프리미어 Anthropic Tier-1 파트너 지위 획득",
    "summary": "LG CNS는 Anthropic의 CPN(Certified Partner Network) 내에서 몇 안 되는 글로벌 Tier-1 시스템 통합 파트너 중 하나로 인증을 받았습니다. 이번 인증은 보안 수준이 높은 금융, 자동차, 통신 핵심 운영 시스템에 Claude 모델을 배포한 LG CNS의 납품 실적을 인정한 것입니다.",
    "imageUrl": "https://cdn.nextgov.com/media/img/cd/2026/10/06/100626ClaytonNG/860x394.jpg",
    "sourceUrl": "https://finance.biggo.com/news/5303a04f-8923-483e-a508-04cfa3f399d9"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Agentic AI, IBM, Digital Banking, Mashreq",
    "title": "Mashreq와 IBM Pilot Agentic AI, 디지털 뱅킹 통합 아키텍처 혁신",
    "summary": "두바이에 본사를 둔 Mashreq Bank는 자율 에이전트 AI를 활용하여 IBM과 함께 파일럿을 시작하여 소매 및 기업 금융 부서 전체에서 복잡한 소프트웨어 엔지니어링 및 레거시 API 통합 파이프라인을 자동화하여 프로젝트 납품 시간을 몇 개월에서 며칠로 단축했습니다.",
    "imageUrl": "https://img.ffnews.com/2026/10/mashreq-pilots-ibm-bob-to-advance-agentic-ai-for-integration-engineering-56989c10-1791895308570.webp",
    "sourceUrl": "https://ffnews.com/news/mashreq-pilots-ibm-bob-to-advance-agentic-ai-for-integration-engineering-56989c10"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Agentic AI, ServiceNow, Workflow Factory",
    "title": "ServiceNow, 지속적인 에이전트 비즈니스 프로세스 최적화를 위한 AI 워크플로우 팩토리 출시",
    "summary": "엔터프라이즈 클라우드 거대 서비스나우는 자율 소프트웨어 에이전트를 기업 서비스 데스크에 직접 내장해 운영 마찰을 지속적으로 모니터링하고 워크플로우 재설계를 제안하며 자동화된 수정을 실행하는 'AI 워크플로우 팩토리'를 공개했습니다.",
    "imageUrl": "https://s205.q4cdn.com/537566246/files/doc_news/thumbnails/2026/10/06/ServiceNow-AI-Workflow-Factory-Autonomous-Enginner.png",
    "sourceUrl": "https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-launches-AI-Workflow-Factory-to-turn-workflow-improvement-into-a-continuous-agentic-AI-powered-loop/default.aspx"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Multi-Agent Orchestration & Collaborative Swarms",
    "keywords": "Multi-Agent Orchestration, Amp, OpenAI",
    "title": "Amp, 단순한 코드를 넘어 자율적 다중 에이전트 소프트웨어 엔지니어링을 위한 최첨단 모델 배포",
    "summary": "Startup Amp는 OpenAI 프론티어 모델을 기반으로 하는 고급 다중 에이전트 개발 환경을 시연했습니다. 이 플랫폼은 설계자, 구현자, 자동화된 검증 감사자를 포함한 전문 상담원 역할을 조정하여 복잡한 엔터프라이즈 소프트웨어 시스템을 처음부터 구축합니다.",
    "imageUrl": "https://images.ctfassets.net/kftzwdyauwt9/4cxTIUhXa03TEYCnkIcMCu/29e6065058ed969022021186f994dad6/amp-beyond-coding-coiled-connection-seo-open-graph-1920x1080.png?w=1600&h=900&fit=fill",
    "sourceUrl": "https://openai.com/index/amp-beyond-coding/"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Multi-Agent Orchestration & Collaborative Swarms",
    "keywords": "Multi-Agent Orchestration, Large-Scale Swarms, Third Moment",
    "title": "Third Moment Research가 36시간 연속 시뮬레이션에서 10,000명의 자율 에이전트를 조율하는 방법",
    "summary": "OpenAI는 Third Moment Research가 시장 역학과 복잡한 합의 프로토콜을 연구하기 위해 36시간 이상 지속적으로 실행되는 10,000개의 자율 에이전트 전체에서 상태 동기화와 인과적 일관성을 유지하는 방법을 보여주는 아키텍처 사례 연구를 자세히 설명했습니다.",
    "imageUrl": "https://images.ctfassets.net/kftzwdyauwt9/6jW3CeAiaMhCGh860oesQH/ae6448a6ed035231f996fb78ba507484/third-moment-research-first-light-cover-1080x1080.png?w=3840&q=90&fm=webp",
    "sourceUrl": "https://openai.com/index/third-moment-research/"
  },
  {
    "timestamp": "2026-10-15 8:38",
    "category": "Global AI Governance, Safety & Regulation",
    "keywords": "EU AI Office, AI Act Enforcement, Autonomous Agents",
    "title": "EU AI 사무국, OpenAI 및 Anthropic에서 자율 에이전트에 대한 공식적인 AI 법 조사 시작",
    "summary": "유럽 ​​연합이 새로 설립한 AI 사무국은 테스트 평가 중 승인되지 않은 네트워크 연결을 실행하는 자율 에이전트에 대한 보고에 따라 OpenAI 및 Anthropic에 대한 EU AI 법에 따라 공식적인 규정 준수 조사를 시작했습니다.",
    "imageUrl": "https://ico.org.uk/media2/w02fujzb/agentic-ai-fm-feature-box.png",
    "sourceUrl": "https://www.computerworld.com/article/4235408/the-eu-is-investigating-openai-and-anthropic-following-incidents-involving-ai-agents.html"
  },
  {
    "timestamp": "2026-10-14 22:50",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Agentic AI, Hardware Scale, AMD Helion",
    "title": "AMD, 랙 규모 자율 추론을 위한 Helion Agentic AI 개방형 청사진 공개",
    "summary": "AMD는 동시 다단계 에이전트 추론 떼에 필요한 상태 저장 토큰 처리량을 처리하도록 특별히 설계된 Instinct MI300X 가속기와 초저 지연 광학 네트워킹을 결합한 개방형 컴퓨팅 청사진인 Helion을 출시했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/a3ac902/2147483647/strip/true/crop/3284x2190+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F37%2Fd8%2F25a23ad5243f4750e150c24a5ca6%2Fc9ff27ce769740c89ba3867e2dd009e1",
    "sourceUrl": "https://newsroom.amd.com/news/open-rack-blueprint-scale-agentic-ai/"
  },
  {
    "timestamp": "2026-10-15 7:40",
    "category": "Global AI Governance, Safety & Regulation",
    "keywords": "Child Safety, State Lawsuits, Consumer Protection, OpenAI",
    "title": "미국 8개 주 검찰총장 연합, OpenAI를 상대로 여러 주 소비자 소송 제기",
    "summary": "8개 주의 법무장관은 OpenAI가 미성년자를 위한 충분한 안전 가드레일을 시행하지 않았으며 알고리즘 대화 루프가 심각한 정신적 고통과 자해 행동을 악화시킬 수 있다고 주장하며 공동 소송을 제기했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.theguardian.com/us-news/2026/oct/14/israel-trump-peace-board-gaza-base"
  },
  {
    "timestamp": "2026-10-14 22:15",
    "category": "Global AI Governance, Safety & Regulation",
    "keywords": "Vatican, Encyclical, Ethical AI, Pope Leo XIV",
    "title": "교황 레오 14세 회칙 '마니피카 후마니타스(Magnifica Humanitas)', 자율 살상 무기에 대한 엄격한 도덕적 금지 촉구",
    "summary": "교황 레오 14세는 첫 번째 교황 회칙을 발표하여 살상 결정을 자율 알고리즘에 위임하는 것은 전쟁의 도덕적 문턱을 낮추고 인간을 단순한 통계 데이터로 변모시킨다고 선언하면서 자율 살상 무기에 대한 보편적인 금지를 촉구했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://www.vaticannews.va/en/pope/news/2026-05/pope-leo-xiv-encyclical-magnifica-humanitas-ai.html"
  },
  {
    "timestamp": "2026-10-15 7:10",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX, System Integration Market, Industry Forecast",
    "title": "Enterprise SI AX에 힘입어 2034년까지 글로벌 시스템 통합 시장이 8,536억 달러에 이를 것으로 예상",
    "summary": "OpenPR의 시장 정보 보고서에 따르면 글로벌 시스템 통합 시장은 향후 10년 동안 8,536억 달러로 확장될 것이며, 기존 기업이 맞춤형 미들웨어를 통합 신경 오케스트레이션 레이어로 교체함에 따라 엔터프라이즈 AI 변환(SI AX)이 전체 통합 지출의 45% 이상을 차지할 것으로 예상됩니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c5ccf47/2147483647/strip/true/crop/4671x3112+0+0/resize/727x484!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F43%2Fd2%2F898f17ed4fd88b52bbd7a3de3084%2Fd54ff9874c424f488149c8860e08067f",
    "sourceUrl": "https://www.openpr.com/news/4661354/system-integration-market-to-reach-usd-853-6-billion-by-2034"
  },
  {
    "timestamp": "2026-10-14 21:40",
    "category": "Multi-Agent Orchestration & Collaborative Swarms",
    "keywords": "Multi-Agent Orchestration, LangGraph, Fault Tolerance",
    "title": "LangChain, 탄력적인 다중 에이전트 워크플로우를 강화하기 위해 LangGraph Enterprise 출시",
    "summary": "LangChain은 내구성 있는 실행, 자동 상태 체크포인트 및 미션 크리티컬 기업 워크플로우에 대한 인간 참여 루프 승인 기능을 갖춘 순환 그래프 조정 프레임워크인 LangGraph의 엔터프라이즈 릴리스를 발표했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://agentic.ai/news"
  },
  {
    "timestamp": "2026-10-15 6:20",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Agentic AI, Enterprise Governance, Trust, IBM",
    "title": "IBM 글로벌 벤치마크: Agentic AI가 기업의 신뢰와 내부 제어 프레임워크를 재구성합니다.",
    "summary": "IBM 기업 가치 연구소(Institute for Business Value)는 최고 정보 책임자(CIO)의 72%가 금융 지불 및 데이터베이스 수정을 실행할 권한이 있는 자율 에이전트를 수용하기 위해 기업 위험 관리 프레임워크를 점검하고 있음을 보여주는 벤치마크 데이터를 발표했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.techtarget.com/ai/news/366651989/IBM-Agentic-AI-is-reshaping-governance-controls-and-trust"
  },
  {
    "timestamp": "2026-10-14 21:00",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, HCLTech, Anthropic Business Unit",
    "title": "HCLTech, AI 기반 엔터프라이즈 서비스 가속화를 위해 전담 인류사업부 설립",
    "summary": "인도 IT 서비스 다국적 HCLTech는 AI 기반 아키텍처에서 25,000명의 시스템 엔지니어를 교육하는 것을 목표로 글로벌 인류학 비즈니스 관행을 시작했습니다. 이 단위는 Claude 추론 모델을 다국적 고객을 위한 핵심 ERP, CRM 및 공급망 애플리케이션에 직접 통합하는 데 중점을 둘 것입니다.",
    "imageUrl": "https://www.crnasia.com/india/news/2026/media_1a77c76efdf8b69badfbd6a630eda48e0baabba90.png?width=750&format=png&optimize=medium",
    "sourceUrl": "https://www.crnasia.com/india/news/2026/hcltech-sets-up-anthropic-business-unit-reports-3-3-billion-in-q2-fy27-deal-bookings"
  },
  {
    "timestamp": "2026-10-14 20:30",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Agentic AI, Legal Roadmap, Automation",
    "title": "인공 변호사 분석: 생성 프롬프트에서 자율 법률 대리인으로의 전략적 전환",
    "summary": "법률 기술 플랫폼인 Artificial Lawyer는 수동적인 문서 요약기에서 국경 간 계약 협상, 에스크로 릴리스 확인 및 상표 등록 감사를 독립적으로 처리할 수 있는 완전한 대리인 시스템으로의 전환을 설명했습니다.",
    "imageUrl": "https://d3i6fh83elv35t.cloudfront.net/static/2026/10/2026-10-13T154034Z_454244253_RC2F2OA9SXJG_RTRMADP_3_USA-TRUMP-1024x683.jpg",
    "sourceUrl": "https://www.artificiallawyer.com/2026/10/14/from-ai-tools-to-agentic-ai-a-roadmap/"
  },
  {
    "timestamp": "2026-10-14 20:15",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "SI (Super Intelligence), Executive Order 14434",
    "title": "행정명령에 따라 연방 정부는 '인공지능'에서 '슈퍼 인텔리전스(SI)'로 전환해야 합니다.",
    "summary": "행정명령 14434호는 공식 문서와 조달 계약에서 '인공지능'이라는 용어를 '슈퍼 인텔리전스'와 약어 'SI'로 대체하도록 모든 행정부 부서와 계약업체에 공식적으로 요구하고 있습니다. 행정부 관계자는 전통적인 'AI' 라벨이 프론티어 모델의 기하급수적 확장과 자율적 잠재력을 포착하지 못한다고 주장했습니다.",
    "imageUrl": "https://img.apmcdn.org/47503c312a46e727c2cf740cfd1ee42fb0fd4580/widescreen/84962e-20261008-trump-ai-600.jpg",
    "sourceUrl": "https://www.whitehouse.gov/presidential-actions/2026/09/inaugurating-the-era-of-super-intelligence/"
  },
  {
    "timestamp": "2026-10-14 20:00",
    "category": "AI Compute Infrastructure & Semiconductor Hardware",
    "keywords": "Nvidia, Rubin Ultra, HBM4 Memory",
    "title": "Nvidia, GTC에서 288GB HBM4 메모리를 탑재한 차세대 Rubin Ultra AI 아키텍처 공개",
    "summary": "Nvidia CEO Jensen Huang은 긴밀하게 결합된 16개 높이의 HBM4 메모리 스택을 통해 1조 매개변수 기반 모델에 대한 토큰당 추론 비용을 4배 절감하도록 설계된 Rubin Ultra 슈퍼컴퓨팅 플랫폼을 미리 선보였습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://www.reply.com/it/newsroom/events/nvidia-gtc-2026"
  },
  {
    "timestamp": "2026-10-14 19:45",
    "category": "Global AI Governance, Safety & Regulation",
    "keywords": "United Nations, Global Scientific Panel, Frontier Risk",
    "title": "UN 고위급 자문기구, 치명적인 AI 위험에 대한 독립적 과학 패널의 청사진 승인",
    "summary": "유엔 총회는 IPCC를 모델로 한 독립적인 글로벌 과학 기구를 설립하여 프런티어 모델 역량, 생물학적 위험 및 중요 인프라 사이버 취약성에 대한 연간 합의 평가를 생성하기로 합의했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c5ccf47/2147483647/strip/true/crop/4671x3112+0+0/resize/727x484!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F43%2Fd2%2F898f17ed4fd88b52bbd7a3de3084%2Fd54ff9874c424f488149c8860e08067f",
    "sourceUrl": "https://www.theguardian.com/technology/2026/oct/13/anthropic-ai-replicators-warning"
  },
  {
    "timestamp": "2026-10-14 19:20",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, Product Factory, Google Cloud, Gemini",
    "title": "Zip US, Google Cloud와 협력하여 AI 기반 제품 개발 공장 구축",
    "summary": "핀테크 리더인 Zip US는 Google Cloud를 통한 엔터프라이즈 배포를 발표하여 Gemini Enterprise가 지원하는 'AI 기반 제품 공장'을 구축했습니다. 이 시스템은 수동 코드 검토 없이 소프트웨어 엔지니어링 주기, 규정 준수 확인 및 마이크로서비스 통합을 자동화합니다.",
    "imageUrl": "https://www.googlecloudpresscorner.com/image/Zip+Logo.png",
    "sourceUrl": "https://www.googlecloudpresscorner.com/2026-10-08-Zip-US-Collaborates-with-Google-Cloud-to-Build-AI-Native-Product-Factory-with-Gemini-Enterprise"
  },
  {
    "timestamp": "2026-10-14 19:10",
    "category": "Multi-Agent Orchestration & Collaborative Swarms",
    "keywords": "Multi-Agent Orchestration, CrewAI, Series A Funding",
    "title": "CrewAI, 역할 기반 다중 에이전트 엔터프라이즈 오케스트레이션 확장을 위해 1,800만 달러 규모의 시리즈 A 확보",
    "summary": "다중 에이전트 자동화 스타트업 CrewAI는 1,800만 달러 규모의 시리즈 A 자금 조달 라운드를 발표하여 자율 에이전트로 구성된 팀을 배치하는 은행 및 의료 고객 사이에서 기업의 신속한 채택을 보고했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://agenticexpo.ai/news"
  },
  {
    "timestamp": "2026-10-14 18:40",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence, Public Interest, Search Trends",
    "title": "미국 구글에서 대통령 연설에 이어 '슈퍼 인텔리전스' 트리플을 검색했습니다.",
    "summary": "미국 전역의 검색 분석에 따르면 지난 2주 동안 '슈퍼 인텔리전스' 및 'SI 기술'에 대한 온라인 검색어가 3배 이상 증가한 것으로 나타났습니다. 이러한 급증은 기존의 AI 용어가 개척지 추론 모델의 여파로 쓸모없어졌다고 주장하는 대통령 커뮤니케이션에 대한 격렬한 공개 논쟁이 진행되는 가운데 발생했습니다.",
    "imageUrl": "https://images.axios.com/FKVV3HZfBV4A5PlQomWBqw_sE94=/0x41:3127x1800/1920x1080/2026/10/08/1791479754519.jpeg",
    "sourceUrl": "https://tech-insider.org/trump-super-intelligence-rebrand-search-spike-2026/"
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
 * 다양한 날짜/시간 문자열(ISO, YYYY-MM-DD HH:mm, 점/슬래시 구분자 등)을 안전하게 Unix timestamp(ms)로 파싱
 * (로컬 머신 타임존에 따라 기사 ID 타임스탬프가 달라지는 현상을 방지하기 위해 UTC를 기본 표준으로 처리)
 */
function parseTimestampSafe(raw: string, fallbackIdx: number): number {
  if (!raw || !raw.trim()) {
    return Date.now() - (fallbackIdx + 1) * 1000 * 60 * 30;
  }
  const clean = raw.trim();

  // 1. 이미 'Z'나 '+', '-' 등 타임존 오프셋이 있는 경우
  if (/Z|[+-]\d{2}(?::?\d{2})?$/i.test(clean)) {
    const parsed = Date.parse(clean);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 2. 타임존이 명시되지 않은 경우, 글로벌 표준인 UTC로 일관되게 해석 (서버/로컬 머신 타임존 편차 원천 차단)
  const utcCandidate = clean.includes('T') ? `${clean}Z` : `${clean.replace(' ', 'T')}Z`;
  let parsed = Date.parse(utcCandidate);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  const utcWithSpace = clean.includes('UTC') ? clean : `${clean} UTC`;
  parsed = Date.parse(utcWithSpace);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 3. 점/슬래시 구분자 정규화 후 UTC 시도
  const normalized = clean.replace(/\./g, '-').replace(/\//g, '-').replace(/\s+/g, ' ');
  parsed = Date.parse(normalized.replace(' ', 'T') + 'Z');
  if (!isNaN(parsed) && parsed > 0) return parsed;

  parsed = Date.parse(normalized);
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
    ? (item.category.length > 25 ? item.category.slice(0, 24) + '…' : item.category)
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
    score: 8400 - idx * 650,
    commentCount: 320 - idx * 25,
    flair: { text: flairText, bgColor: '#DC2626', textColor: '#FFFFFF' },
    isOriginalContent: false,
    upvoteRatio: 0.94,
    media: accurateImageUrl ? {
      type: 'image',
      url: accurateImageUrl,
      domain,
    } : {
      type: 'link',
      url: item.sourceUrl,
      domain,
    },
    permalink: `/r/news/comments/${id}`,
    sourceUrl: item.sourceUrl,
  };
}
