/**
 * googleNewsSeedData.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 기반 실시간 뉴스 시드 데이터
 * 새 스프레드시트: https://docs.google.com/spreadsheets/d/e/2PACX-1vT4vdpKAEI0UaFM6tW-dXVCQoLDq-ncnl06jX80SBL7Y1ZHCzwvzvRGuuduuTu-k5nb6akrqCbr57Oi/pub?output=csv
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
    "timestamp": "2026-10-16 13:31",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "TechRepublic: SpaceXSI, 자율 AI 고객 지원을 위한 Grok Voice 3.0 출시",
    "summary": "TechRepublic은 SpaceXSI가 대기 시간이 매우 짧은 실시간 음성 스트리밍 기능을 갖춘 Grok Voice 3.0을 출시하여 기업이 기존의 대화형 음성 응답 시스템을 대체하는 대화형 에이전트 워크플로를 배포할 수 있도록 지원한다고 자세히 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.techrepublic.com/article/news-spacexsi-grok-voice-3-ai-customer-support/"
  },
  {
    "timestamp": "2026-10-16 13:30",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "NASSCOM Insights: 고립된 AI에서 조직화된 인텔리전스까지 — 엔터프라이즈 에이전트 전환의 다음 단계",
    "summary": "NASSCOM은 엔터프라이즈 자동화의 진화를 탐구하고 다중 에이전트 오케스트레이션 프레임워크가 서로 다른 엔터프라이즈 데이터 사일로 전반에 걸쳐 전문 자율 에이전트를 조정하여 응집력 있는 비즈니스 프로세스 자동화를 달성하는 방법을 보여줍니다.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://community.nasscom.in/communities/ai-inside/siloed-ai-orchestrated-intelligence-next-phase-agentic-transformation"
  },
  {
    "timestamp": "2026-10-16 13:29",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "TechAI Mint: SaaSpocalypse 재검토 — AI 기반 시스템 통합이 모놀리식 SaaS 플랫폼에 도전하는 방법",
    "summary": "TechAI Mint는 기업 IT 통합이 단편화된 SaaS 스택에서 AI 기반 소프트웨어 백본으로 전환하여 지속적인 자동화 워크플로우와 동적 API 기반 시스템 통합을 구현하는 방법을 분석합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://techaimint.substack.com/p/saaspocalypse-ai-impact-on-saas-zoho"
  },
  {
    "timestamp": "2026-10-16 13:28",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), SI (Super Intelligence)",
    "title": "말레이 메일: 미국이 AI 패권을 두 배로 높이면서 트럼프는 슈퍼 인텔리전스 부대를 추진합니다.",
    "summary": "Malay Mail은 연방 AI 이니셔티브를 감독하고 국방 슈퍼컴퓨팅 현대화를 가속화하며 지정학적 경쟁자에 대한 기술 리더십을 확보하기 위해 슈퍼 인텔리전스 포스(Super Intelligence Force)를 설립하는 트럼프 대통령의 행정 명령에 대해 보고합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://www.malaymail.com/news/tech-gadgets/2026/10/05/trump-pushes-super-intelligence-force-as-america-doubles-down-on-ai-supremacy-over-china/237725"
  },
  {
    "timestamp": "2026-10-16 13:27",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "스테이츠맨: 도널드 트럼프, 정보국장 제이 클레이튼을 슈퍼 인텔리전스 부대의 수장으로 AI 황제로 임명",
    "summary": "스테이츠맨은 도널드 트럼프 대통령이 제이 클레이튼 국가정보국장을 새로 창설된 슈퍼정보군(Super Intelligence Force)을 이끌도록 임명하고, 그에게 연방 기관 AI 통합과 국가 안보 조정을 조정하는 임무를 맡겼다는 사실을 다룹니다.",
    "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "sourceUrl": "https://www.thestatesman.com/world/donald-trump-names-intelligence-chief-jay-clayton-as-ai-czar-1503646626.html"
  },
  {
    "timestamp": "2026-10-16 13:26",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "마카오 비즈니스: Agentic AI 시대가 도래했습니다. 기업의 준비 상태는 강력한 시스템 통합에 달려 있습니다.",
    "summary": "Macau Business는 자율 AI 에이전트에 대한 경영진의 욕구가 급증하고 있지만 글로벌 기업의 4분의 1만이 안전한 프로덕션 배포에 필요한 기본 시스템 통합 및 데이터 거버넌스를 갖추고 있다는 OutSystems의 글로벌 연구 결과를 강조합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://macaubusiness.com/the-agentic-ai-era-is-here-enterprise-readiness-is-not-new-outsystems-research-finds/"
  },
  {
    "timestamp": "2026-10-16 13:25",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "대만 뉴스: OutSystems 글로벌 연구에서 에이전트 AI 배포를 위한 시스템 통합 전제 조건 강조",
    "summary": "Taiwan News는 시스템 통합 병목 현상이 국가 간 제조 및 금융 운영 전반에 걸쳐 에이전트 AI 워크플로를 확장하는 데 주요 장애물임을 나타내는 기업 설문 조사 결과를 보고합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    "sourceUrl": "https://www.taiwannews.com.tw/en/news/6459348"
  },
  {
    "timestamp": "2026-10-16 13:24",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "ZDNet: AI를 사용하는 CFO의 90%가 확장된 에이전트 배포를 통해 다양한 비즈니스 이점을 보고합니다.",
    "summary": "ZDNet은 자율 AI 에이전트를 배포한 CFO의 90%가 긴밀하게 결합된 엔터프라이즈 ERP와 CRM 시스템 통합을 통해 상당한 비용 절감과 생산성 향상을 보고한다는 것을 보여주는 새로운 재무 임원 연구를 조사했습니다.",
    "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "sourceUrl": "https://www.zdnet.com/innovation/cfos-report-business-benefits-expanded-roles-ai-agents/"
  },
  {
    "timestamp": "2026-10-16 13:23",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "중형 KD Agentic: 이기종 엔터프라이즈 애플리케이션 전반에 걸친 지능형 UI 및 다중 에이전트 오케스트레이션",
    "summary": "Medium KD Agentic은 자율적 다중 에이전트 오케스트레이션이 마이크로 사용자 인터페이스를 동적으로 생성하고 서로 다른 엔터프라이즈 비즈니스 애플리케이션 전반에 걸쳐 백그라운드 작업을 조정하는 차세대 에이전트 아키텍처를 자세히 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "sourceUrl": "https://medium.com/@kd-agentic/gpt-6-intelligent-ui-vs-gemini-4-argon-buttons-inside-chat-agents-running-across-apps-b0dc1f75d39e"
  },
  {
    "timestamp": "2026-10-16 13:22",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "일반 영어로 된 Medium AI: 2026년을 위한 완전한 AI 에이전트 로드맵 — 다중 에이전트 오케스트레이션 마스터하기",
    "summary": "Plain English의 Medium AI는 다중 에이전트 오케스트레이션을 향한 아키텍처 전환을 분석하고 결정론적 워크플로우, 영구 메모리 프로토콜 및 에이전트 간 통신이 엔터프라이즈 프로세스 자동화를 어떻게 재정의하는지 자세히 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "sourceUrl": "https://medium.com/ai-in-plain-english/the-complete-ai-agent-roadmap-for-2026-what-nobodys-telling-you-about-the-autonomous-revolution-c9ab7bb598ca"
  },
  {
    "timestamp": "2026-10-16 12:42",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "OutSystems 보고서: Agentic AI 시대가 도래했습니다. 기업의 준비 상태에는 시스템 통합이 필요합니다.",
    "summary": "OutSystems는 조직의 26%만이 핵심 비즈니스 프로세스에 자율 AI 에이전트를 안전하게 배포하는 데 필요한 시스템 통합 및 데이터 거버넌스 기반을 보유하고 있음을 보여주는 글로벌 기업 연구를 발표했습니다.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.prnewswire.com/apac/news-releases/the-agentic-ai-era-is-hereenterprise-readiness-is-not-new-outsystems-research-finds-302910797.html"
  },
  {
    "timestamp": "2026-10-16 12:41",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "DIGITIMES: TSMC는 Agentic AI 다중 에이전트 워크로드로 인해 고급 패키징 및 CPU 수요가 증가함을 확인했습니다.",
    "summary": "DIGITIMES는 TSMC 경영진이 어떻게 엔터프라이즈 다중 에이전트 오케스트레이션과 지속적인 배경 추론이 하이퍼스케일 데이터 센터 전반에서 고급 3D 패키징 및 호스트 컴퓨팅 프로세서에 대한 수요 급증을 주도하는지 강조했다고 보고했습니다.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://www.digitimes.com/news/a20261016PD219/tsmc-demand-cpu-packaging-capacity.html"
  },
  {
    "timestamp": "2026-10-16 12:40",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "Intel, Agentic AI 시대를 위한 개방형 인프라 및 엔터프라이즈 시스템 통합 가속화",
    "summary": "Intel은 분산 에이전트 AI 추론을 지원하도록 설계된 개방형 하드웨어 및 모듈식 소프트웨어 참조 아키텍처를 간략하게 설명하고, 글로벌 시스템 통합업체와 협력하여 컨테이너화된 에이전트 떼를 기업 네트워크에 안전하게 배포합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://www.intc.com/news-events/press-releases/detail/1783/intel-accelerates-open-infrastructure-for-the-agentic-ai-era"
  },
  {
    "timestamp": "2026-10-16 12:39",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "MindStudio: Google 반중력 팀워크 미리보기 - 프로덕션 코딩의 다중 에이전트 오케스트레이션",
    "summary": "MindStudio는 Google의 Anti-Gravity 환경을 검토하여 공동으로 작동하는 특수 하위 에이전트를 통해 조정된 다중 에이전트 오케스트레이션이 코드 분석, 구문 확인 및 테스트 실행을 자동화하는 방법을 보여줍니다.",
    "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    "sourceUrl": "https://www.mindstudio.ai/blog/google-anti-gravity-teamwork-preview"
  },
  {
    "timestamp": "2026-10-16 12:38",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "Snowflake World Tour NYC: 다중 에이전트 오케스트레이션을 위한 관리형 엔터프라이즈 데이터 기반 구축",
    "summary": "Snowflake는 Snowflake World Tour NYC에서 새로운 데이터 통합 ​​기능을 선보이며 통합 데이터 클린룸과 메타데이터 거버넌스를 통해 다중 에이전트 시스템이 어떻게 독점 기업 저장소를 안전하게 쿼리할 수 있는지 보여줍니다.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://www.snowflake.com/en/world-tour/nyc/"
  },
  {
    "timestamp": "2026-10-16 12:37",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "RSA, 엔터프라이즈 네트워크 전반에서 자율 AI 에이전트를 검색, 보호 및 관리하기 위해 에이전트 ID 출시",
    "summary": "RSA는 자율 AI 에이전트에 동적 암호화 자격 증명을 할당하여 다중 에이전트 작업 위임 중에 권한 상승 위험을 완화하는 엔터프라이즈 ID 및 액세스 관리 솔루션인 Agent ID를 선보였습니다.",
    "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "sourceUrl": "https://www.marktechpost.com/2026/09/29/rsa-launches-agent-id-to-discover-secure-and-govern-ai-agents-in-regulated-industries/"
  },
  {
    "timestamp": "2026-10-16 12:36",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "CNN 정치: 트럼프, AI 태스크 포스의 리더십 발표: DNI Jay Clayton이 슈퍼 인텔리전스 포스 의장",
    "summary": "CNN 폴리틱스(CNN Politics)는 트럼프 대통령이 미 국방부 기술 책임자인 에밀 마이클(Emil Michael), OPM 국장인 스콧 쿠포(Scott Kupor)와 함께 슈퍼 인텔리전스 부대(Super Intelligence Force)를 이끄는 연방 AI 황제로 제이 클레이튼(Jay Clayton) 국가정보국장을 임명했다고 보도했습니다.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://www.cnn.com/2026/10/04/politics/trump-ai-task-force-jay-clayton"
  },
  {
    "timestamp": "2026-10-16 12:35",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "피츠버그 포스트 가제트: 트럼프, 슈퍼 인텔리전스 부대(Super Intelligence Force) 수장에 제이 클레이턴 국가정보국장 임명",
    "summary": "Pittsburgh Post-Gazette에서는 DNI Jay Clayton 휘하의 슈퍼 인텔리전스 포스(Super Intelligence Force) 설립에 대해 자세히 설명하고, 투명한 보안 표준과 중요 인프라 운영자와의 조정에 대한 초당적 요구를 강조합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "sourceUrl": "https://www.post-gazette.com/news/politics-nation/2026/10/04/trump-ai-superintelligence-dni/stories/202610040077"
  },
  {
    "timestamp": "2026-10-16 12:34",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "AI Czar, Super Intelligence Force (SIF)",
    "title": "나시오날레: 트럼프, 새로운 슈퍼정보군을 창설하고 제이 클레이튼을 연방 AI 황제로 임명",
    "summary": "Nacionale은 트럼프 대통령의 Super Intelligence Force를 둘러싼 연방 조직 개편을 분석하고 부처 간 기술 조달 및 국방 AI 통합에 대한 Jay Clayton의 감독 권한을 자세히 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "sourceUrl": "https://www.nacionale.com/en/articles/trump-establishes-new-super-intelligence-force-appoints-jay-clayton-ai-czar"
  },
  {
    "timestamp": "2026-10-16 12:33",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "Zumarah: AI 기반 소프트웨어 2026 — 자율 에이전트 프레임워크가 시스템 통합을 재구성하는 방법",
    "summary": "Zumarah는 엔터프라이즈 소프트웨어 개발이 어떻게 AI 기반 패러다임으로 전환하고 있는지 평가하고 자율 에이전트 아키텍처가 기존의 모놀리식 코드베이스를 동적 API 기반 시스템 통합으로 어떻게 대체하는지 보여줍니다.",
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "sourceUrl": "https://zumarah.net/2026/10/09/ai-native-software-2026/"
  },
  {
    "timestamp": "2026-10-16 11:23",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "Hindustan Times: 트럼프의 슈퍼 정보 부대란 무엇입니까? 리더십, 목표 및 120일 정책 마감일",
    "summary": "Hindustan Times는 DNI Jay Clayton이 의장을 맡은 트럼프 대통령의 슈퍼 인텔리전스 포스(Super Intelligence Force)에 대한 자세한 분석을 제공하며 보안 위험을 평가하고 120일 이내에 포괄적인 국가 개척 AI 로드맵을 제공하는 태스크 포스의 임무를 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://www.hindustantimes.com/world-news/us-news/what-is-trumps-super-intelligence-force-members-goals-and-120-day-deadline-explained-101792110121098.html"
  },
  {
    "timestamp": "2026-10-16 11:22",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "White House SI Pact, SI (Super Intelligence)",
    "title": "Forbes: 백악관 내부에서 기술 억만장자와 행정부 간 슈퍼 인텔리전스에 관한 합의",
    "summary": "Forbes는 최고 기술 CEO들이 서명한 슈퍼 인텔리전스에 관한 308단어의 백악관 협정을 분석하여 다가오는 연방 조달 명령에 앞서 자발적인 4단계 거버넌스 프로토콜이 업계 자체 규제에 어떤 영향을 미치는지 평가합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "sourceUrl": "https://www.forbes.com/sites/saradorn/2026/09/30/white-house-releases-accord-between-billionaire-ai-execs-heres-what-it-says/"
  },
  {
    "timestamp": "2026-10-16 11:21",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "Teslarati: SpaceXSI가 다중 플랫폼 상거래를 확장함에 따라 Amazon은 온라인 구매에서 Grok Bot을 차단합니다.",
    "summary": "Teslarati는 SpaceXSI의 Grok Bot에서 자동화된 거래를 차단하는 Amazon을 다루면서 구매 오류를 처리하고 소비자 네트워크 전반에 걸쳐 분산형 AI 기반 쇼핑 레일을 탐색하겠다는 Elon Musk의 약속을 강조합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.teslarati.com/elon-musk-grok-bot-amazon-shopping/"
  },
  {
    "timestamp": "2026-10-16 11:20",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "FutureCIO: 글로벌 기업 운영 전반에 걸쳐 관리형 에이전트 AI 확장을 위한 HCLTech와 Anthropic 파트너",
    "summary": "FutureCIO는 HCLTech가 Claude 모델에 대한 관리형 에이전트 워크플로우를 구축하기 위해 전담 인류 사업부와 Center of Excellence를 설립하고 금융 및 의료 고객을 위한 엔터프라이즈 시스템 통합을 제공한다고 자세히 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://futurecio.tech/hcltech-and-anthropic-partner-to-scale-governed-agentic-ai-across-global-enterprises/"
  },
  {
    "timestamp": "2026-10-16 11:19",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "Forkast 뉴스: Druid AI, 26개 구성요소 거버넌스 참조 모델로 에이전트 블랙박스 매핑",
    "summary": "Forkast News는 에이전트 시스템 통합을 명확하게 설명하고 기업 IT 리더에게 구조화된 감사 파이프라인, 정책 경계 및 관찰 가능성 지표를 제공하도록 설계된 Druid AI의 26개 구성 요소 거버넌스 모델을 검토합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://forkast.news/druid-ai-maps-the-agentic-black-box-with-26-component-governance-reference-model/"
  },
  {
    "timestamp": "2026-10-16 11:18",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "회로에 관한 모든 것: Agentic AI, 랙 규모 아키텍처로 OCP Global Summit 2026에서 무대에 선다",
    "summary": "All About Circuits에서는 반도체 거대 기업인 Intel, AMD 및 Arm이 OCP 2026에서 에이전트 워크로드에 최적화된 하드웨어를 공개하고 고밀도 상호 연결과 토큰 라우팅을 통합하여 엔터프라이즈 다중 에이전트 시스템을 간소화합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    "sourceUrl": "https://www.allaboutcircuits.com/news/agentic-ai-takes-the-stage-at-ocp-global-summit-2026/"
  },
  {
    "timestamp": "2026-10-16 11:17",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "새로운 스택: Agentic AI와 시스템 통합의 만남 - 심층 연결 및 엔터프라이즈 아키텍처",
    "summary": "New Stack은 자율 에이전트 인텔리전스가 엔터프라이즈 인프라 전반에 걸쳐 심층적이고 신뢰할 수 있는 시스템 통합을 요구하는 이유를 살펴보고 API와 의미 계층이 서로 다른 운영 애플리케이션을 연결하는 방법을 보여줍니다.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://thenewstack.io/agentic-ai-meets-integration-the-next-frontier/"
  },
  {
    "timestamp": "2026-10-16 11:16",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), AI Native",
    "title": "가속화: 2026년의 에이전트 AI — 엔터프라이즈 기술 리더가 프로덕션에서 준비해야 할 사항",
    "summary": "Accelirate는 기업 AI가 샌드박스 파일럿에서 라이브 프로덕션 환경으로 이동함에 따라 거버넌스 가드레일, 다중 에이전트 조정 및 자동화된 시스템 통합을 강조하면서 주요 전환 필수 사항을 간략하게 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "sourceUrl": "https://www.accelirate.com/agentic-ai-2026-enterprise-leaders/"
  },
  {
    "timestamp": "2026-10-16 11:15",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "SWFTE 분석: 2026년 기업용 다중 에이전트 AI 시스템 — 규모에 따른 오케스트레이션 및 프로세스 자율성",
    "summary": "SWFTE는 다중 에이전트 오케스트레이션이 기업 프로세스 핸드오프를 45%까지 줄여 공급망 운영에 조정된 하위 에이전트 네트워크를 배포하기 위한 아키텍처 청사진을 제시하는 업계 벤치마크를 발표합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "sourceUrl": "https://www.swfte.com/blog/multi-agent-ai-systems-enterprise"
  },
  {
    "timestamp": "2026-10-16 11:14",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "미래 AGI: 2026년 최고의 AI 에이전트 오케스트레이션 플랫폼 — 다중 에이전트 궤적 추적 및 거버넌스",
    "summary": "Future AGI는 LangSmith, Temporal 및 독점 엔터프라이즈 제품군을 포함한 최고의 엔터프라이즈 다중 에이전트 오케스트레이션 프레임워크를 검토하고 런타임 추적, 상태 지속성 및 분산 에이전트 평가 기능을 비교합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "sourceUrl": "https://futureagi.com/blog/best-ai-agent-orchestration-platforms-2026/"
  },
  {
    "timestamp": "2026-10-16 10:00",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "비즈니스 인사이더: Elon Musk는 SpaceX가 Grok AI 에이전트 구매 실수에 대해 사용자에게 보상할 것이라고 말했습니다.",
    "summary": "Business Insider는 Elon Musk가 자동 Grok Bot 에이전트가 시작한 무단 거래에 대해 전액 상환을 약속하고 에이전트 상거래가 확장됨에 따라 중요한 기업 및 소비자 금융 안전 보장을 도입한다고 보고합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.businessinsider.com/elon-musk-spacex-will-pay-users-back-grok-purchase-mistakes-2026-10"
  },
  {
    "timestamp": "2026-10-16 9:59",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "Mashable: Elon Musk, Grok 봇이 온라인 결제에서 차단된 후 Amazon 경쟁사 제시",
    "summary": "Mashable은 Amazon이 자동화된 Grok Bot 에이전트의 구매 완료를 차단하여 Musk가 통합 AI 기반 시장을 탐색하게 된 후 SpaceXSI와 기존 전자 상거래 거대 기업 사이의 긴장이 고조되고 있음을 자세히 설명합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://in.mashable.com/tech/115038/elon-musk-pitches-amazon-competitor-after-grok-bots-allegedly-blocked-from-online-purchase"
  },
  {
    "timestamp": "2026-10-16 9:58",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "AP 뉴스: 트럼프의 국가정보국장 제이 클레이튼이 새로운 연방 슈퍼정보군을 이끌게 됩니다",
    "summary": "Associated Press는 도널드 트럼프 대통령이 DNI Jay Clayton을 슈퍼 인텔리전스 포스(Super Intelligence Force)의 선봉에 공식 임명하고 중요 인프라, 국방 연구 및 공익 분야 전반에 걸쳐 연방 참여를 조정하는 내용을 다룹니다.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://apnews.com/article/trump-jay-clayton-artificial-intelligence-task-force-b8689ea07de9102a52bd1cd2049b5901"
  },
  {
    "timestamp": "2026-10-16 9:57",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "ZDNet: BCG 2026 응용 AI 지수 — 에이전트 점유율이 22%로 상승함에 따라 기업의 50%가 ROI를 창출합니다.",
    "summary": "ZDNet은 에이전트적 AI가 2026년에 총 기업 가치의 22%를 창출하고 규모 기업이 기술 후발 기업의 성장을 두 배 이상 달성하는 등 글로벌 기업 AI 성숙도가 가속화되는 것을 보여주는 Boston Consulting Group의 최신 벤치마크를 분석합니다.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://www.zdnet.com/innovation/ai-spending-roi-bcg-2026-applied-ai-index/"
  },
  {
    "timestamp": "2026-10-16 9:56",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), AI Native",
    "title": "ZDNet: AI가 기존 IT를 고칠 수 있을까? 현대화를 위한 Agentic AI 및 시스템 통합 맵 종속성",
    "summary": "ZDNet은 시스템 통합업체가 에이전트 AI를 활용하여 하이브리드 메인프레임 전체에서 문서화되지 않은 종속성을 자동으로 발견하고 현대화 프로젝트 일정을 단축하며 마이그레이션 위험을 줄이는 방법을 강조하는 Kyndryl 연구를 살펴봅니다.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://www.zdnet.com/innovation/ai-legacy-it-modernization/"
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
