/**
 * redditCommentGenerator.ts
 * 포스트의 서브레딧, 제목 및 본문 맥락을 분석하여
 * 100% 주제에 부합하는 지능형 고품질 댓글/대댓글을 생성하는 엔진
 */

import { RedditPost, RedditComment } from './redditTypes';

export type PostTopic = 'game' | 'tech' | 'ask' | 'meme' | 'hardware' | 'crypto' | 'korea' | 'general';

export function detectPostTopic(post: RedditPost): PostTopic {
  const sub = (post.subreddit || '').toLowerCase();
  const title = (post.title || '').toLowerCase();
  const body = (post.body || '').toLowerCase();
  const combined = `${sub} ${title} ${body}`;

  if (sub === 'gaming' || /rpg|언리얼|인디\s*게임|스팀|steam|게임|플레이|play|game|닌텐도|ps5|xbox/i.test(combined)) {
    return 'game';
  }
  if (sub === 'technology' || /ai|인공지능|컴퓨팅|광학|반도체|양자|quantum|chip|mit|코드|개발자|소프트웨어|tech/i.test(combined)) {
    return 'tech';
  }
  if (sub === 'askreddit' || /질문|조언|침묵|경험|어떻게|방법|팁|인생|생각|ask|advice/i.test(combined)) {
    return 'ask';
  }
  if (sub === 'memes' || /밈|meme|드립|유머|웃긴|레전드|짤|lol|funny/i.test(combined)) {
    return 'meme';
  }
  if (sub === 'pcmasterrace' || /pc|데스크|셋업|battlestation|모니터|쿨러|gpu|rtx|케이블/i.test(combined)) {
    return 'hardware';
  }
  if (sub === 'cryptocurrency' || /crypto|비트코인|이더리움|코인|zk|롤업|블록체인|web3/i.test(combined)) {
    return 'crypto';
  }
  if (sub === 'hanguk' || /한국|서울|korea|hanguk/i.test(combined)) {
    return 'korea';
  }

  return 'general';
}

interface CommentTemplate {
  author: string;
  avatarSeed: number;
  bodyKo: string;
  bodyEn: string;
  replyKo?: string;
  replyEn?: string;
  replyAuthor?: string;
}

const TEMPLATES_BY_TOPIC: Record<PostTopic, CommentTemplate[]> = {
  game: [
    {
      author: 'ActionRPG_Lover',
      avatarSeed: 1535713875,
      bodyKo: '타격감이랑 스킬 시각 효과가 시원시원하네요! 조작감이나 패드 진동 피드백도 잘 구현되었는지 궁금합니다.',
      bodyEn: 'The impact and skill effects look satisfying! Does it support haptic gamepad feedback?',
      replyKo: '게임패드 완전 대응 및 듀얼센스 햅틱 피드백 적용되어 있습니다! 피드백 감사합니다 ㅎㅎ',
      replyEn: 'Full controller support with haptic feedback is included! Thanks!',
    },
    {
      author: 'PixelCraftsman',
      avatarSeed: 1507003211,
      bodyKo: '1인 개발로 이 정도 퀄리티와 물리 액션을 뽑아내시다니 대단합니다. 스팀 위시리스트에 바로 담았습니다.',
      bodyEn: 'Incredible physics action for a solo dev project. Added to my Steam wishlist!',
    },
    {
      author: 'LoreSeeker_99',
      avatarSeed: 1494790108,
      bodyKo: '보스전 패턴이 꽤 다채로워 보이네요. 난이도 조절이나 소울라이크 요소도 포함되어 있나요?',
      bodyEn: 'Boss mechanics look diverse. Does it have difficulty settings or soulslike elements?',
      replyKo: '이지/노멀/하드 난이도 분기와 함께 패링/회피 중심의 깊이 있는 전투 시스템을 지향했습니다!',
      replyEn: 'It features difficulty options along with parry/dodge focused combat depth!',
    },
    {
      author: 'IndieGamer_KR',
      avatarSeed: 1506794778,
      bodyKo: '사운드 디자인과 BGM 분위기가 게임 아트 스타일이랑 찰떡이네요. 얼리액세스 로드맵 응원합니다.',
      bodyEn: 'The sound design and OST fit the art style perfectly. Best of luck on early access!',
    },
    {
      author: 'BenchMark_Tester',
      avatarSeed: 1544005313,
      bodyKo: '언리얼5 루멘/나나이트 최적화 프레임 방어는 어떤가요? 저사양 PC나 스팀덱 호환성도 기대됩니다.',
      bodyEn: 'How is performance with UE5 Lumen/Nanite? Hope it runs well on Steam Deck too.',
      replyKo: '스팀덱 60fps 타깃 최적화 프로파일링을 마쳤습니다. 안심하고 즐기실 수 있습니다!',
      replyEn: 'We tested and optimized for 60fps on Steam Deck. Plays smoothly!',
    },
    {
      author: 'ComboMaster',
      avatarSeed: 1528894463,
      bodyKo: '스킬 쿨타임 연계 콤보 시스템이 무궁무진해 보이네요. 정식 출시되면 바로 플레이 영상 찍어봐야겠습니다.',
      bodyEn: 'Combo synergy looks endless. Will definitely stream this once released.',
    },
  ],
  tech: [
    {
      author: 'Quantum_Thinker',
      avatarSeed: 1534528741,
      bodyKo: '기존 전자 소자의 열 발생 한계를 빛의 굴절과 간섭으로 돌파했다는 점이 정말 혁신적이네요. 논문 전문 읽어보는 중입니다.',
      bodyEn: 'Overcoming thermal limitations using light interference is truly innovative. Reading the full paper.',
      replyKo: '광학 컴퓨팅의 상용화 수율이 관건이었는데, 실리콘 포토닉스 공정 연계가 핵심 돌파구인 것 같습니다.',
      replyEn: 'Silicon photonics manufacturing integration seems to be the key breakthrough.',
    },
    {
      author: 'SiliconObserver',
      avatarSeed: 1519389950,
      bodyKo: '상온 작동이 가능하다는 게 가장 큰 메리트네요. 극저온 냉각 설비 없이 데이터센터에 바로 꽂을 수 있다면 전력 절감이 어마어마할 듯합니다.',
      bodyEn: 'Room-temperature operation is huge. Eliminating cryogenic cooling will save massive power in data centers.',
    },
    {
      author: 'CodeArchitect',
      avatarSeed: 1500648767,
      bodyKo: 'FPGA나 기존 PCIe 인터페이스와의 호환 레이어가 어떻게 구성되었는지 구체적인 아키텍처 다이어그램이 궁금합니다.',
      bodyEn: 'Curious about how the interface layer connects with existing PCIe/FPGA architectures.',
    },
    {
      author: 'AI_Researcher_Lee',
      avatarSeed: 1517841905,
      bodyKo: '대규모 트랜스포머 모델의 행렬 곱셈 연산(GEMM) 지연 시간을 수십 배 단축할 수 있는 잠재력이 있어 보입니다.',
      bodyEn: 'This could significantly accelerate matrix multiplication latency in large Transformer models.',
    },
    {
      author: 'TechAnalyst_Pro',
      avatarSeed: 1524504388,
      bodyKo: '기술 데모 이후 실제 파운드리 양산 단계까지의 타임라인이 기대됩니다. 좋은 소식 공유 감사합니다.',
      bodyEn: 'Excited to see the timeline from lab demo to foundry mass production. Great share!',
    },
  ],
  ask: [
    {
      author: 'WiseNegotiator',
      avatarSeed: 1516321318,
      bodyKo: '이거 진짜 실생활에서 써먹어봤는데 100% 효과 있습니다. 침묵이 흐르면 상대방이 불안해서 먼저 추가 혜택이나 양보안을 꺼내놓더군요.',
      bodyEn: 'Tried this in real life and it 100% works. The silence makes the other side offer concessions first.',
      replyKo: '맞습니다. 심리학에서 말하는 침묵의 공백 채우기 효과(Silence Void)죠. 특히 연봉 협상에서 위력적입니다.',
      replyEn: 'Exactly. The conversational void compels people to speak and compromise.',
    },
    {
      author: 'MindfulWalker',
      avatarSeed: 1492562080,
      bodyKo: '질문이나 반박을 듣고 바로 대답하지 않고 3~4초 숨을 고르는 것만으로도 훨씬 신중하고 카리스마 있어 보입니다.',
      bodyEn: 'Pausing 3-4 seconds before responding makes you sound much more thoughtful and confident.',
    },
    {
      author: 'OfficeVeteran',
      avatarSeed: 1472099645,
      bodyKo: '단, 상대방이 질문했을 때 멍때리는 표정보다는 온화하게 눈을 마주치며 고개를 끄덕이는 게 포인트입니다.',
      bodyEn: 'Key tip: keep gentle eye contact while nodding so you do not look spaced out.',
    },
    {
      author: 'CuriousSoul_42',
      avatarSeed: 1535713875,
      bodyKo: '회의에서 성급하게 말실수하는 버릇이 있었는데, 이 방법 오늘부터 바로 실천해봐야겠네요. 유용한 팁 감사합니다!',
      bodyEn: 'I often spoke too fast in meetings. Will definitely practice this technique starting today!',
    },
  ],
  meme: [
    {
      author: 'MemeConnoisseur',
      avatarSeed: 1579783902,
      bodyKo: '아 진짜 보다가 뿜었네 ㅋㅋㅋㅋ 표정 싱크로율 실화냐고요 ㅋㅋㅋㅋㅋ',
      bodyEn: 'LMAO I spat out my coffee! The facial expression is way too accurate!',
      replyKo: '월요일 아침 출근길 내 표정 그 자체임 ㅋㅋㅋㅋ',
      replyEn: 'Literally my exact face on Monday morning commutes haha.',
    },
    {
      author: 'DankLord_99',
      avatarSeed: 1534447677,
      bodyKo: '이 짤 만든 사람 최소 인생 2회차 ㅋㅋㅋㅋㅋ 저장하고 단톡방에 뿌렸습니다.',
      bodyEn: 'Whoever made this meme is a genius. Saved and shared with my group chat.',
    },
    {
      author: 'GiggleFactory',
      avatarSeed: 1517841905,
      bodyKo: '오늘 하루 종일 일 때문에 스트레스 받았는데 이거 보고 시원하게 웃고 갑니다 ㅋㅋㅋ',
      bodyEn: 'Had a stressful work day, but this cheered me right up. Thanks!',
    },
  ],
  hardware: [
    {
      author: 'CableManagementGod',
      avatarSeed: 1587202372,
      bodyKo: '후면 케이블 정리 상태가 거의 예술 작품이네요. 케이블 타이 어떤 규격 쓰셨나요?',
      bodyEn: 'Cable management is an absolute work of art. What ties did you use?',
      replyKo: '벨크로 스트랩이랑 알루미늄 케이블 가이드 트레이로 깔끔하게 정리했습니다 ㅎㅎ',
      replyEn: 'Used velcro straps and aluminum routing trays! Thanks!',
    },
    {
      author: 'RGB_Enthusiast',
      avatarSeed: 1591488320,
      bodyKo: '간접 앰비언트 라이트 조명 색온도 조절이 진짜 고급스럽네요. 눈도 안 아프고 집중 잘 될 듯합니다.',
      bodyEn: 'The warm ambient backlighting looks super premium and easy on the eyes.',
    },
    {
      author: 'SilentCoolingFan',
      avatarSeed: 1528894463,
      bodyKo: '풀로드 시 팬 소음이랑 GPU 온도는 몇 도 정도로 유지되나요? 케이스 흡기 배기 구조가 좋아 보입니다.',
      bodyEn: 'What are the GPU temps under full load? Airflow looks very well optimized.',
    },
  ],
  crypto: [
    {
      author: 'ZK_Researcher',
      avatarSeed: 1518770660,
      bodyKo: '영지식 증명(ZK-SNARK) 압축 알고리즘을 온체인 검증 비용과 어떻게 밸런싱했는지가 핵심이네요. 분석 잘 봤습니다.',
      bodyEn: 'The trade-off between ZK-SNARK proving time and on-chain verification gas is the key highlight.',
    },
    {
      author: 'OnChainAnalyst',
      avatarSeed: 1506703719,
      bodyKo: 'L2 롤업 브릿지 유동성 락업(TVL) 추이를 보면 확실히 기술적 신뢰도가 높아진 게 체감됩니다.',
      bodyEn: 'TVL growth across L2 rollup bridges clearly shows rising technical trust.',
    },
  ],
  korea: [
    {
      author: 'Seoulite_Walker',
      avatarSeed: 1538485399,
      bodyKo: '한국 커뮤니티에서 이런 양질의 정보와 토론을 볼 수 있어서 정말 유익하네요. 추천 누르고 갑니다!',
      bodyEn: 'Great to see such high-quality discussion in the Korean community. Upvoted!',
      replyKo: '함께 공감해주셔서 감사합니다! 앞으로도 좋은 글 많이 나누겠습니다.',
      replyEn: 'Thank you for reading and sharing your thoughts!',
    },
    {
      author: 'HangukExplorer',
      avatarSeed: 1546874177,
      bodyKo: '자세한 경험담과 후기 공유해주셔서 큰 도움이 되었습니다. 다음 글도 기대할게요!',
      bodyEn: 'Sharing your detailed experience helped a lot. Looking forward to your next post!',
    },
  ],
  general: [
    {
      author: 'CommunityThinker',
      avatarSeed: 1535713875,
      bodyKo: '핵심을 찌르는 글이네요. 본문에서 언급하신 내용에 깊이 공감하며 배움을 얻고 갑니다.',
      bodyEn: 'Spot-on post. Strongly agree with your points and learned something new.',
      replyKo: '좋게 봐주셔서 감사합니다! 건설적인 피드백 언제나 환영합니다.',
      replyEn: 'Thank you for the constructive feedback!',
    },
    {
      author: 'InsightSeeker',
      avatarSeed: 1507003211,
      bodyKo: '서로 다른 관점에서도 한 번 더 곱씹어보게 되는 좋은 토론 거리입니다. 업보트 드립니다.',
      bodyEn: 'A thought-provoking topic from different perspectives. Have an upvote.',
    },
    {
      author: 'CuriousObserver',
      avatarSeed: 1494790108,
      bodyKo: '많은 분들이 이 글을 보고 함께 이야기 나눌 수 있으면 좋겠네요. 실시간 공유 감사합니다.',
      bodyEn: 'Hope more people see this and join the conversation. Thanks for sharing!',
    },
  ],
};

/**
 * 포스트의 맥락에 100% 부합하는 지능형 추가 댓글들을 생성
 */
export function generateContextualCommentsForPost(
  post: RedditPost,
  count: number = 5,
  startIndex: number = 0,
  isKo: boolean = true
): RedditComment[] {
  const topic = detectPostTopic(post);
  const templates = TEMPLATES_BY_TOPIC[topic] || TEMPLATES_BY_TOPIC.general;
  const now = Date.now();

  const results: RedditComment[] = [];

  for (let i = 0; i < count; i++) {
    const templateIdx = (startIndex + i) % templates.length;
    const template = templates[templateIdx];
    const uniqueId = `c_smart_${post.id}_${startIndex + i + 1}`;
    const commentScore = Math.max(15, Math.floor(post.score * 0.15) - i * 8);

    const replies: RedditComment[] = [];
    if (template.replyKo && (i % 2 === 0 || count <= 3)) {
      replies.push({
        id: `${uniqueId}_r1`,
        postId: post.id,
        parentId: uniqueId,
        author: template.replyAuthor || post.author,
        authorAvatar: post.authorAvatar || `https://images.unsplash.com/photo-${template.avatarSeed}?auto=format&fit=crop&w=64&q=80`,
        authorKarma: 12500,
        createdAt: now - 1000 * 60 * (10 + (startIndex + i) * 3),
        score: Math.max(8, Math.floor(commentScore * 0.6)),
        isAuthorOp: true,
        body: isKo ? template.replyKo : (template.replyEn || template.replyKo),
      });
    }

    results.push({
      id: uniqueId,
      postId: post.id,
      parentId: null,
      author: `${template.author}_${(startIndex + i + 1)}`,
      authorAvatar: `https://images.unsplash.com/photo-${template.avatarSeed}?auto=format&fit=crop&w=64&q=80`,
      authorKarma: 15400 + (startIndex + i) * 450,
      createdAt: now - 1000 * 60 * (20 + (startIndex + i) * 4),
      score: commentScore,
      body: isKo ? template.bodyKo : template.bodyEn,
      replies,
    });
  }

  return results;
}
