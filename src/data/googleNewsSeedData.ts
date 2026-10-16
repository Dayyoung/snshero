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
    "title": "TechRepublic: SpaceXSI Launches Grok Voice 3.0 for Autonomous AI Customer Support",
    "summary": "TechRepublic details SpaceXSI releasing Grok Voice 3.0 with ultra-low latency real-time voice streaming, enabling enterprises to deploy conversational agentic workflows that replace traditional interactive voice response systems.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.techrepublic.com/article/news-spacexsi-grok-voice-3-ai-customer-support/"
  },
  {
    "timestamp": "2026-10-16 13:30",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "NASSCOM Insights: From Siloed AI to Orchestrated Intelligence — The Next Phase of Enterprise Agentic Transformation",
    "summary": "NASSCOM explores the evolution of enterprise automation, demonstrating how multi-agent orchestration frameworks coordinate specialized autonomous agents across disparate enterprise data silos to achieve cohesive business process automation.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://community.nasscom.in/communities/ai-inside/siloed-ai-orchestrated-intelligence-next-phase-agentic-transformation"
  },
  {
    "timestamp": "2026-10-16 13:29",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "TechAI Mint: SaaSpocalypse Revisited — How AI-Native Systems Integration Challenges Monolithic SaaS Platforms",
    "summary": "TechAI Mint analyzes how enterprise IT integration is shifting away from fragmented SaaS stacks toward AI-native software backbones, enabling continuous automated workflows and dynamic API-driven systems integration.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://techaimint.substack.com/p/saaspocalypse-ai-impact-on-saas-zoho"
  },
  {
    "timestamp": "2026-10-16 13:28",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), SI (Super Intelligence)",
    "title": "Malay Mail: Trump Pushes Super Intelligence Force as America Doubles Down on AI Supremacy",
    "summary": "Malay Mail reports on President Trump's executive directive establishing the Super Intelligence Force to supervise federal AI initiatives, accelerate defense supercomputing modernization, and ensure technological leadership over geopolitical rivals.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://www.malaymail.com/news/tech-gadgets/2026/10/05/trump-pushes-super-intelligence-force-as-america-doubles-down-on-ai-supremacy-over-china/237725"
  },
  {
    "timestamp": "2026-10-16 13:27",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "The Statesman: Donald Trump Names Intelligence Chief Jay Clayton as AI Czar to Head Super Intelligence Force",
    "summary": "The Statesman covers President Donald Trump appointing Director of National Intelligence Jay Clayton to lead the newly formed Super Intelligence Force, tasking him with coordinating federal agency AI integration and national security alignment.",
    "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "sourceUrl": "https://www.thestatesman.com/world/donald-trump-names-intelligence-chief-jay-clayton-as-ai-czar-1503646626.html"
  },
  {
    "timestamp": "2026-10-16 13:26",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "Macau Business: The Agentic AI Era Is Here — Enterprise Readiness Depends on Robust Systems Integration",
    "summary": "Macau Business highlights OutSystems global research finding that while executive appetite for autonomous AI agents is surging, only a quarter of global enterprises have the underlying systems integration and data governance required for safe production deployments.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://macaubusiness.com/the-agentic-ai-era-is-here-enterprise-readiness-is-not-new-outsystems-research-finds/"
  },
  {
    "timestamp": "2026-10-16 13:25",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "Taiwan News: OutSystems Global Study Emphasizes Systems Integration Prerequisite for Agentic AI Deployment",
    "summary": "Taiwan News reports on enterprise survey findings indicating that systems integration bottlenecks represent the primary obstacle to scaling agentic AI workflows across cross-border manufacturing and financial operations.",
    "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    "sourceUrl": "https://www.taiwannews.com.tw/en/news/6459348"
  },
  {
    "timestamp": "2026-10-16 13:24",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "ZDNet: 90% of CFOs Using AI Report Multiple Business Benefits with Scaled Agentic Deployments",
    "summary": "ZDNet examines new financial executive research showing that 90% of CFOs deploying autonomous AI agents report significant cost savings and productivity gains, driven by tightly coupled enterprise ERP and CRM systems integration.",
    "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "sourceUrl": "https://www.zdnet.com/innovation/cfos-report-business-benefits-expanded-roles-ai-agents/"
  },
  {
    "timestamp": "2026-10-16 13:23",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "Medium KD Agentic: Intelligent UI and Multi-Agent Orchestration Across Heterogeneous Enterprise Applications",
    "summary": "Medium KD Agentic details next-generation agent architectures where autonomous multi-agent orchestration dynamically creates micro-user interfaces and coordinates background actions across disparate enterprise business applications.",
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "sourceUrl": "https://medium.com/@kd-agentic/gpt-6-intelligent-ui-vs-gemini-4-argon-buttons-inside-chat-agents-running-across-apps-b0dc1f75d39e"
  },
  {
    "timestamp": "2026-10-16 13:22",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "Medium AI in Plain English: The Complete AI Agent Roadmap for 2026 — Mastering Multi-Agent Orchestration",
    "summary": "Medium AI in Plain English breaks down the architectural shift toward multi-agent orchestration, detailing how deterministic workflows, persistent memory protocols, and agent-to-agent communication redefine enterprise process automation.",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "sourceUrl": "https://medium.com/ai-in-plain-english/the-complete-ai-agent-roadmap-for-2026-what-nobodys-telling-you-about-the-autonomous-revolution-c9ab7bb598ca"
  },
  {
    "timestamp": "2026-10-16 12:42",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "OutSystems Report: The Agentic AI Era Is Here — Enterprise Readiness Is Not Without Systems Integration",
    "summary": "OutSystems releases global enterprise research revealing that only 26% of organizations possess the systems integration and data governance foundation needed to deploy autonomous AI agents safely in core business processes.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.prnewswire.com/apac/news-releases/the-agentic-ai-era-is-hereenterprise-readiness-is-not-new-outsystems-research-finds-302910797.html"
  },
  {
    "timestamp": "2026-10-16 12:41",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "DIGITIMES: TSMC Confirms Agentic AI Multi-Agent Workloads Boost Advanced Packaging and CPU Demand",
    "summary": "DIGITIMES reports that TSMC leadership highlighted how enterprise multi-agent orchestration and continuous background reasoning are driving surge demand for advanced 3D packaging and host compute processors across hyperscale data centers.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://www.digitimes.com/news/a20261016PD219/tsmc-demand-cpu-packaging-capacity.html"
  },
  {
    "timestamp": "2026-10-16 12:40",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "Intel Accelerates Open Infrastructure and Enterprise Systems Integration for the Agentic AI Era",
    "summary": "Intel outlines its open hardware and modular software reference architectures designed to support distributed agentic AI inference, partnering with global systems integrators to deploy containerized agent swarms securely on enterprise networks.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://www.intc.com/news-events/press-releases/detail/1783/intel-accelerates-open-infrastructure-for-the-agentic-ai-era"
  },
  {
    "timestamp": "2026-10-16 12:39",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "MindStudio: Google Anti-Gravity Teamwork Preview — Multi-Agent Orchestration in Production Coding",
    "summary": "MindStudio reviews Google's Anti-Gravity environment, illustrating how coordinated multi-agent orchestration automates code analysis, syntax verification, and test execution through specialized sub-agents operating in parallel.",
    "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    "sourceUrl": "https://www.mindstudio.ai/blog/google-anti-gravity-teamwork-preview"
  },
  {
    "timestamp": "2026-10-16 12:38",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "Snowflake World Tour NYC: Establishing Governed Enterprise Data Foundations for Multi-Agent Orchestration",
    "summary": "Snowflake showcases new data integration features at Snowflake World Tour NYC, demonstrating how unified data cleanrooms and metadata governance enable multi-agent systems to securely query proprietary enterprise repositories.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://www.snowflake.com/en/world-tour/nyc/"
  },
  {
    "timestamp": "2026-10-16 12:37",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "RSA Launches Agent ID to Discover, Secure, and Govern Autonomous AI Agents Across Enterprise Networks",
    "summary": "RSA debuts Agent ID, an enterprise identity and access management solution that assigns dynamic cryptographic credentials to autonomous AI agents, mitigating privilege escalation risks during multi-agent task delegations.",
    "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "sourceUrl": "https://www.marktechpost.com/2026/09/29/rsa-launches-agent-id-to-discover-secure-and-govern-ai-agents-in-regulated-industries/"
  },
  {
    "timestamp": "2026-10-16 12:36",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "CNN Politics: Trump Announces Leadership of AI Task Force: DNI Jay Clayton Chairs Super Intelligence Force",
    "summary": "CNN Politics reports on President Trump naming Director of National Intelligence Jay Clayton as federal AI Czar leading the Super Intelligence Force alongside Pentagon technology chief Emil Michael and OPM Director Scott Kupor.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://www.cnn.com/2026/10/04/politics/trump-ai-task-force-jay-clayton"
  },
  {
    "timestamp": "2026-10-16 12:35",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "Pittsburgh Post-Gazette: Trump Names National Intelligence Director Jay Clayton to Lead Super Intelligence Force",
    "summary": "The Pittsburgh Post-Gazette details the establishment of the Super Intelligence Force under DNI Jay Clayton, highlighting bipartisan calls for transparent security standards and coordination with critical infrastructure operators.",
    "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "sourceUrl": "https://www.post-gazette.com/news/politics-nation/2026/10/04/trump-ai-superintelligence-dni/stories/202610040077"
  },
  {
    "timestamp": "2026-10-16 12:34",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "AI Czar, Super Intelligence Force (SIF)",
    "title": "Nacionale: Trump Establishes New Super Intelligence Force and Appoints Jay Clayton as Federal AI Czar",
    "summary": "Nacionale analyzes the federal reorganization surrounding President Trump's Super Intelligence Force, detailing Jay Clayton's supervisory mandate over interagency technology procurement and national defense AI integration.",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "sourceUrl": "https://www.nacionale.com/en/articles/trump-establishes-new-super-intelligence-force-appoints-jay-clayton-ai-czar"
  },
  {
    "timestamp": "2026-10-16 12:33",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "Zumarah: AI-Native Software 2026 — How Autonomous Agent Frameworks Remake Systems Integration",
    "summary": "Zumarah evaluates how enterprise software development is shifting toward AI-native paradigms, illustrating how autonomous agent architectures replace traditional monolithic codebases with dynamic, API-driven systems integration.",
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "sourceUrl": "https://zumarah.net/2026/10/09/ai-native-software-2026/"
  },
  {
    "timestamp": "2026-10-16 11:23",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "Hindustan Times: What is Trump's Super Intelligence Force — Leadership, Goals, and 120-Day Policy Deadline",
    "summary": "Hindustan Times provides a detailed breakdown of President Trump's Super Intelligence Force chaired by DNI Jay Clayton, explaining the task force's mandate to assess security risks and deliver a comprehensive national frontier AI roadmap within 120 days.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://www.hindustantimes.com/world-news/us-news/what-is-trumps-super-intelligence-force-members-goals-and-120-day-deadline-explained-101792110121098.html"
  },
  {
    "timestamp": "2026-10-16 11:22",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "White House SI Pact, SI (Super Intelligence)",
    "title": "Forbes: Inside the White House Accord on Super Intelligence Between Tech Billionaires and Executive Branch",
    "summary": "Forbes analyzes the complete 308-word White House Accord on Super Intelligence signed by top tech CEOs, assessing how voluntary four-layer governance protocols impact industry self-regulation ahead of upcoming federal procurement mandates.",
    "imageUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    "sourceUrl": "https://www.forbes.com/sites/saradorn/2026/09/30/white-house-releases-accord-between-billionaire-ai-execs-heres-what-it-says/"
  },
  {
    "timestamp": "2026-10-16 11:21",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "Teslarati: Amazon Shuts Out Grok Bot from Online Purchasing as SpaceXSI Expands Multi-Platform Commerce",
    "summary": "Teslarati covers Amazon blocking automated transactions from SpaceXSI's Grok Bot, highlighting Elon Musk's promise to cover purchase errors and explore decentralized AI-native shopping rails across consumer networks.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.teslarati.com/elon-musk-grok-bot-amazon-shopping/"
  },
  {
    "timestamp": "2026-10-16 11:20",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "FutureCIO: HCLTech and Anthropic Partner to Scale Governed Agentic AI Across Global Enterprise Operations",
    "summary": "FutureCIO details HCLTech establishing a dedicated Anthropic Business Unit and Center of Excellence to build governed agentic workflows on Claude models, offering enterprise systems integration for financial and healthcare clients.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://futurecio.tech/hcltech-and-anthropic-partner-to-scale-governed-agentic-ai-across-global-enterprises/"
  },
  {
    "timestamp": "2026-10-16 11:19",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "Forkast News: Druid AI Maps the Agentic Black Box with 26-Component Governance Reference Model",
    "summary": "Forkast News reviews Druid AI's 26-component governance model designed to demystify agentic systems integration, providing enterprise IT leaders with structured audit pipelines, policy boundaries, and observability metrics.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://forkast.news/druid-ai-maps-the-agentic-black-box-with-26-component-governance-reference-model/"
  },
  {
    "timestamp": "2026-10-16 11:18",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "AI Native, SI AX (System Integration AI Transformation)",
    "title": "All About Circuits: Agentic AI Takes the Stage at OCP Global Summit 2026 with Rack-Scale Architectures",
    "summary": "All About Circuits covers semiconductor giants Intel, AMD, and Arm unveiling hardware optimized for agentic workloads at OCP 2026, integrating high-density interconnects and token routing to streamline enterprise multi-agent systems.",
    "imageUrl": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
    "sourceUrl": "https://www.allaboutcircuits.com/news/agentic-ai-takes-the-stage-at-ocp-global-summit-2026/"
  },
  {
    "timestamp": "2026-10-16 11:17",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "The New Stack: Agentic AI Meets Systems Integration — Deep Connectivity and Enterprise Architecture",
    "summary": "The New Stack explores why autonomous agent intelligence requires deep, trusted systems integration across enterprise infrastructure, illustrating how APIs and semantic layers connect disparate operational applications.",
    "imageUrl": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
    "sourceUrl": "https://thenewstack.io/agentic-ai-meets-integration-the-next-frontier/"
  },
  {
    "timestamp": "2026-10-16 11:16",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), AI Native",
    "title": "Accelirate: Agentic AI in 2026 — What Enterprise Technology Leaders Must Prepare for in Production",
    "summary": "Accelirate outlines key transition imperatives as enterprise AI moves from sandbox pilots to live production environments, emphasizing governance guardrails, multi-agent coordination, and automated system integration.",
    "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800",
    "sourceUrl": "https://www.accelirate.com/agentic-ai-2026-enterprise-leaders/"
  },
  {
    "timestamp": "2026-10-16 11:15",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "SWFTE Analysis: Multi-Agent AI Systems for Enterprise 2026 — Orchestration at Scale and Process Autonomy",
    "summary": "SWFTE publishes industry benchmarks showing that multi-agent orchestration reduces enterprise process hand-offs by 45%, presenting architectural blueprints for deploying coordinated subagent networks in supply chain operations.",
    "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "sourceUrl": "https://www.swfte.com/blog/multi-agent-ai-systems-enterprise"
  },
  {
    "timestamp": "2026-10-16 11:14",
    "category": "Agentic AI & Autonomous Intelligent Systems",
    "keywords": "Multi-Agent Orchestration, Agentic AI",
    "title": "Future AGI: Best AI Agent Orchestration Platforms 2026 — Multi-Agent Trajectory Tracing and Governance",
    "summary": "Future AGI reviews top enterprise multi-agent orchestration frameworks including LangSmith, Temporal, and proprietary enterprise suites, comparing runtime tracing, state persistence, and distributed agent evaluation capabilities.",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800",
    "sourceUrl": "https://futureagi.com/blog/best-ai-agent-orchestration-platforms-2026/"
  },
  {
    "timestamp": "2026-10-16 10:00",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "Business Insider: Elon Musk Says SpaceX Will Pay Users Back for Grok AI Agent Purchase Mistakes",
    "summary": "Business Insider reports on Elon Musk pledging full reimbursement for unauthorized transactions initiated by autonomous Grok Bot agents, introducing a critical enterprise and consumer financial safety guarantee as agentic commerce expands.",
    "imageUrl": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "sourceUrl": "https://www.businessinsider.com/elon-musk-spacex-will-pay-users-back-grok-purchase-mistakes-2026-10"
  },
  {
    "timestamp": "2026-10-16 9:59",
    "category": "SpaceXSI & Next-Generation Super Intelligence",
    "keywords": "SpaceXSI, Agentic AI",
    "title": "Mashable: Elon Musk Pitches Amazon Competitor After Grok Bots Blocked from Online Checkout",
    "summary": "Mashable details the escalating tension between SpaceXSI and traditional ecommerce giants after Amazon blocked automated Grok Bot agents from finalizing purchases, prompting Musk to explore an integrated AI-native marketplace.",
    "imageUrl": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800",
    "sourceUrl": "https://in.mashable.com/tech/115038/elon-musk-pitches-amazon-competitor-after-grok-bots-allegedly-blocked-from-online-purchase"
  },
  {
    "timestamp": "2026-10-16 9:58",
    "category": "Trump Administration SI Policy & Federal Agencies",
    "keywords": "Super Intelligence Force (SIF), AI Czar",
    "title": "AP News: Trump's National Intelligence Chief Jay Clayton Will Lead New Federal Super Intelligence Force",
    "summary": "Associated Press covers President Donald Trump officially designating DNI Jay Clayton to spearhead the Super Intelligence Force, coordinating federal engagement across critical infrastructure, defense research, and public interest sectors.",
    "imageUrl": "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    "sourceUrl": "https://apnews.com/article/trump-jay-clayton-artificial-intelligence-task-force-b8689ea07de9102a52bd1cd2049b5901"
  },
  {
    "timestamp": "2026-10-16 9:57",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), Agentic AI",
    "title": "ZDNet: BCG 2026 Applied AI Index — 50% of Enterprises Generate ROI as Agentic Share Climbs to 22%",
    "summary": "ZDNet analyzes Boston Consulting Group's latest benchmark showing global corporate AI maturity accelerating, with agentic AI generating 22% of total enterprise value in 2026 and scaling firms achieving over double the growth of tech laggards.",
    "imageUrl": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800",
    "sourceUrl": "https://www.zdnet.com/innovation/ai-spending-roi-bcg-2026-applied-ai-index/"
  },
  {
    "timestamp": "2026-10-16 9:56",
    "category": "Enterprise SI AX & IT System Integration",
    "keywords": "SI AX (System Integration AI Transformation), AI Native",
    "title": "ZDNet: Can AI Fix Legacy IT? Agentic AI and Systems Integration Map Dependencies for Modernization",
    "summary": "ZDNet explores Kyndryl research highlighting how systems integrators utilize agentic AI to autonomously discover undocumented dependencies across hybrid mainframes, cutting modernization project timelines and reducing migration risks.",
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
 */
function parseTimestampSafe(raw: string, fallbackIdx: number): number {
  if (!raw || !raw.trim()) {
    return Date.now() - (fallbackIdx + 1) * 1000 * 60 * 30;
  }
  const clean = raw.trim();

  // 1. 표준 ISO / Date.parse 시도
  let parsed = Date.parse(clean);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 2. 공백을 'T'로 치환한 ISO 형식 시도 (예: "2026-10-15 8:38")
  parsed = Date.parse(clean.replace(' ', 'T'));
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 3. 점/슬래시 구분자 정규화 후 시도 (예: "2026. 10. 15. 8:38")
  const normalized = clean.replace(/\./g, '-').replace(/\//g, '-').replace(/\s+/g, ' ');
  parsed = Date.parse(normalized);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  parsed = Date.parse(normalized.replace(' ', 'T'));
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
