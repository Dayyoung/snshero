/**
 * googleNewsSeedData.ts
 * 구글 뉴스(Google News US Edition) 스프레드시트 기반 실시간 뉴스 시드 데이터
 * 스프레드시트: https://docs.google.com/spreadsheets/d/1CT5Yy1-i6kkOfx3d-Yw1osOEYbN7fkk8IDiI8Vm82vM/edit
 */

import { RedditPost } from '../lib/reddit/redditTypes';

export interface RawGoogleNewsItem {
  timestamp: string;      // 수집일시 (e.g. 2026-10-10 10:45)
  title: string;          // 제목 (영어 원문)
  summary: string;        // 본문 요약 (영어 원문)
  imageUrl: string;       // 이미지 리스트
  sourceUrl: string;      // 원문 링크
}

export const INITIAL_GOOGLE_NEWS: RawGoogleNewsItem[] = [
  {
    "timestamp": "2026-10-12 14:24",
    "title": "CFTC Proposes Expanding Swaps Definition to Include Prediction Markets and Event Contracts",
    "summary": "미 상품선물거래위원회(CFTC)는 선거 및 금융 이벤트 예측 시장 거래 플랫폼(Kalshi 등)을 규제 스왑 계약 범주에 포함시키기 위한 새로운 규제안을 제안했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.morningstar.com/news/dow-jones/2026101229/dow-jones-top-financial-services-headlines-at-12-am-et-cftc-proposes-to-expand-definition-of-swaps-to-include-prediction-markets-trading-kalshi"
  },
  {
    "timestamp": "2026-10-12 14:24",
    "title": "Providence Journal Announces Elimination of Daily Print Edition in Digital Shift",
    "summary": "로드아일랜드주 최대 일간지 프로비던스 저널(Providence Journal)이 인쇄비 상승과 디지털 독자 전환에 따라 매일 인쇄하던 지면 신문 발행을 전격 중단한다고 발표했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://www.golocalprov.com/news/big-news-stories-overnight-monday-october-12-2026"
  },
  {
    "timestamp": "2026-10-12 14:24",
    "title": "Mexican President Claudia Sheinbaum Urges Coastal Residents to Stay Indoors as Hurricane Simon Approaches",
    "summary": "클라우디아 셰인바움 멕시코 대통령은 4등급 허리케인 사이먼이 태평양 연안으로 접근함에 따라 해안 지역 주민들에게 실내 대피령을 내리고 긴급 재난 대응 체계를 가동했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://bworldonline.com/world/2026/10/12/786183/faa-tells-us-airlines-to-exercise-caution-in-saudi-arabia-flights-citing-safety-risks/"
  },
  {
    "timestamp": "2026-10-12 14:24",
    "title": "Second Houthi Missile Strike on Riyadh Airport Damages Infrastructure and Claims Lives",
    "summary": "사우디 리야드 킹 칼리드 국제공항이 첫 공습 이틀 만에 후티 반군의 추가 미사일 피격을 받아 여객 터미널 인근에 화재가 발생하고 추가 사상자가 집계되었습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/b1831fd/2147483647/strip/true/crop/3118x1754+0+0/resize/727x409!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F8d%2F9e6af3392e6e335001fdcd4f7d6d%2Fb3aa7b3339ee488ab9c7ac1552b2cf05",
    "sourceUrl": "https://www.timesofisrael.com/liveblog-october-12-2026/"
  },
  {
    "timestamp": "2026-10-12 14:24",
    "title": "Canadian Prime Minister Mark Carney Warns US-Russia Diesel Deal Compromises Ukraine Peace Process",
    "summary": "마크 카니 캐나다 총리는 트럼프 행정부의 러시아산 디젤 수입 합의가 우크라이나의 주권과 서방의 평화 중재 노력을 훼손하는 심각한 후퇴라고 공식 우려를 표명했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://theedgemalaysia.com/node/821408"
  },
  {
    "timestamp": "2026-10-12 13:28:00",
    "title": "Bipartisan Senate Coalition Cites 2022 Law to Challenge Trump's Russian Diesel Imports",
    "summary": "미 상원 여야 의원들은 2022년 제정된 대러시아 제재법을 근거로 트럼프 행정부의 러시아산 디젤 수입 허용 조치를 무효화하기 위한 입법 저지 절차에 착수했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.morningstar.com/news/dow-jones/2026101228/dow-jones-top-energy-headlines-at-12-am-et-iran-backed-militants-are-tightening-the-screws-on-saudi-arabias-crown-prince-trump"
  },
  {
    "timestamp": "2026-10-12 13:28:00",
    "title": "IMF Unveils World Economic Outlook and Global Financial Stability Report in Bangkok",
    "summary": "국제통화기금(IMF)이 방콕 연례 총회에서 2026년 10월 세계경제전망 보고서를 발표하며 중동 분쟁으로 인한 유가 충격과 급증하는 글로벌 정부 부채 리스크를 경고했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://www.imf.org/en/publications/weo"
  },
  {
    "timestamp": "2026-10-12 13:28:00",
    "title": "Michigan Senate Nominee Abdul El-Sayed Emphasizes Healthcare and Tribal Sovereignty",
    "summary": "미시간주 민주당 상원의원 후보 압둘 엘-사이드가 대선 출마설을 일축하고 지역 원주민 부족 주권 존중과 공공 의료 접근성 확충에 집중하겠다고 밝혔습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://www.washingtontimes.com/"
  },
  {
    "timestamp": "2026-10-12 13:28:00",
    "title": "Federal Audit Reveals Majority of Visa Overstayers Avoided DHS Enforcement",
    "summary": "미 국토안보부(DHS) 감사관실 감사 결과 체류 비자 만료자의 대다수가 단속 유예 처분을 받은 것으로 나타나 의회 차원의 이민 집행 체계 재검토 논란이 일고 있습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/b1831fd/2147483647/strip/true/crop/3118x1754+0+0/resize/727x409!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F8d%2F9e6af3392e6e335001fdcd4f7d6d%2Fb3aa7b3339ee488ab9c7ac1552b2cf05",
    "sourceUrl": "https://www.washingtontimes.com/"
  },
  {
    "timestamp": "2026-10-12 13:28:00",
    "title": "Panama Declares State of Emergency Following Back-to-Back Magnitude 7.7 and 6.6 Earthquakes",
    "summary": "파나마 정부는 연안에서 발생한 규모 7.7 및 6.6의 연속 강진 피해 수습을 위해 국가 비상사태를 선포하고 파나마 운하 인접 물류 시설에 대한 긴급 점검을 시작했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://globalnation.inquirer.net/"
  },
  {
    "timestamp": "2026-10-12 12:40:00",
    "title": "FAA Issues Safety Warning to US Airlines Over Saudi Airspace and Navigation Interference",
    "summary": "미 연방항공청(FAA)은 사우디 리야드 공항 공습과 내비게이션 전파 교란 위험을 이유로 미국 국적 항공사들에게 사우디 영공 운항 시 안전 경계령(NOTAM)을 발령했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://bworldonline.com/world/2026/10/12/786183/faa-tells-us-airlines-to-exercise-caution-in-saudi-arabia-flights-citing-safety-risks/"
  },
  {
    "timestamp": "2026-10-12 12:40:00",
    "title": "Social Security Administration to Announce Key 2027 Cost-of-Living Benefit Changes",
    "summary": "미국 사회보장국(SSA)은 인플레이션 지표를 반영하여 수천만 명의 은퇴자 및 수급자에게 적용될 2027년도 사회보장 연금 생활비조정(COLA) 인상률을 10월 14일 발표할 예정입니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://news.google.com/home?hl=en-US&gl=US&ceid=US%3Aen"
  },
  {
    "timestamp": "2026-10-12 12:40:00",
    "title": "Forbes Highlights Winners of 2026 Great American Beer Festival",
    "summary": "미국 최대 맥주 축제인 2026 그레이트 아메리칸 비어 페스티벌(GABF)의 최종 결과가 발표되며 무알콜 크래프트 맥주와 혁신적인 전통 양조장들이 최고 영예를 안았습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://news.google.com/home?hl=en-US&tab=wn&gl=US&ceid=US:en"
  },
  {
    "timestamp": "2026-10-12 12:40:00",
    "title": "Saudi Air Defenses Intercept Inbound Cruise Missile and Drones in Fresh Barrage",
    "summary": "사우디 연합군 방공부대는 12일 새벽 리야드 공항 인근과 동부주 주요 석유 인프라로 날아들던 순항미사일과 자폭 드론들을 요격 파괴했다고 공식 발표했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/b1831fd/2147483647/strip/true/crop/3118x1754+0+0/resize/727x409!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F8d%2F9e6af3392e6e335001fdcd4f7d6d%2Fb3aa7b3339ee488ab9c7ac1552b2cf05",
    "sourceUrl": "https://www.rferl.org/a/iran-live-blog-trump-middle-east/33803414.html"
  },
  {
    "timestamp": "2026-10-12 12:40:00",
    "title": "US Treasury Sanctions 17 Tankers Tied to Iran's Clandestine Oil Shadow Fleet",
    "summary": "미 재무부 해외자산통제국(OFAC)은 대이란 해상 봉쇄 조치에 발맞춰 수백만 배럴의 이란산 원유를 불법 환적·수출해 온 17척의 그림자 선단 선박과 선사를 전격 제재했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://www.timesofisrael.com/trump-says-us-wont-hit-iran-this-month-as-zamir-said-to-warn-strike-could-delay-israels-election/"
  },
  {
    "timestamp": "2026-10-12 11:50:00",
    "title": "North Korea Conducts Fourth Suspected Ballistic Missile Launch in a Month Toward East Sea",
    "summary": "한국 합참과 일본 방위성은 북한이 동해상으로 미상 탄도미사일을 발사했다고 발표했으며, 최근 한 달간 4차례의 미사일 도발이 이어지며 한미일 안보 공조가 비상 체제에 돌입했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.nknews.org/2026/10/north-korea-appears-to-conduct-fourth-missile-test-in-a-month/"
  },
  {
    "timestamp": "2026-10-12 11:50:00",
    "title": "GOP Senator Thom Tillis Criticizes Trump's Russian Diesel Deal as Potentially Illegal",
    "summary": "공화당 소속 톰 틸리스 상원의원은 트럼프 대통령이 러시아와 체결한 30만 톤 규모의 디젤 수입 합의가 연방 대러 제재법을 위반할 소지가 크며 미국인의 안전을 위태롭게 한다고 비판했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://theedgemalaysia.com/node/821408"
  },
  {
    "timestamp": "2026-10-12 11:50:00",
    "title": "Polish Authorities Detain Suspect in Plot to Assassinate Prime Minister Donald Tusk",
    "summary": "폴란드 경찰과 내무부는 도날트 투스크 총리와 국방장관을 겨냥한 암살 공격을 모의하던 용의자를 긴급 체포하고 배후 세력에 대한 국가 안보 수사를 개시했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://globalnation.inquirer.net/"
  },
  {
    "timestamp": "2026-10-12 11:50:00",
    "title": "White House Official Accuses South Korea of Flooding US with Subsidized Steel Imports",
    "summary": "백악관 무역 관리가 한국 철강 기업들이 정부 보조금을 등에 업고 저가 철강재를 미국 시장에 대량 덤핑하고 있다고 공개 경고하며 대미 수출 규제 가능성을 시사했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/b1831fd/2147483647/strip/true/crop/3118x1754+0+0/resize/727x409!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F8d%2F9e6af3392e6e335001fdcd4f7d6d%2Fb3aa7b3339ee488ab9c7ac1552b2cf05",
    "sourceUrl": "https://www.koreatimes.co.kr/"
  },
  {
    "timestamp": "2026-10-12 11:50:00",
    "title": "Trump Pledges $5,000 Checks to US Voters if Republicans Retain Congressional Control",
    "summary": "트럼프 미국 대통령이 중간선거 유세 현장에서 공화당이 의회 다수당을 유지할 경우 관세 수익 환원과 감세를 통해 국민 1인당 5,000달러를 지급하겠다는 공약을 제시했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://timesofindia.indiatimes.com/videos/international/trumps-self-praise-show-dont-need-teleprompter-youll-laugh-for-any-stupid-thing-watch/videoshow/134867396.cms"
  },
  {
    "timestamp": "2026-10-12 10:00",
    "title": "Google Unveils New Pixel Hardware Lineup Centered on On-Device AI in New York",
    "summary": "구글이 뉴욕에서 열린 'Made by Google 2026' 신제품 발표 행사에서 차세대 온디바이스 인공지능(AI)을 탑재한 플래그십 픽셀(Pixel) 스마트폰과 기기 생태계를 공식 공개했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.cbsnews.com/tag/google/"
  },
  {
    "timestamp": "2026-10-12 10:00",
    "title": "Trump Signals US May Swiftly Join Saudi Coalition Military Strikes Against Houthis",
    "summary": "도널드 트럼프 대통령은 사우디 리야드 공항 2차 공습 보고를 접한 뒤 기자회견에서 사우디 연합군의 대후티 군사 작전에 미군이 직접 참여할지 여부를 매우 신속히 결정하겠다고 밝혔습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://www.cbsnews.com/live-updates/iran-war-trump-us-elections-saudi-arabia-yemen-houthis/"
  },
  {
    "timestamp": "2026-10-12 10:00",
    "title": "Public Opinion Survey in Japan Finds 26% View US as Greatest Threat to World Peace",
    "summary": "일본의 전국 단위 여론조사 결과, 중동 분쟁 격화와 군사적 긴장 고조 속에 일본 국민의 26%가 세계 평화를 위협하는 가장 큰 요인 중 하나로 미국의 대외 군사 정책을 꼽았습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://www.japantimes.co.jp/news/2026/10/11/japan/japan-survey-us-biggest-threat-to-peace/"
  },
  {
    "timestamp": "2026-10-12 10:00",
    "title": "Major Landslide in Nepal Blocks River Triggering Flash Floods and Downstream Evacuations",
    "summary": "네팔 고르카 지역에서 대규모 산사태가 발생해 부디 간다키 강이 막히며 하류 일대에 돌발 홍수가 발생하자 군 당국이 주민 대피령을 내리고 외국인을 포함한 49명을 긴급 구조했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/b1831fd/2147483647/strip/true/crop/3118x1754+0+0/resize/727x409!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F8d%2F9e6af3392e6e335001fdcd4f7d6d%2Fb3aa7b3339ee488ab9c7ac1552b2cf05",
    "sourceUrl": "https://www.thedailystar.net/news/world/news/us-justice-dept-probes-five-tv-networks-4296456"
  },
  {
    "timestamp": "2026-10-12 10:00",
    "title": "Ryobi Unveils New High-Efficiency Cordless Power Tool Lineup for Fall 2026",
    "summary": "전동공구 제조사 료비가 차세대 고효율 배터리 기술과 모터 성능을 강화한 신규 스마트 전동공구 3종을 공개하며 북미 작업 및 DIY 공구 시장 공략에 나섰습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://news.google.com/home/sections/CAQiS0NCQVNNZ29JTDIwdk1ETm5aRFVTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURkak1YWXFEZ29NRWdwVVpXTm9ibTlzYjJkNUtBQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRE5uWkRVU0FtVnVHZ0pWVXlnQVABUAE?hl=en-US&gl=US&ceid=US%3Aen"
  },
  {
    "timestamp": "2026-10-12 9:23",
    "title": "US Maternity Wards Face Widespread Closures as Federal Medicaid Reductions Take Effect",
    "summary": "메디케이드 연방 보조금 삭감이 본격 시행되면서 미국 전역의 지역 거점 병원 산부인과 병동이 잇따라 폐쇄 수순을 밟아 분만 취약지 임산부들의 의료 접근성이 심각하게 위협받고 있습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.theguardian.com/world/2026/oct/11/zelenskyy-trump-ukraine-russia-energy-ceasefire"
  },
  {
    "timestamp": "2026-10-12 9:23",
    "title": "Global Sovereign Bond Selloff Intensifies as Central Bankers Gather for IMF Meetings",
    "summary": "미 국채 10년물 금리가 하반기 70bp 이상 급등하며 전 세계 채권 시장의 불안이 가중되는 가운데 방콕에서 개막하는 IMF 연례 총회에서 각국 재정 건전성과 통화 정책 공조가 핵심 의제로 떠올랐습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://theedgemalaysia.com/node/821403"
  },
  {
    "timestamp": "2026-10-12 9:23",
    "title": "Hurricane Simon Swirls Parallel to Pacific Coast Threatening Southwestern Flooding",
    "summary": "동태평양을 북상 중인 대형 허리케인 사이먼이 멕시코 서안을 따라 이동하며 막대한 폭우를 뿌리고 있어 미국 남서부 및 캘리포니아 남부 지역에 돌발 홍수와 강풍 주의보가 내려졌습니다.",
    "imageUrl": "https://d3i6fh83elv35t.cloudfront.net/static/2026/10/2026-10-11T153051Z_720955666_RC231OA7SFDR_RTRMADP_3_STORM-SIMON-425x300.jpg",
    "sourceUrl": "https://www.pbs.org/newshour/latest"
  },
  {
    "timestamp": "2026-10-12 9:23",
    "title": "Off-Duty ICE Agent Shot Following Violent Altercation on Fresno California Lawn",
    "summary": "캘리포니아 프레즈노에서 비번이던 연방 이민세관단속국(ICE) 요원이 민간 주택 앞마당에서 주민 부녀와 심각한 물리적 다툼을 벌이던 중 총격을 입고 부상당해 수사가 확대되고 있습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://www.washingtontimes.com/"
  },
  {
    "timestamp": "2026-10-12 9:23",
    "title": "Growing Opposition Mounts Against Federal Plan to Livestream Capital Punishment Execution",
    "summary": "트럼프 행정부가 추진하는 연방 사형수의 사형 집행 온라인 생중계 계획에 대해 군 참사 유가족과 종교계의 거센 비판이 이어지고 있으며 교황청 또한 사형 제도의 불가함을 재차 선언했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://www.washingtontimes.com/"
  },
  {
    "timestamp": "2026-10-12 8:00",
    "title": "Federal Appeals Court Allows Social Media Addiction Lawsuits Against Tech Giants to Proceed",
    "summary": "미 연방 항소법원은 청소년 소셜미디어 중독 및 정신건강 유해성을 이유로 구글, 메타 등 빅테크 기업들을 상대로 제기된 대규모 손해배상 집단소송을 계속 진행할 수 있다는 판결을 내렸습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/f8132f2/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Ff0%2F20%2F7f279218dae6263be80c5fe177c6%2F8cd4a7c2520347879d49a52540dc5bc6",
    "sourceUrl": "https://www.cbsnews.com/tag/google/"
  },
  {
    "timestamp": "2026-10-12 8:00",
    "title": "President Donald Trump Holds Midterm Campaign Rally in Syracuse New York",
    "summary": "트럼프 대통령이 뉴욕주 시러큐스에서 대규모 중간선거 지원 유세를 열고 에너지 가격 안정, 자국 제조업 육성 및 강력한 국경 안보 정책을 전면에 내세우며 지지를 호소했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/1741a96/2147483647/strip/true/crop/6000x4000+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb7%2F7a%2F1bef7873cf806c83ea2beaca6f0f%2Fa85b6bf69df24da4997e6db1e009f468",
    "sourceUrl": "https://www.youtube.com/channel/UCHqC-yWZ1kri4YzwRSt6RGQ/live?app=desktop"
  },
  {
    "timestamp": "2026-10-12 8:00",
    "title": "Treasury Secretary Scott Bessent Defends Trump Administration Economic Policies",
    "summary": "스콧 베센트 미 재무장관이 폭스 뉴스에 출연해 현 행정부의 관세 부과와 세제 혜택 방안이 미국 중산층 일자리 보호와 지속 가능한 경제 성장을 위한 필수 조치라고 강조했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/c47099e/2147483647/strip/true/crop/8243x5495+0+0/resize/727x485!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F71%2F00%2F461c76108aee75c29da991ba2439%2F45c82a17a66f409198d8eed4bfff02e2",
    "sourceUrl": "https://www.youtube.com/channel/UCHqC-yWZ1kri4YzwRSt6RGQ/live?app=desktop"
  },
  {
    "timestamp": "2026-10-12 8:00",
    "title": "Multi-National Victims of Riyadh Airport Missile Attack Identified as Injuries Reach 309",
    "summary": "사우디 항공 당국은 리야드 공항 피격 사건의 사망자 12명 중 미국인 1명을 포함해 사우디, 방글라데시, 이집트 등 다국적 희생자들의 신원을 확인했으며 부상자가 309명으로 집계됐다고 밝혔습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/b1831fd/2147483647/strip/true/crop/3118x1754+0+0/resize/727x409!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2F4a%2F8d%2F9e6af3392e6e335001fdcd4f7d6d%2Fb3aa7b3339ee488ab9c7ac1552b2cf05",
    "sourceUrl": "https://www.cbsnews.com/live-updates/iran-war-trump-us-elections-saudi-arabia-yemen-houthis/"
  },
  {
    "timestamp": "2026-10-12 8:00",
    "title": "Kremlin Says Putin Relayed Iran's Position on Resolving Middle East Conflict to Trump",
    "summary": "러시아 크렘린궁은 블라디미르 푸틴 대통령이 도널드 트럼프 미국 대통령과의 최근 통화에서 호르무즈 해협 위기 완화 및 중동 사태 해결을 위한 이란 지도부의 공식 입장을 전달했다고 발표했습니다.",
    "imageUrl": "https://dims.apnews.com/dims4/default/893080f/2147483647/strip/true/crop/1200x792+0+0/resize/727x480!/quality/90/?url=https%3A%2F%2Fassets.apnews.com%2Fb8%2Fab%2Fccfb638a525420db636690b3b6a2%2Fcec657ef553943a6988f7d9b4d783021",
    "sourceUrl": "https://english.alarabiya.net/News/middle-east/2026/10/11/iran-says-us-response-to-its-proposal-to-reopen-strait-of-hormuz-was-insufficient-"
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

  // 2. 공백을 'T'로 치환한 ISO 형식 시도 (예: "2026-10-10 10:45")
  parsed = Date.parse(clean.replace(' ', 'T'));
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 3. 점/슬래시 구분자 정규화 후 시도 (예: "2026. 10. 10. 10:45")
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
    flair: { text: '구글뉴스 / Breaking', bgColor: '#DC2626', textColor: '#FFFFFF' },
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
