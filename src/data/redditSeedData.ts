/**
 * redditSeedData.ts
 * SNSHero 커뮤니티(레딧 클론)를 위한 풍부한 정적 시드 데이터뱅크
 * 한국 사용자 기본 언어에 맞춘 한국어/글로벌 인기 서브레딧, 고화질 이미지 및 중첩 댓글 트리
 */

import { RedditSubreddit, RedditPost, RedditComment, RedditUser } from '../lib/reddit/redditTypes';

export const SEED_SUBREDDITS: Record<string, RedditSubreddit> = {
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
  CryptoCurrency: {
    name: 'CryptoCurrency',
    title: '암호화폐 & 블록체인 라운지 (Web3 & Crypto)',
    description: '비트코인, 이더리움, 레이어2, 웹3 온체인 기술과 거시 경제 흐름을 논합니다.',
    bannerUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1400&q=80',
    iconUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=128&q=80',
    subscribers: 8900000,
    onlineCount: 14200,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 365 * 7,
    themeColor: '#F7931A',
    rules: [
      { number: 1, title: '선동 및 스캠 링크 엄금', description: '피싱 사이트나 검증되지 않은 러그풀은 영구 밴입니다.' },
    ],
    moderators: ['AutoModerator', 'SatoshiDisciple'],
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
};

export const SEED_POSTS: RedditPost[] = [
  {
    id: 'post_ko_1',
    subreddit: 'hanguk',
    title: '4년 동안 대기업 때려치우고 언리얼엔진5로 1인 개발한 판타지 물리 액션 RPG 드디어 출시했습니다! (인게임 플레이 영상)',
    author: 'SoloDevKnight',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 45, // 45분 전
    score: 18450,
    commentCount: 942,
    flair: { text: '개발일지 / Showcase', bgColor: '#FF4500', textColor: '#FFFFFF' },
    isOriginalContent: true,
    upvoteRatio: 0.98,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      previewUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
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
    createdAt: Date.now() - 1000 * 60 * 120, // 2시간 전
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
    createdAt: Date.now() - 1000 * 60 * 210, // 3시간 전
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
    subreddit: 'CryptoCurrency',
    title: '이더리움 영지식 증명(ZK-Rollup) 확장성 업그레이드 완료: 초당 10만 건 처리, 수수료 1원 미만 실현',
    author: 'EtherNaut_42',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
    createdAt: Date.now() - 1000 * 60 * 300,
    score: 11200,
    commentCount: 965,
    flair: { text: '프로토콜 뉴스', bgColor: '#F7931A', textColor: '#FFFFFF' },
    upvoteRatio: 0.91,
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
      aspectRatio: 16 / 9,
    },
    body: `전 세계 클라이언트 노드가 성공적으로 하드포크에 합의했습니다. 스마트 컨트랙트 가스비가 0.0008달러(약 1원) 수준으로 수렴하여 전 세계 실생활 소액 결제 생태계로 진입할 준비를 마쳤습니다.`,
  },
];

export const SEED_COMMENTS: Record<string, RedditComment[]> = {
  post_ko_1: [
    {
      id: 'c_k1_1',
      postId: 'post_ko_1',
      parentId: null,
      author: 'IndieGamerFan',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80',
      authorKarma: 41200,
      createdAt: Date.now() - 1000 * 60 * 40,
      score: 1540,
      body: `물리 상호작용 시스템 진짜 미쳤네요 ㄷㄷ 혹시 비가 올 때 공중에서 떨어지는 빗방울도 얼려서 고드름처럼 적에게 꽂히는 방식도 구현되어 있나요? 스팀 위시리스트에 바로 등록했습니다!`,
      replies: [
        {
          id: 'c_k1_1_1',
          postId: 'post_ko_1',
          parentId: 'c_k1_1',
          author: 'SoloDevKnight',
          authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
          authorKarma: 9850,
          createdAt: Date.now() - 1000 * 60 * 30,
          score: 890,
          isAuthorOp: true,
          body: `알아봐 주셔서 정말 감사합니다! 네, 정확합니다! 폭우가 내리는 날씨에 광역 빙결 마법을 시전하면 공중의 빗방울이 순식간에 날카로운 얼음 파편으로 동결되어 적들에게 관통 데미지를 줍니다! 파티클 충돌 연산 최적화하느라 6개월 동안 고생했는데 이렇게 알아봐 주시니 너무 감격스럽습니다 ㅠㅠ`,
          replies: [
            {
              id: 'c_k1_1_1_1',
              postId: 'post_ko_1',
              parentId: 'c_k1_1_1',
              author: 'VFX_Wizard',
              authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80',
              authorKarma: 12400,
              createdAt: Date.now() - 1000 * 60 * 20,
              score: 340,
              body: `컴퓨트 셰이더로 파티클 공간 해싱 처리하셨나요? 프레임 드랍 전혀 없는 게 진짜 장인정신이네요.`,
              replies: [
                {
                  id: 'c_k1_1_1_1_1',
                  postId: 'post_ko_1',
                  parentId: 'c_k1_1_1_1',
                  author: 'SoloDevKnight',
                  authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=64&q=80',
                  authorKarma: 9850,
                  createdAt: Date.now() - 1000 * 60 * 10,
                  score: 215,
                  isAuthorOp: true,
                  body: `맞습니다! 나이아가라 GPU 시뮬레이션 기반에 공간 해싱 커스텀 모듈을 물려 GTX 1060에서도 60프레임 방어되게 깎았습니다 ㅎㅎ`,
                },
              ],
            },
          ],
        },
        {
          id: 'c_k1_1_2',
          postId: 'post_ko_1',
          parentId: 'c_k1_1',
          author: 'SteamDeckEnthusiast',
          authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&q=80',
          authorKarma: 6540,
          createdAt: Date.now() - 1000 * 60 * 25,
          score: 180,
          body: `스팀덱 컨트롤러 조작도 완벽 지원하나요? 패드 지원하면 출시일 당일 바로 결제 갑니다!`,
        },
      ],
    },
    {
      id: 'c_k1_2',
      postId: 'post_ko_1',
      parentId: null,
      author: 'EpicLootMaster',
      authorAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=64&q=80',
      authorKarma: 8400,
      createdAt: Date.now() - 1000 * 60 * 35,
      score: 620,
      body: `4년 동안의 노력이 빛을 발하네요. 1인 개발 끝까지 완주하는 사람 1%도 안 되는데 정말 존경스럽습니다. 응원합니다!`,
    },
  ],
  post_ko_3: [
    {
      id: 'c_k3_1',
      postId: 'post_ko_3',
      parentId: null,
      author: 'QuietNegotiator',
      authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=64&q=80',
      authorKarma: 56300,
      createdAt: Date.now() - 1000 * 60 * 190,
      score: 14200,
      body: `**전략적 4초 침묵의 법칙.**

회의나 연봉 협상에서 상대방이 터무니없거나 만족스럽지 않은 제안을 했을 때, 화내거나 반박하지 말고 편안한 눈빛으로 상대방을 응시하며 정확히 4초 동안 입을 다무세요.

인간은 사회적 공백(어색한 침묵)을 본능적으로 견디지 못합니다. 십중팔구 상대방이 스스로 침묵을 깨려고 부연 설명을 하거나, 스스로 조건을 완화해서 알아서 타협안을 제시합니다.`,
      replies: [
        {
          id: 'c_k3_1_1',
          postId: 'post_ko_3',
          parentId: 'c_k3_1',
          author: 'HR_Director_Anon',
          authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80',
          authorKarma: 19800,
          createdAt: Date.now() - 1000 * 60 * 150,
          score: 4100,
          body: `인사팀 10년 차인데 격하게 공감합니다. 침묵을 유지하면 상대방은 '내가 너무 무리한 요구를 했나?' 하고 지레 겁먹고 스스로 금액을 깎아서 다시 제안합니다.`,
        },
      ],
    },
  ],
};

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
};
