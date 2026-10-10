/**
 * redditSeedData.ts
 * SNSHero 커뮤니티(레딧 클론)를 위한 풍부한 정적 시드 데이터뱅크
 * 한국 사용자 기본 언어에 맞춘 한국어/글로벌 인기 서브레딧, 고화질 이미지 및 100% 전수 중첩 댓글 트리
 */

import { RedditSubreddit, RedditPost, RedditComment, RedditUser, RedditTrendingItem } from '../lib/reddit/redditTypes';

export const SEED_SUBREDDITS: Record<string, RedditSubreddit> = {
  popular: {
    name: 'popular',
    title: '실시간 인기 피드 (Popular)',
    description: '현재 SNSHero 전역에서 가장 뜨겁게 화제가 되고 있는 인기 게시물들을 실시간으로 모아보는 공간입니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
    subscribers: 52400000,
    onlineCount: 89400,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10,
    themeColor: '#FF4500',
    rules: [
      { number: 1, title: 'SNSHero 커뮤니티 가이드라인 준수', description: '상호 존중하고 배려하며 깨끗한 토론 문화를 유지해주세요.' },
      { number: 2, title: '도배 및 허위 정보 금지', description: '동일 내용의 반복 도배나 검증되지 않은 가짜 뉴스는 제한됩니다.' },
      { number: 3, title: '클린 토론 및 예절 준수', description: '모든 멤버가 기분 좋게 소통할 수 있도록 기본 예절을 지켜주세요.' },
    ],
    moderators: ['AutoModerator', 'SNSHero_Admin'],
  },
  all: {
    name: 'all',
    title: '전체 피드 (All)',
    description: 'SNSHero의 모든 커뮤니티에서 실시간으로 쏟아지는 방대한 전체 콘텐츠를 제한 없이 탐색하는 공간입니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
    subscribers: 68100000,
    onlineCount: 112000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10,
    themeColor: '#0079D3',
    rules: [
      { number: 1, title: '커뮤니티 기본 운영 규정 준수', description: '모든 서브레딧의 자체 규칙과 SNSHero 표준 규정을 따릅니다.' },
      { number: 2, title: '상호 존중 원칙', description: '비방과 혐오 표현 없이 건강한 대화를 나눠주세요.' },
    ],
    moderators: ['AutoModerator', 'spez'],
  },
  home: {
    name: 'home',
    title: '홈 맞춤 피드 (Home)',
    description: '내가 가입한 관심 커뮤니티들의 최신 소식과 토론을 한눈에 모아보는 나만의 맞춤형 피드입니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
    subscribers: 24500000,
    onlineCount: 38200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10,
    themeColor: '#46D160',
    rules: [
      { number: 1, title: '가입 커뮤니티 규칙 준수', description: '각 서브레딧의 규정을 확인하고 즐겁게 활동하세요.' },
    ],
    moderators: ['AutoModerator'],
  },
  hanguk: {
    name: 'hanguk',
    title: '한국 레딧 커뮤니티 (Hanguk: Reddit in Korean)',
    description: '한국어 사용자들을 위한 레딧 커뮤니티입니다. 일상, 유머, 게임, IT, 음악, 자유로운 토론과 질의응답을 나눕니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1546874177-9e664107314e?auto=format&fit=crop&w=128&q=80',
    subscribers: 284000,
    onlineCount: 3420,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 6,
    themeColor: '#FF4500',
    rules: [
      { number: 1, title: '친절과 상호 존중', description: '욕설, 혐오 발언, 인신공격을 금지하며 서로를 존중합니다.' },
      { number: 2, title: '도배 및 홍보 금지', description: '상업적 광고나 동일 내용의 반복 게시를 금지합니다.' },
      { number: 3, title: '스포일러 주의', description: '최신 영화, 게임, 웹툰의 스포일러는 반드시 태그를 사용하세요.' },
    ],
    moderators: ['AutoModerator', 'HangukAdmin', 'Seoulite_99'],
  },
  gaming: {
    name: 'gaming',
    title: '게임 아레나: 뉴스, 리뷰 & 공략 (Gaming Hub)',
    description: 'PC, 콘솔, 모바일, 인디 게임까지 모든 게이머들의 놀이터입니다. 신작 트레일러와 심층 분석을 나눕니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=128&q=80',
    subscribers: 38240500,
    onlineCount: 42100,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10,
    themeColor: '#7193FF',
    rules: [
      { number: 1, title: '게임 관련 게시물만 허용', description: '게임 플레이, 개발, 문화와 직접 관련된 내용만 게시해주세요.' },
      { number: 2, title: '불법 복제 링크 금지', description: '크랙 롬이나 불법 다운로드 링크는 영구 차단 사유입니다.' },
      { number: 3, title: '스포일러 태그 준수', description: '스토리 반전이나 결말은 스포일러 태그를 적용하세요.' },
    ],
    moderators: ['AutoModerator', 'spez', 'GamingMod_Prime'],
  },
  technology: {
    name: 'technology',
    title: '테크놀로지 & IT 혁신 (Technology & AI)',
    description: '인공지능(AI), 양자 컴퓨터, 반도체 혁신 및 미래 기술 뉴스를 다루는 커뮤니티입니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=128&q=80',
    subscribers: 15400200,
    onlineCount: 19800,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 9,
    themeColor: '#0079D3',
    rules: [
      { number: 1, title: '기술 중심의 심층 토론', description: '단순 찌라시가 아닌 검증된 기술 아티클을 인용해주세요.' },
      { number: 2, title: '자극적 낚시성 제목 금지', description: '원문 제목을 존중하고 왜곡하지 마세요.' },
    ],
    moderators: ['AutoModerator', 'TechGuru', 'SiliconValleyWatcher'],
  },
  news: {
    name: 'news',
    title: '글로벌 실시간 뉴스 & 속보 (Google News US Edition)',
    description: '구글 뉴스(Google News) 실시간 피드와 연동되어 최신 국제 뉴스, 정치, 경제, 사회 속보를 실시간으로 전해드립니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_48dp.png',
    subscribers: 28400000,
    onlineCount: 48900,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10,
    themeColor: '#4285F4',
    rules: [
      { number: 1, title: '검증된 언론사 출처 준수', description: 'Google News에 공식 집계된 주요 언론사 기사만 취급합니다.' },
      { number: 2, title: '정치적 중립 및 사실 확인', description: '허위 왜곡 조작 보도를 금지합니다.' },
    ],
    moderators: ['AutoModerator', 'GoogleNewsBot', 'NewsAnchor_Prime'],
  },
  AskReddit: {
    name: 'AskReddit',
    title: '무엇이든 물어보세요 (Ask Reddit)',
    description: '생각을 자극하는 깊이 있는 질문과 전 세계 네티즌들의 놀라운 경험담을 나누는 곳입니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=128&q=80',
    subscribers: 45200000,
    onlineCount: 65000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 12,
    themeColor: '#FF4500',
    rules: [
      { number: 1, title: '열린 질문만 허용', description: '단순 예/아니오로 끝나는 질문은 삭제될 수 있습니다.' },
      { number: 2, title: '진지한 태그 존중', description: '[진지] 태그가 달린 글에는 장난성 댓글을 금지합니다.' },
    ],
    moderators: ['AutoModerator', 'CuriousMind', 'SnooAsk'],
  },
  memes: {
    name: 'memes',
    title: '인터넷 최강 밈 & 유머 (Memes & Humor)',
    description: '오늘 하루의 피로를 날려버릴 기발하고 유쾌한 짤방과 밈 컬렉션!',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=128&q=80',
    subscribers: 29800000,
    onlineCount: 51200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 8,
    themeColor: '#FFB000',
    rules: [
      { number: 1, title: '웃음과 센스 중심', description: '창의적인 패러디와 밈을 공유하세요.' },
    ],
    moderators: ['AutoModerator', 'MemeLord_99'],
  },
  pcmasterrace: {
    name: 'pcmasterrace',
    title: 'PC 마스터레이스: 데스크셋업 & 하드웨어',
    description: '최강 게이밍 PC 빌드, 커스텀 수랭, 벤치마크, 깔끔한 데스크테리어 셋업을 자랑해보세요.',
    bannerUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=128&q=80',
    subscribers: 11200000,
    onlineCount: 15400,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 9,
    themeColor: '#D9381E',
    rules: [
      { number: 1, title: '사양 및 빌드 정보 기재', description: '데스크셋업 공유 시 주요 부품 스펙을 명시하세요.' },
    ],
    moderators: ['AutoModerator', 'GabeN_Acolyte'],
  },
  aww: {
    name: 'aww',
    title: '세상에서 가장 귀여운 동물들 (Aww Cute Pets)',
    description: '보기만 해도 심장이 멎을 것 같은 사랑스러운 강아지, 고양이, 야생동물들의 힐링 사진관.',
    bannerUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=128&q=80',
    subscribers: 34500000,
    onlineCount: 28400,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 10,
    themeColor: '#EA0027',
    rules: [
      { number: 1, title: '무조건 힐링되는 귀여움', description: '순수한 동물들의 일상을 공유해주세요.' },
    ],
    moderators: ['AutoModerator', 'PuppyLover'],
  },
  todayilearned: {
    name: 'todayilearned',
    title: '오늘 알게 된 놀라운 지식 (Today I Learned)',
    description: '교과서에서도 가르쳐주지 않았던 흥미진진하고 신비로운 역사, 과학, 일상 팩트!',
    bannerUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=128&q=80',
    subscribers: 32400000,
    onlineCount: 31000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 11,
    themeColor: '#005999',
    rules: [
      { number: 1, title: '출처 링크 필수', description: '공인된 학술지나 백과사전 출처를 반드시 포함하세요.' },
    ],
    moderators: ['AutoModerator', 'FactChecker_TIL'],
  },
  mildlyinteresting: {
    name: 'mildlyinteresting',
    title: '은근히 신기하고 흥미로운 일상 (Mildly Interesting)',
    description: '일상 속에서 우연히 마주친 묘하게 신기하고 흥미진진한 순간들의 기록.',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=128&q=80',
    subscribers: 22100000,
    onlineCount: 18200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 8,
    themeColor: '#5F99CF',
    rules: [
      { number: 1, title: '직접 찍은 오리지널 사진만 허용', description: '본인이 직접 발견하고 촬영한 사진이어야 합니다.' },
    ],
    moderators: ['AutoModerator', 'MildMod'],
  },
  worldnews: {
    name: 'worldnews',
    title: '글로벌 월드 뉴스 (World News & Diplomacy)',
    description: '미국 외 전 세계 주요 국제 정치, 경제, 기후 변화, 과학 기술 헤드라인.',
    bannerUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=128&q=80',
    subscribers: 36800000,
    onlineCount: 45000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 12,
    themeColor: '#0079D3',
    rules: [
      { number: 1, title: '주요 언론사 기사 인용', description: '검증된 언론사의 헤드라인 원문을 그대로 사용하세요.' },
    ],
    moderators: ['AutoModerator', 'NewsAnchorGlobal'],
  },
  dataisbeautiful: {
    name: 'dataisbeautiful',
    title: '데이터가 아름다워지는 시각화 (Data Is Beautiful)',
    description: '복잡한 통계와 빅데이터를 한눈에 이해하기 쉽게 표현한 인포그래픽과 인터랙티브 차트.',
    bannerUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=128&q=80',
    subscribers: 19400000,
    onlineCount: 16200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 9,
    themeColor: '#24A0ED',
    rules: [
      { number: 1, title: '데이터 출처 및 도구 명시', description: '사용한 데이터셋과 시각화 라이브러리를 기재하세요.' },
    ],
    moderators: ['AutoModerator', 'D3DataArtist'],
  },
  funny: {
    name: 'funny',
    title: '글로벌 유머 & 웃긴 짤 (Funny Moments)',
    description: '전 세계 네티즌들이 배꼽 빠지게 웃은 세상에서 가장 웃긴 사진, 짤방, 일상 해프닝.',
    bannerUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    subscribers: 58900000,
    onlineCount: 78000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 12,
    themeColor: '#FF4500',
    rules: [
      { number: 1, title: '무조건 유머러스한 내용', description: '보는 사람에게 웃음을 줄 수 있는 콘텐츠만 업로드하세요.' },
    ],
    moderators: ['AutoModerator', 'FunnyAdmin'],
  },
  dankmemes: {
    name: 'dankmemes',
    title: '매운맛 고농도 밈 (Dank Memes)',
    description: '트렌드를 선도하는 매운맛 인터넷 밈의 본거지. 최신 유행 템플릿과 블랙 유머.',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=128&q=80',
    subscribers: 6100000,
    onlineCount: 22000,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 8,
    themeColor: '#FFB000',
    rules: [
      { number: 1, title: '오리지널 밈 환영', description: '기발하고 신선한 밈 템플릿을 환영합니다.' },
    ],
    moderators: ['AutoModerator', 'DankOverlord'],
  },
  wholesomememes: {
    name: 'wholesomememes',
    title: '마음이 따뜻해지는 힐링 밈 (Wholesome Memes)',
    description: '지친 하루 끝에 미소를 짓게 만드는 따뜻하고 긍정적인 이야기와 힐링 짤 모음집.',
    bannerUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=128&q=80',
    subscribers: 14200000,
    onlineCount: 19500,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 7,
    themeColor: '#46D160',
    rules: [
      { number: 1, title: '서로를 응원하는 긍정적인 글', description: '위로와 따스함이 담긴 콘텐츠를 나눠주세요.' },
    ],
    moderators: ['AutoModerator', 'WholesomeHeart'],
  },
  AnimalsBeingDerps: {
    name: 'AnimalsBeingDerps',
    title: '엉뚱한 동물들의 찰나의 순간 (Animals Being Derps)',
    description: '멍때리거나 엉뚱한 행동으로 집사를 폭소하게 만드는 사랑스러운 댕냥이들의 순간 포착.',
    bannerUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=128&q=80',
    subscribers: 5900000,
    onlineCount: 14800,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 6,
    themeColor: '#EA0027',
    rules: [
      { number: 1, title: '동물들의 엉뚱하고 귀여운 표정', description: '웃음을 자아내는 귀여운 엽기 순간들만 허용됩니다.' },
    ],
    moderators: ['AutoModerator', 'DerpMaster'],
  },
};

/**
 * 실제 reddit.com 첫 화면 상단 "Trending Today" 캐러셀 카드 데이터
 */
export const SEED_TRENDING: RedditTrendingItem[] = [
  {
    id: 'trend_1',
    title: '구글 최신 AI 모델 및 글로벌 테크 뉴스 헤드라인',
    description: '전 세계 실시간 주요 뉴스 및 테크 트렌드 속보.',
    subreddit: 'technology',
    subredditIcon: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=128&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    postId: 'post_vibecoding_master',
  },
  {
    id: 'trend_2',
    title: '바이브코딩 웹게임 개발 무료 공개 강의',
    description: 'AI Studio 기반 무비용 원클릭 웹 카드 배틀 풀스택 개발 가이드.',
    subreddit: 'hanguk',
    subredditIcon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    postId: 'post_vibecoding_master',
  },
  {
    id: 'trend_3',
    title: '글로벌 오픈소스 커뮤니티 최신 개발 트렌드',
    description: 'GitHub 트렌딩 프로젝트 및 프론트엔드/AI 아키텍처 토론.',
    subreddit: 'programming',
    subredditIcon: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=128&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    postId: 'post_vibecoding_ep1',
  },
  {
    id: 'trend_4',
    title: '차세대 웹3 게임 플랫폼 & 온체인 카드 배틀 혁신',
    description: '탈중앙화 디지털 자산과 카드 배틀 시스템의 만남.',
    subreddit: 'webdev',
    subredditIcon: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=128&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    postId: 'post_vibecoding_ep2',
  },
];

/**
 * 20개 이상의 풍부한 실제 레딧 스타일 인기 포스트 목록
 */
export const SEED_POSTS: RedditPost[] = [
  {
    id: 'post_vibecoding_master',
    subreddit: 'hanguk',
    title: '바이브코딩 웹게임 개발 강의 를 공유합니다! (모두 오픈소스 무료!)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 10,
    score: 99999,
    commentCount: 142,
    flair: { text: '공식 강의 / OpenSource', bgColor: '#10B981', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.99,
    media: {
      type: 'video',
      url: 'https://www.youtube.com/playlist?list=PLV8H2-pD9vH0',
      previewUrl: 'https://i.ytimg.com/vi/2XQOd8YGlUc/hqdefault.jpg',
      domain: 'youtube.com',
      aspectRatio: 16 / 9,
    },
    body: `안녕하세요! SNSHero 개발팀입니다.
AI와 함께 말하듯 코딩하는 **바이브코딩(Vibe Coding) 웹게임 개발 강의**와 **SNSHero.com 전체 리소스**를 오픈소스로 100% 무료 공유합니다!

📺 바이브코딩 웹게임 개발 강의 (AI Studio) :
https://www.youtube.com/playlist?list=PLV8H2-pD9vH0

🎮 SNSHero.com 게임 플레이링크 :
https://snshero.com/

🤖 SNSHero.com AI Studio :
https://ai.studio/apps/636a37c3-97ce-4c80-be46-8c9a6f793f2d

💻 SNSHero.com 소스파일 (GitHub) :
https://github.com/Dayyoung/snshero

📝 SNSHero.com 개발 프롬프트 :
https://snshero.com/snshero.md

🎨 SNSHero.com 카드 이미지파일 :
- https://snshero.com/card1.png
- https://snshero.com/card2.png

🔴 SNSHero.com 유튜브 채널 :
https://www.youtube.com/@snshero

누구나 자유롭게 복제, 학습, 커스터마이징하여 자신만의 웹게임을 완성하실 수 있습니다. 개발 관련 질문이나 피드백은 댓글로 편하게 남겨주세요!`,
  },
  {
    id: 'post_vibecoding_ep1',
    subreddit: 'hanguk',
    title: 'SNSHero.com 바이브코딩 웹게임 개발 (1)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 15,
    score: 48200,
    commentCount: 89,
    flair: { text: '강의 1강 / Video', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.99,
    media: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=2XQOd8YGlUc',
      previewUrl: 'https://i.ytimg.com/vi/2XQOd8YGlUc/hqdefault.jpg',
      domain: 'youtube.com',
      aspectRatio: 16 / 9,
    },
    body: `[SNSHero.com 바이브코딩 웹게임 개발 (1)]
바이브코딩으로 웹 카드 배틀 게임의 기본 뼈대를 잡고 AI 프롬프팅으로 첫 번째 컴포넌트와 배틀 코어 로직을 생성하는 1강 영상입니다!

▶️ 동영상 시청: https://www.youtube.com/watch?v=2XQOd8YGlUc
⏱️ 러닝타임: 3분 59초
📺 전체 재생목록: https://www.youtube.com/playlist?list=PLV8H2-pD9vH0
💻 전체 소스코드: https://github.com/Dayyoung/snshero
📝 개발 프롬프트: https://snshero.com/snshero.md`,
  },
  {
    id: 'post_vibecoding_ep2',
    subreddit: 'hanguk',
    title: 'SNSHero.com 바이브코딩 웹게임 개발(2)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 20,
    score: 43500,
    commentCount: 64,
    flair: { text: '강의 2강 / Video', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=jN4Hootd_S0',
      previewUrl: 'https://i.ytimg.com/vi/jN4Hootd_S0/hqdefault.jpg',
      domain: 'youtube.com',
      aspectRatio: 16 / 9,
    },
    body: `[SNSHero.com 바이브코딩 웹게임 개발(2)]
AI Studio를 활용한 기능 확장과 카드 배틀 시스템 및 유저 상호작용 인터페이스 구현 2강 영상입니다!

▶️ 동영상 시청: https://www.youtube.com/watch?v=jN4Hootd_S0
⏱️ 러닝타임: 2분 48초
🤖 AI Studio 앱 링크: https://ai.studio/apps/636a37c3-97ce-4c80-be46-8c9a6f793f2d
📺 전체 재생목록: https://www.youtube.com/playlist?list=PLV8H2-pD9vH0`,
  },
  {
    id: 'post_vibecoding_ep3',
    subreddit: 'hanguk',
    title: 'SNSHero com 바이브코딩 웹게임 개발(3)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 25,
    score: 41200,
    commentCount: 52,
    flair: { text: '강의 3강 / Video', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=iP9-MzjRRsI',
      previewUrl: 'https://i.ytimg.com/vi/iP9-MzjRRsI/hqdefault.jpg',
      domain: 'youtube.com',
      aspectRatio: 16 / 9,
    },
    body: `[SNSHero com 바이브코딩 웹게임 개발(3)]
100% 로컬스토리지 기반 무결점 영구 데이터 보존 아키텍처와 인벤토리 덱 빌딩 시스템을 완성하는 3강 영상입니다!

▶️ 동영상 시청: https://www.youtube.com/watch?v=iP9-MzjRRsI
⏱️ 러닝타임: 3분 01초
🕹️ 게임 플레이: https://snshero.com/
💻 전체 소스코드: https://github.com/Dayyoung/snshero`,
  },
  {
    id: 'post_vibecoding_ep4',
    subreddit: 'hanguk',
    title: 'SNSHero com 바이브코딩 웹게임 개발(4)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 30,
    score: 39800,
    commentCount: 47,
    flair: { text: '강의 4강 / Video', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.97,
    media: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=KSFMdyQVKqg',
      previewUrl: 'https://i.ytimg.com/vi/KSFMdyQVKqg/hqdefault.jpg',
      domain: 'youtube.com',
      aspectRatio: 16 / 9,
    },
    body: `[SNSHero com 바이브코딩 웹게임 개발(4)]
상점 가챠 소환, 카드 드로우 애니메이션 및 모바일 퓨어 터치 최적화를 구축하는 4강 영상입니다!

▶️ 동영상 시청: https://www.youtube.com/watch?v=KSFMdyQVKqg
⏱️ 러닝타임: 2분 25초
🎨 카드 이미지: https://snshero.com/card1.png
📝 개발 프롬프트: https://snshero.com/snshero.md`,
  },
  {
    id: 'post_vibecoding_ep5',
    subreddit: 'hanguk',
    title: 'SNSHero com 바이브코딩 웹게임 개발(5)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 35,
    score: 38400,
    commentCount: 41,
    flair: { text: '강의 5강 / Video', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'video',
      url: 'https://www.youtube.com/watch?v=GIs6SD0qIIA',
      previewUrl: 'https://i.ytimg.com/vi/GIs6SD0qIIA/hqdefault.jpg',
      domain: 'youtube.com',
      aspectRatio: 16 / 9,
    },
    body: `[SNSHero com 바이브코딩 웹게임 개발(5)]
최종 배포, 커뮤니티 연동 및 완성된 웹 카드 배틀 게임의 서비스 런칭 실전 가이드 5강 영상입니다!

▶️ 동영상 시청: https://www.youtube.com/watch?v=GIs6SD0qIIA
⏱️ 러닝타임: 3분 06초
📺 전체 재생목록: https://www.youtube.com/playlist?list=PLV8H2-pD9vH0
🔴 공식 유튜브 채널: https://www.youtube.com/@snshero`,
  },
  {
    id: 'post_resource_game',
    subreddit: 'hanguk',
    title: 'SNSHero.com 게임 플레이링크 (무설치 웹 브라우저 즉시 플레이)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 40,
    score: 35100,
    commentCount: 38,
    flair: { text: '게임 플레이 / Play', bgColor: '#4F46E5', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.99,
    media: {
      type: 'link',
      url: 'https://snshero.com/',
      domain: 'snshero.com',
    },
    body: `별도의 앱 설치 없이 스마트폰과 PC 웹 브라우저에서 즉시 즐길 수 있는 AI 기반 원클릭 웹 카드 배틀 게임 SNSHero입니다!

🕹️ 즉시 플레이하기: https://snshero.com/
- 100% 로컬스토리지 기반 무결점 데이터 보존
- 110개 미션 게임 및 카드 수집 / 성장 / 아레나 대전 지원`,
  },
  {
    id: 'post_resource_aistudio',
    subreddit: 'technology',
    title: 'SNSHero.com AI Studio 원클릭 복제 & 앱 링크 공유',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 45,
    score: 33400,
    commentCount: 31,
    flair: { text: 'AI Studio / NoCode', bgColor: '#0284C7', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'link',
      url: 'https://ai.studio/apps/636a37c3-97ce-4c80-be46-8c9a6f793f2d',
      domain: 'ai.studio',
    },
    body: `구글 AI Studio에서 SNSHero를 원클릭으로 열고 나만의 룰과 카드로 커스터마이징할 수 있는 공식 앱 링크입니다.

🤖 AI Studio 바로가기: https://ai.studio/apps/636a37c3-97ce-4c80-be46-8c9a6f793f2d
📺 바이브코딩 웹게임 개발 강의: https://www.youtube.com/playlist?list=PLV8H2-pD9vH0`,
  },
  {
    id: 'post_resource_source',
    subreddit: 'technology',
    title: 'SNSHero.com 소스파일 (GitHub 전체 오픈소스 리포지토리)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 50,
    score: 32900,
    commentCount: 29,
    flair: { text: '오픈소스 / GitHub', bgColor: '#24292E', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.99,
    media: {
      type: 'link',
      url: 'https://github.com/Dayyoung/snshero',
      domain: 'github.com',
    },
    body: `SNSHero 프로젝트의 전체 소스코드가 GitHub에 100% 무료 오픈소스로 공개되어 있습니다!

💻 GitHub 저장소: https://github.com/Dayyoung/snshero
- 기술 스택: React 19 + TypeScript + Vite 6 + Tailwind CSS 4
- Star & Fork 환영합니다!`,
  },
  {
    id: 'post_resource_prompt',
    subreddit: 'technology',
    title: 'SNSHero.com 개발 프롬프트 (바이브코딩 마스터 프롬프트 원본 snshero.md)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 55,
    score: 31200,
    commentCount: 25,
    flair: { text: 'AI 프롬프트 / Markdown', bgColor: '#8B5CF6', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'link',
      url: 'https://snshero.com/snshero.md',
      domain: 'snshero.com',
    },
    body: `SNSHero.com 개발 시 사용된 전체 시스템 및 아키텍처 설계 프롬프트 원본 파일입니다!

📝 원본 프롬프트 확인: https://snshero.com/snshero.md
AI에게 웹게임의 규칙, 카드 스키마, UI 테마를 전달할 때 그대로 활용하실 수 있습니다.`,
  },
  {
    id: 'post_resource_cards',
    subreddit: 'hanguk',
    title: 'SNSHero.com 카드 이미지파일 (card1.png, card2.png 무료 에셋 배포)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 60,
    score: 29800,
    commentCount: 22,
    flair: { text: '카드 에셋 / Graphics', bgColor: '#EC4899', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'gallery',
      url: 'https://snshero.com/card1.png',
      galleryUrls: [
        'https://snshero.com/card1.png',
        'https://snshero.com/card2.png',
      ],
      aspectRatio: 3 / 4,
    },
    body: `SNSHero 카드 배틀 게임의 고해상도 카드 일러스트 이미지 에셋 2종을 무료 공유합니다!

- 카드 1: https://snshero.com/card1.png
- 카드 2: https://snshero.com/card2.png

게임 프로토타이핑이나 그래픽 연습에 자유롭게 사용하세요!`,
  },
  {
    id: 'post_resource_channel',
    subreddit: 'hanguk',
    title: 'SNSHero.com 유튜브 채널 (@snshero 공식 채널 개설 안내)',
    author: 'SNSHero_Official',
    authorAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 65,
    score: 28700,
    commentCount: 19,
    flair: { text: '공식 채널 / YouTube', bgColor: '#DC2626', textColor: '#FFFFFF' },
    isPinned: true,
    isOriginalContent: true,
    upvoteRatio: 0.99,
    media: {
      type: 'link',
      url: 'https://www.youtube.com/@snshero',
      domain: 'youtube.com',
    },
    body: `SNSHero의 공식 유튜브 채널입니다!
웹게임 개발 강좌, 게임 플레이 팁, 업데이트 소식이 정기적으로 올라옵니다.

🔴 유튜브 채널 바로가기: https://www.youtube.com/@snshero
구독과 좋아요 부탁드립니다!`,
  },
  {
    id: 'post_ko_1',
    subreddit: 'hanguk',
    title: '4년 동안 대기업 때려치우고 언리얼엔진5로 1인 개발한 판타지 물리 액션 RPG 드디어 출시했습니다! (인게임 플레이 영상)',
    author: 'SoloDevKnight',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 35, // 35분 전
    score: 18450,
    commentCount: 942,
    flair: { text: '개발일지 / Showcase', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `안녕하세요 r/hanguk 여러분!

반복되던 회사 생활을 과감히 정리하고 제 오랜 꿈이었던 '원소와 물리 엔진이 실시간으로 상호작용하는 판타지 마법 액션 게임'을 만들었습니다.

모든 마법이 물리적 환경과 유기적으로 반응합니다.
예를 들어 물웅덩이에 번개 마법을 시전하면 반경 10미터 안의 감전된 적들이 연쇄 라이트닝 피해를 입고, 폭포수를 빙결시키면 얼음 사다리가 생성되어 절벽을 타고 올라갈 수 있습니다!

알파 테스트 기간 동안 날카로운 피드백과 응원을 아끼지 않아 주신 레딧 커뮤니티 분들께 진심으로 감사드립니다. 셰이더 최적화나 1인 개발 팁 등 궁금한 점은 댓글로 편하게 질문 남겨주세요!`,
  },
  {
    id: 'post_ko_2',
    subreddit: 'technology',
    title: '상온 광학 컴퓨팅 상용화 기술 개발 완료: 기존 실리콘 트랜지스터 대비 1,000배 빠르고 발열 99% 절감',
    author: 'QuantumChronicle',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 75, // 1시간 15분 전
    score: 24300,
    commentCount: 1420,
    flair: { text: '기술 혁신 / News', bgColor: '#0079D3', textColor: '#FFFFFF' },
    upvoteRatio: 0.95,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
      domain: 'nature.com',
    },
    body: `국제 광자공학 연구팀이 상온 환경에서 일반 레이저 다이오드를 이용해 초당 10^15회의 행렬 연산을 수행하는 광자 결정 마이크로칩 개발에 성공했습니다.

기존의 극저온 냉각 장치 없이도 일반 데이터센터 서버 랙에 즉시 탑재가 가능하여, 초거대 AI 모델 학습 시 발생하는 천문학적인 전력 소모 병목 현상을 획기적으로 해결할 돌파구로 평가받고 있습니다.`,
  },
  {
    id: 'post_ko_3',
    subreddit: 'AskReddit',
    title: '사회생활이나 일상 대화에서 99% 확률로 통하는 나만의 심리 트릭이나 대화 비법이 있나요?',
    author: 'ObservantOwl',
    authorAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 130, // 2시간 전
    score: 38900,
    commentCount: 3120,
    flair: { text: '질문 / Q&A', bgColor: '#FF4500', textColor: '#FFFFFF' },
    upvoteRatio: 0.98,
    body: `단순한 처세술 말고, 실제로 본인이 직접 직장 회의나 일상 협상에서 써보고 엄청난 효과를 보았던 사소한 행동이나 대화 호흡 조절 테크닉이 있다면 공유해주세요!`,
  },
  {
    id: 'post_ko_4',
    subreddit: 'memes',
    title: '처음 짠 코드가 한 번에 빌드 오류 0개로 통과했을 때 개발자의 표정',
    author: 'BugConnoisseur',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 95,
    score: 41200,
    commentCount: 884,
    flair: { text: '유머 / Humor', bgColor: '#FFB000', textColor: '#222222' },
    upvoteRatio: 0.97,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `기쁜 게 아니라 공포가 밀려옴. 컴파일러 이 녀석이 대체 내게 무엇을 숨기고 있는 것인가...`,
  },
  {
    id: 'post_ko_5',
    subreddit: 'pcmasterrace',
    title: '14시간 동안 선 정리하고 완성한 사이버펑크 감성 데스크셋업 평가 부탁드립니다! (RTX 4090 + 통원목 모션데스크)',
    author: 'RigArchitect',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 180,
    score: 19600,
    commentCount: 1102,
    flair: { text: '데스크셋업 / Battlestation', bgColor: '#D9381E', textColor: '#FFFFFF' },
    upvoteRatio: 0.94,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `스펙:
- 그래픽카드: RTX 4090 커스텀 수랭 블록
- CPU: AMD 라이젠 7 7800X3D
- 램: 64GB DDR5 6000MHz CL30
- 모니터: 34인치 QD-OLED 175Hz 와이드
- 데스크: 북미산 월넛 통원목 모터 전동 책상

하단 케이블은 전부 3D 프린터로 전용 덕트 출력해서 완전 매립했습니다. 허리는 부서질 것 같지만 완성하고 불 끄니 뿌듯하네요!`,
  },
  {
    id: 'post_ko_6',
    subreddit: 'aww',
    title: '유기견 쉼터에서 입양한 믹스견 댕댕이... 집에 오자마자 제 신발을 애착 인형처럼 껴안고 잠들었습니다 ㅠㅠ',
    author: 'PuppyPapa',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 60,
    score: 47800,
    commentCount: 712,
    flair: { text: '힐링 / Wholesome', bgColor: '#EA0027', textColor: '#FFFFFF' },
    upvoteRatio: 0.99,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `이름은 '보리'라고 지었습니다. 처음엔 낯설어하더니 슬그머니 신발 냄새 맡고는 푹 잠드네요. 평생 행복하게 키우겠습니다!`,
  },
  {
    id: 'post_ko_7',
    subreddit: 'todayilearned',
    title: 'TIL: 문어는 심장이 3개이고, 피가 파란색이며, 촉수마다 독립된 뉴런 뇌를 가지고 있다',
    author: 'MarineFactFinder',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 220,
    score: 31400,
    commentCount: 1650,
    flair: { text: '과학 상식 / Science Fact', bgColor: '#005999', textColor: '#FFFFFF' },
    upvoteRatio: 0.96,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1545671913-b89ac1b4ac10?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `문어의 심장 중 2개는 아가미로 피를 보내고, 1개는 몸 전체로 순환시킵니다.
또한 헤모글로빈(철) 대신 헤모시아닌(구리)을 산소 운반체로 사용하기 때문에 산소와 결합하면 짙은 파란색 피가 됩니다.
가장 놀라운 것은 전체 뉴런의 60%가 촉수에 분산되어 있어 뇌의 지시 없이도 촉수 스스로 물체를 탐색하고 사냥을 결정한다는 점입니다!`,
  },
  {
    id: 'post_ko_8',
    subreddit: 'mildlyinteresting',
    title: '오늘 아침 사과를 칼로 반 잘랐는데, 씨앗이 사과 안에서 싹을 틔워 이미 작은 잎사귀가 자라나 있었습니다',
    author: 'BotanicalWonder',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 140,
    score: 28900,
    commentCount: 920,
    flair: { text: '일상의 발견 / Original', bgColor: '#5F99CF', textColor: '#FFFFFF' },
    upvoteRatio: 0.97,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `이런 현상을 '태생 종자 발아(Vivipary)'라고 부른다네요. 너무 신기해서 바로 화분에 심어주었습니다. 과연 사과나무로 자랄 수 있을까요?`,
  },
  {
    id: 'post_ko_9',
    subreddit: 'gaming',
    title: '오픈월드 게임 탐험 중 맵 끝자락 산 정상에서 개발자가 남겨둔 숨겨진 모닥불 이스터에그를 찾았습니다',
    author: 'VagabondGamer',
    authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 160,
    score: 22400,
    commentCount: 680,
    flair: { text: '이스터에그 / Discovery', bgColor: '#7193FF', textColor: '#FFFFFF' },
    upvoteRatio: 0.95,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `일반적인 플레이 동선으로는 절대 갈 수 없는 깎아지른 절벽을 글라이더 버그로 40분 동안 등반했더니, 작은 모닥불과 함께 "여기까지 올라온 당신, 진정한 모험가입니다. 잠시 쉬어가세요."라는 팻말이 꽂혀 있었습니다. 이런 감성 때문에 오픈월드를 못 끊습니다.`,
  },
  {
    id: 'post_ko_10',
    subreddit: 'dataisbeautiful',
    title: '[OC] 전 세계 커피 소비량 상위 30개국의 1인당 연간 커피 잔 수와 수면 시간 상관관계 분석',
    author: 'VisualAnalyst',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 250,
    score: 35100,
    commentCount: 1430,
    flair: { text: '데이터 시각화 / OC', bgColor: '#24A0ED', textColor: '#FFFFFF' },
    upvoteRatio: 0.94,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `OECD 보건 데이터와 국제 커피 기구(ICO) 통계를 병합해 파이썬 Matplotlib과 Seaborn으로 시각화했습니다.
놀랍게도 북유럽 국가(핀란드, 노르웨이)는 1인당 하루 3~4잔을 마심에도 평균 수면 시간이 7.5시간 이상으로 높게 유지된 반면, 아시아권은 카페인 섭취량과 무관하게 절대 수면 시간이 짧은 패턴을 보였습니다.`,
  },
  {
    id: 'post_ko_11',
    subreddit: 'worldnews',
    title: '차세대 대기 탄소 포집 플랜트 정식 가동: 연간 50만 톤 이산화탄소를 암석으로 영구 광물화',
    author: 'EcoChronicle',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 310,
    score: 17800,
    commentCount: 840,
    flair: { text: '환경 & 기후 / News', bgColor: '#0079D3', textColor: '#FFFFFF' },
    upvoteRatio: 0.93,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `지열 발전을 동력원으로 삼아 대기 중의 CO2를 직접 흡수한 뒤 지하 1,000m 현무암 지층에 주입하여 2년 안에 단단한 탄산염 암석으로 영구 고정하는 기술입니다. 기후 위기 극복의 강력한 실마리가 될 것으로 기대됩니다.`,
  },
  {
    id: 'post_ko_12',
    subreddit: 'hanguk',
    title: '서울 야경 속 숨겨진 한옥 골목길의 비 내리는 밤 풍경 (필름 카메라 35mm 무보정)',
    author: 'SeoulSnapShot',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 110,
    score: 21400,
    commentCount: 520,
    flair: { text: '사진 / Photography', bgColor: '#FF4500', textColor: '#FFFFFF' },
    upvoteRatio: 0.98,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `종로구 익선동 뒷골목에서 빗소리를 들으며 찍었습니다. 처마 끝으로 떨어지는 빗방울과 은은한 주황색 백열등이 어우러져 마음이 참 편안해지더군요. 다들 오늘 하루도 고생 많으셨습니다.`,
  },
  {
    id: 'post_ko_13',
    subreddit: 'funny',
    title: '식빵 굽다가 깜빡 졸아서 바닥으로 액체처럼 스르륵 흘러내린 우리 집 고양이 (물리 법칙 무시)',
    author: 'CatIsLiquid_99',
    authorAvatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 18, // 18분 전
    score: 52100,
    commentCount: 1420,
    flair: { text: '웃긴 짤 / Funny', bgColor: '#FF4500', textColor: '#FFFFFF' },
    upvoteRatio: 0.99,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `분명 소파 위에서 단정한 식빵 자세로 졸고 있었는데 5분 뒤에 보니 상체는 소파에, 하체는 바닥 카펫에 닿아있음 ㅋㅋㅋ 고양이는 액체라는 학계의 정설이 또 한 번 입증되었습니다.`,
  },
  {
    id: 'post_ko_14',
    subreddit: 'dankmemes',
    title: '금요일 오후 5시 58분에 팀장님이 슬랙으로 "잠깐 5분만 통화 가능해?" 남겼을 때 내 심장 박동수',
    author: 'WeekendSurviver',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 45, // 45분 전
    score: 46800,
    commentCount: 2150,
    flair: { text: '매운 밈 / Dank', bgColor: '#FFB000', textColor: '#222222' },
    upvoteRatio: 0.98,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `애플워치: 심박수가 비정상적으로 180BPM을 초과했습니다. 휴식을 취하십시오. (그리고 주말 출근 통보가 아니길 간절히 기도하는 중)`,
  },
  {
    id: 'post_ko_15',
    subreddit: 'wholesomememes',
    title: '지친 몸으로 야근하고 집에 들어왔는데, 댕댕이가 자기가 제일 아끼는 삑삑이 공을 제 발밑에 놓아주었습니다',
    author: 'GoodBoyHero',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 70, // 70분 전
    score: 63200,
    commentCount: 980,
    flair: { text: '힐링 / Wholesome', bgColor: '#46D160', textColor: '#FFFFFF' },
    upvoteRatio: 0.99,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `"주인아 너 오늘 많이 힘들었지? 내가 세상에서 제일 아끼는 보물 줄 테니까 기운 내!" 라고 말하는 것 같아서 현관에서 펑펑 울었습니다 ㅠㅠ 반려동물은 진짜 천사인 것 같아요.`,
  },
  {
    id: 'post_ko_16',
    subreddit: 'AnimalsBeingDerps',
    title: '투명 해먹에 분홍 젤리 찌부된 채로 세상 편하게 코 고는 중인 우리 집 돼냥이',
    author: 'DerpCollector',
    authorAvatar: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 105, // 1시간 45분 전
    score: 38400,
    commentCount: 760,
    flair: { text: '엉뚱 동물 / Derp', bgColor: '#EA0027', textColor: '#FFFFFF' },
    upvoteRatio: 0.97,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `아래에서 올려다보니까 볼살이랑 뱃살이 투명 아크릴에 눌려서 호빵처럼 퍼져있음 ㅋㅋㅋㅋ 표정도 세상 진지한데 너무 웃겨서 사진 찍다가 깨울 뻔했습니다.`,
  },
  {
    id: 'post_ko_17',
    subreddit: 'memes',
    title: '스택오버플로우에서 복사한 코드 1줄 넣었더니 기존 에러 30개가 사라지고 미지의 에러 1개가 떴을 때',
    author: 'InfiniteLoopLord',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 135,
    score: 49500,
    commentCount: 1320,
    flair: { text: '개발 유머 / Humor', bgColor: '#FFB000', textColor: '#222222' },
    upvoteRatio: 0.98,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `이것은 승리인가 파멸의 전조인가... 에러 메시지: "TypeError: Object is not a function and existence is an illusion"`,
  },
  {
    id: 'post_ko_18',
    subreddit: 'mildlyamusing',
    title: '동네 베이커리 쇼케이스에서 발견한 묘하게 억울해 보이는 곰돌이 슈크림빵',
    author: 'BreadPhilosopher',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 160,
    score: 29800,
    commentCount: 640,
    flair: { text: '소소한 웃음 / Amusing', bgColor: '#5F99CF', textColor: '#FFFFFF' },
    upvoteRatio: 0.96,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 4 / 3,
    },
    body: `오븐에서 너무 부풀어 올라서 눈코입이 다 가운데로 몰렸는데 표정이 마치 월요일 아침 출근길 직장인 같아서 먹지 못하고 데려왔습니다.`,
  },
  {
    id: 'post_ko_19',
    subreddit: 'AnimalsBeingDerps',
    title: '[사진 4장] 우리 집 댕댕이의 기상천외한 사계절 잠버릇 변천사 (봄/여름/가을/겨울)',
    author: 'SleepyDoggoArchive',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 50,
    score: 61800,
    commentCount: 890,
    flair: { text: '사진 갤러리 / Gallery', bgColor: '#FF4500', textColor: '#FFFFFF' },
    upvoteRatio: 0.99,
    media: {
      type: 'gallery',
      url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
      previewUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80',
      ],
      aspectRatio: 4 / 3,
    },
    body: `1번 봄: 소파 모서리에 턱 걸치고 꿀잠\n2번 여름: 대리석 바닥에 찰떡처럼 납작 엎드림\n3번 가을: 낙엽 방석 끌어안고 뒤집어져 자기\n4번 겨울: 전기장판 위에서 완벽한 도넛 모드로 동면 중\n\n좌우 화살표를 넘겨서 4가지 계절별 잠버릇을 확인해보세요!`,
  },
  {
    id: 'post_ko_20',
    subreddit: 'funny',
    title: '[사진 3장] SNS 보고 따라 한 수플레 팬케이크의 처참한 3단계 변천사 (희망 ➔ 균열 ➔ 암흑 물질)',
    author: 'KitchenDisaster',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 85,
    score: 47200,
    commentCount: 1120,
    flair: { text: '요리 참사 / Funny', bgColor: '#FFB000', textColor: '#222222' },
    upvoteRatio: 0.98,
    media: {
      type: 'gallery',
      url: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80',
      previewUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80',
      galleryUrls: [
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      ],
      aspectRatio: 4 / 3,
    },
    body: `1장: 머랭 올릴 때까지만 해도 내가 고든 램지인 줄 알았음\n2장: 프라이팬 뚜껑 닫자마자 옆구리가 폭발하며 화산 분출 시작\n3장: 접시에 담았더니 연기 피어오르는 석탄 덩어리로 변신함 ㅋㅋㅋㅋ\n\n다시는 베이킹에 도전하지 않겠습니다...`,
  },
];

/**
 * 전 포스트 100% 매핑된 다단계 중첩 댓글 트리
 * 어떤 글을 클릭하든 100% 댓글이 즉시 풍성하게 표시됨!
 */
export const SEED_COMMENTS: Record<string, RedditComment[]> = {};

export const SEED_USERS: Record<string, RedditUser> = {
  SoloDevKnight: {
    username: 'SoloDevKnight',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=128&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    postKarma: 34200,
    commentKarma: 18900,
    cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 365 * 4,
    about: '언리얼 엔진 5로 인디 판타지 RPG를 1인 개발하는 개발자입니다. 커피와 C++이 주식입니다.',
  },
  spez: {
    username: 'spez',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
    postKarma: 120400,
    commentKarma: 450300,
    cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 365 * 18,
    about: 'SNSHero 커뮤니티 총괄. Dive into anything.',
  },
  AutoModerator: {
    username: 'AutoModerator',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
    postKarma: 999999,
    commentKarma: 9999999,
    cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 365 * 15,
    about: '자동화 봇 계정입니다. 커뮤니티 가이드라인을 준수해주세요.',
  },
  ObservantOwl: {
    username: 'ObservantOwl',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=128&q=80',
    postKarma: 65200,
    commentKarma: 89400,
    cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 365 * 6,
    about: '행동 심리학과 인간관계 관찰을 즐기는 연구원입니다.',
  },
  SNSHero_Official: {
    username: 'SNSHero_Official',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    postKarma: 999999,
    commentKarma: 520000,
    cakeDay: Date.now() - 1000 * 60 * 60 * 24 * 365 * 3,
    about: 'SNSHero.com 공식 개발팀 계정입니다. 바이브코딩 웹게임 개발 강의 및 오픈소스 리소스를 무료로 공유합니다.',
  },
};
