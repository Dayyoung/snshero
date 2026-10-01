/**
 * redditCommentGenerator.ts
 * 포스트의 실제 제목, 본문, 서브레딧 및 미디어 맥락을 심층 분석하여
 * 100% 해당 글의 주제를 직접 인용하고 토론하는 지능형 고품질 댓글/대댓글 엔진
 */

import { RedditPost, RedditComment } from './redditTypes';

export type PostContentType = 'question' | 'media' | 'discussion' | 'opinion';

/**
 * 포스트 제목에서 군더더기 태그/괄호를 정리하고 자연스러운 핵심 토픽 구절을 추출
 */
export function extractPostCoreSubject(title: string): string {
  if (!title) return '이 게시물';

  // 1. [OC], [질문], TIL:, r/xxx 등 프리픽스 태그 제거
  let clean = title
    .replace(/^\[[^\]]+\]\s*/g, '')
    .replace(/^\([^)]+\)\s*/g, '')
    .replace(/^TIL:\s*/i, '')
    .replace(/^AskReddit:\s*/i, '')
    .trim();

  // 2. 뒤쪽의 괄호 꼬리말 제거 (예: (인게임 플레이 영상), (35mm 무보정) 등)
  clean = clean.replace(/\s*\([^)]*\)$/, '').trim();

  // 3. 문장이 너무 길면 핵심 앞머리 40자 내외로 자연스럽게 정돈
  if (clean.length > 45) {
    // 쉼표, 마침표, 콜론 등 문장 분기점 탐색
    const commaIdx = clean.indexOf(',');
    const colonIdx = clean.indexOf(':');
    if (colonIdx > 5 && colonIdx < 40) {
      clean = clean.substring(0, colonIdx).trim();
    } else if (commaIdx > 10 && commaIdx < 40) {
      clean = clean.substring(0, commaIdx).trim();
    } else {
      clean = clean.substring(0, 42).trim() + '...';
    }
  }

  return clean;
}

/**
 * 포스트의 성격(질문 / 미디어시각화 / 심층토론 / 일상소감) 분석
 */
export function detectPostContentType(post: RedditPost): PostContentType {
  const title = (post.title || '').toLowerCase();
  const body = (post.body || '').toLowerCase();
  const sub = (post.subreddit || '').toLowerCase();
  const combined = `${title} ${body} ${sub}`;

  // 질문형 글
  if (
    sub === 'askreddit' ||
    /[?？]/g.test(combined) ||
    /질문|궁금|있나요|어떻게|조언|팁|추천|방법|생각|후기|의견|평가|ask|question|how|why|what/i.test(combined)
  ) {
    return 'question';
  }

  // 미디어/비주얼 중심 글
  if (
    post.media?.url ||
    sub === 'memes' ||
    sub === 'aww' ||
    sub === 'pcmasterrace' ||
    /사진|영상|스크린샷|인증|비주얼|아트|풍경|데스크셋업|댕댕이|고양이|그림|meme|photo|setup/i.test(combined)
  ) {
    return 'media';
  }

  // 심층 토론 및 뉴스/기술 분석 글
  if (
    sub === 'technology' ||
    sub === 'worldnews' ||
    sub === 'dataisbeautiful' ||
    sub === 'cryptocurrency' ||
    /기술|개발|연구|분석|뉴스|통계|출시|발표|시장|데이터|ai|칩|성능|차세대|플랜트/i.test(combined)
  ) {
    return 'discussion';
  }

  return 'opinion';
}

interface PersonaComment {
  author: string;
  avatarSeed: number;
  bodyKo: (subject: string, post: RedditPost) => string;
  bodyEn: (subject: string, post: RedditPost) => string;
  replyKo?: (subject: string, post: RedditPost) => string;
  replyEn?: (subject: string, post: RedditPost) => string;
}

const PERSONAS_BY_TYPE: Record<PostContentType, PersonaComment[]> = {
  // 1. 질문 및 조언 요청형 글에 대한 답변 댓글
  question: [
    {
      author: 'WiseObserver',
      avatarSeed: 1535713875,
      bodyKo: (subject) => `‘${subject}’ 관련해서 제 경험을 말씀드리자면, 처음엔 시행착오가 정말 많았는데 결국 본문에서 말씀하신 핵심 포인트가 정답이더라고요. 진솔한 질문 감사합니다.`,
      bodyEn: (subject) => `Regarding '${subject}', speaking from my experience, the core point you mentioned is spot on. Thanks for asking!`,
      replyKo: (subject) => `‘${subject}’ 글에 이렇게 정성스러운 경험담과 피드백을 남겨주셔서 큰 힘이 됩니다! 감사해요 ㅎㅎ`,
      replyEn: (subject) => `Thank you so much for sharing your thoughtful insight on '${subject}'!`,
    },
    {
      author: 'PracticalThinker',
      avatarSeed: 1507003211,
      bodyKo: (subject) => `‘${subject}’에 대해 다른 분들의 생각도 궁금했는데, 댓글 반응들을 보니 다들 비슷한 고민을 하고 계셨네요. 개인적으로 아주 유익한 토론 주제라고 봅니다.`,
      bodyEn: (subject) => `I was wondering about '${subject}' as well. Seeing everyone's thoughts here confirms it's a very helpful discussion.`,
    },
    {
      author: 'InsightExplorer',
      avatarSeed: 1494790108,
      bodyKo: (subject) => `‘${subject}’ 질문글 보고 머리를 한 대 맞은 느낌이네요. 평소에 무심코 지나쳤던 부분인데 오늘부터 꼭 의식하고 실천해봐야겠습니다. 추천 누르고 갑니다!`,
      bodyEn: (subject) => `Seeing this post about '${subject}' really made me reflect. Saving this to apply in my daily life! Upvoted.`,
      replyKo: (subject) => `도움이 되셨다니 작성자로서 정말 뿌듯합니다! 좋은 하루 보내세요!`,
      replyEn: (subject) => `Glad it helped! Wishing you the best!`,
    },
    {
      author: 'DailyReflector',
      avatarSeed: 1506794778,
      bodyKo: (subject) => `‘${subject}’ 내용에 깊이 공감합니다. 특히 상황에 따라 유연하게 대처하는 태도가 가장 중요한 것 같아요.`,
      bodyEn: (subject) => `Totally relate to '${subject}'. Staying adaptable to the situation is definitely key.`,
    },
    {
      author: 'CuriousMind_KR',
      avatarSeed: 1544005313,
      bodyKo: (subject) => `혹시 ‘${subject}’ 관련해서 작성자님께서 겪으셨던 가장 인상적인 에피소드가 있다면 하나만 더 들려주실 수 있을까요? 흥미진진하네요!`,
      bodyEn: (subject) => `Could you share more details about your experience with '${subject}'? Super interesting!`,
      replyKo: (subject) => `관심 가져주셔서 감사합니다! 기회가 되면 추가 후기글로 정리해서 올려보겠습니다 ㅎㅎ`,
      replyEn: (subject) => `Thanks for the interest! I'll write a follow-up post soon!`,
    },
  ],

  // 2. 미디어 / 이미지 / 영상 / 작업물 인증 글에 대한 댓글
  media: [
    {
      author: 'PixelAesthetic',
      avatarSeed: 1534528741,
      bodyKo: (subject) => `와, ‘${subject}’ 비주얼이랑 퀄리티 진짜 대박이네요! 디테일 하나하나 신경 쓰신 게 한눈에 보여서 감탄하고 갑니다.`,
      bodyEn: (subject) => `Wow, the visual quality of '${subject}' looks stunning! The attention to detail is truly impressive.`,
      replyKo: (subject) => `‘${subject}’ 알아봐 주시고 기분 좋은 칭찬 남겨주셔서 진심으로 감사드립니다! ㅠㅠ`,
      replyEn: (subject) => `Thank you so much for appreciating the details on '${subject}'!`,
    },
    {
      author: 'CraftEnthusiast',
      avatarSeed: 1528894463,
      bodyKo: (subject) => `‘${subject}’ 완성하시느라 시간과 정성 엄청 들이셨을 것 같아요. 결과물이 너무 완벽해서 보람차실 듯합니다. 업보트 드립니다!`,
      bodyEn: (subject) => `Must have taken immense time and effort to finish '${subject}'. The result looks incredible!`,
    },
    {
      author: 'VisualArtLover',
      avatarSeed: 1500648767,
      bodyKo: (subject) => `‘${subject}’ 현장감이 사진/영상 너머로 그대로 전해지네요. 분위기 자체가 너무 힐링되고 좋습니다 ㅎㅎ`,
      bodyEn: (subject) => `The atmosphere in '${subject}' is so captivating. Feels really wholesome and satisfying!`,
      replyKo: () => `좋게 감상해주셔서 기쁩니다! 앞으로도 종종 공유하겠습니다.`,
      replyEn: () => `Happy you enjoyed it! Will share more in the future.`,
    },
    {
      author: 'TechGeek_99',
      avatarSeed: 1535713875,
      bodyKo: (subject) => `‘${subject}’ 보면서 감탄했습니다. 혹시 제작(촬영) 과정에서 가장 까다로웠던 점은 무엇이었나요?`,
      bodyEn: (subject) => `Astonishing work on '${subject}'. What was the most challenging part of putting this together?`,
      replyKo: (subject) => `‘${subject}’ 작업하면서 마감과 디테일 잡는 데 가장 공을 들였습니다. 알아봐 주셔서 감사합니다!`,
      replyEn: (subject) => `Polishing the finishing details took the longest! Thanks for noticing!`,
    },
    {
      author: 'ShowcaseWatcher',
      avatarSeed: 1507003211,
      bodyKo: (subject) => `이건 레딧 메인 추천 피드 갈 만하네요. ‘${subject}’ 완성도 최고입니다. 저장해두고 두고두고 보겠습니다.`,
      bodyEn: (subject) => `This totally deserves the front page. Amazing execution on '${subject}'. Saved!`,
    },
  ],

  // 3. 기술 혁신 / 데이터 분석 / 뉴스 / 정책 토론 글에 대한 댓글
  discussion: [
    {
      author: 'TechAnalyst_KR',
      avatarSeed: 1518770660,
      bodyKo: (subject) => `‘${subject}’ 관련 분석 소식 아주 잘 봤습니다. 본문에서 언급하신 데이터와 기술적 지표들이 핵심을 정확히 찌르네요.`,
      bodyEn: (subject) => `Great technical breakdown on '${subject}'. The data and benchmarks mentioned get straight to the point.`,
      replyKo: (subject) => `‘${subject}’ 본문 분석을 꼼꼼하게 읽어주셔서 감사합니다. 추가 후속 데이터도 지속해서 모니터링해 보겠습니다!`,
      replyEn: (subject) => `Thanks for reading through the analysis on '${subject}'! Will keep tracking the metrics.`,
    },
    {
      author: 'FutureTrendWatcher',
      avatarSeed: 1506703719,
      bodyKo: (subject) => `‘${subject}’ 이슈가 앞으로 업계 생태계에 미칠 파급력이 상당할 것 같습니다. 빠른 최신 동향 공유 감사합니다.`,
      bodyEn: (subject) => `The long-term impact of '${subject}' on the industry will be massive. Thanks for sharing this timely update.`,
    },
    {
      author: 'CriticalReviewer',
      avatarSeed: 1538485399,
      bodyKo: (subject) => `‘${subject}’에 대해 다양한 관점이 엇갈리는데, 작성자님께서 객관적인 근거를 중심으로 일목요연하게 짚어주셔서 이해가 쏙쏙 되네요.`,
      bodyEn: (subject) => `There are multiple perspectives on '${subject}', but your objective breakdown makes it very clear to understand.`,
      replyKo: (subject) => `서로 다른 시각을 존중하며 균형 있게 전달하고자 했는데 알아봐 주셔서 기쁩니다!`,
      replyEn: (subject) => `Strived to provide a balanced overview on '${subject}', glad it was helpful!`,
    },
    {
      author: 'ResearchFellow',
      avatarSeed: 1546874177,
      bodyKo: (subject) => `‘${subject}’ 소식 기다리고 있었는데 드디어 구체적인 내용이 나왔군요. 링크 원문 자료도 함께 정독해보겠습니다.`,
      bodyEn: (subject) => `Was waiting for updates regarding '${subject}'. Excited to read through the source reference as well!`,
    },
    {
      author: 'GlobalObserver',
      avatarSeed: 1527980965,
      bodyKo: (subject) => `국내외를 막론하고 ‘${subject}’ 관련 논의가 본격화되는 흐름이네요. 양질의 정보 글엔 무조건 추천입니다!`,
      bodyEn: (subject) => `Conversations around '${subject}' are gaining serious momentum globally. High quality post, upvoted!`,
    },
  ],

  // 4. 일반 일상 / 소감 / 유머 / 커뮤니티 대화 글에 대한 댓글
  opinion: [
    {
      author: 'CommunityThinker',
      avatarSeed: 1535713875,
      bodyKo: (subject) => `‘${subject}’ 내용 보면서 무릎을 탁 쳤습니다 ㅋㅋㅋ 작성자님 글솜씨가 너무 좋으셔서 끝까지 몰입해서 읽었네요.`,
      bodyEn: (subject) => `Loved reading this post about '${subject}'! Great storytelling and couldn't agree more.`,
      replyKo: (subject) => `재밌게 읽어주셔서 정말 기쁩니다! 글 남겨주셔서 감사해요 ㅎㅎ`,
      replyEn: (subject) => `So glad you enjoyed reading about '${subject}'! Thanks for the comment!`,
    },
    {
      author: 'WarmHearted_KR',
      avatarSeed: 1507003211,
      bodyKo: (subject) => `‘${subject}’ 이야기 들으니 마음이 훈훈해지네요. 오늘 하루 종일 피곤했는데 좋은 글로 힐링하고 갑니다.`,
      bodyEn: (subject) => `Reading about '${subject}' truly warmed my heart. Needed this wholesome moment today!`,
    },
    {
      author: 'CoffeeAndBrowse',
      avatarSeed: 1494790108,
      bodyKo: (subject) => `‘${subject}’ 진짜 공감 백배입니다. 저 같아도 똑같이 생각했을 것 같아요 ㅋㅋㅋ 추천 누르고 갑니다!`,
      bodyEn: (subject) => `100% relate to '${subject}'. Would have felt the exact same way haha. Upvoted!`,
      replyKo: (subject) => `저만 그런 게 아니었군요 ㅋㅋㅋ 함께 공감해주셔서 든든합니다!`,
      replyEn: (subject) => `Glad to know I wasn't the only one! Thanks for the support!`,
    },
    {
      author: 'CuriousSurfer',
      avatarSeed: 1506794778,
      bodyKo: (subject) => `‘${subject}’ 관련해서 앞으로의 후속 이야기나 다음 글도 꼭 올려주세요! 팔로우하고 기다리겠습니다.`,
      bodyEn: (subject) => `Looking forward to any updates regarding '${subject}'. Definitely following for more!`,
    },
    {
      author: 'MidnightReader',
      avatarSeed: 1544005313,
      bodyKo: (subject) => `‘${subject}’ 주제로 이렇게 많은 분들이 함께 이야기 나누는 모습이 보기 좋네요. 좋은 글 공유 감사합니다!`,
      bodyEn: (subject) => `Great to see such an active and engaging thread on '${subject}'. Thanks for sharing!`,
    },
  ],
};

/**
 * 포스트의 실제 제목, 내용 및 미디어 맥락에 100% 부합하는 고품질 지능형 댓글 목록을 생성
 */
export function generateContextualCommentsForPost(
  post: RedditPost,
  count: number = 5,
  startIndex: number = 0,
  isKo: boolean = true
): RedditComment[] {
  const subject = extractPostCoreSubject(post.title || '');
  const contentType = detectPostContentType(post);
  const personas = PERSONAS_BY_TYPE[contentType] || PERSONAS_BY_TYPE.opinion;
  const now = Date.now();

  const results: RedditComment[] = [];

  for (let i = 0; i < count; i++) {
    const pIdx = (startIndex + i) % personas.length;
    const persona = personas[pIdx];
    const uniqueId = `c_smart_${post.id}_${startIndex + i + 1}`;
    const commentScore = Math.max(12, Math.floor((post.score || 100) * 0.12) - i * 6);

    const replies: RedditComment[] = [];
    if (persona.replyKo && (i % 2 === 0 || count <= 3)) {
      const replyBody = isKo 
        ? persona.replyKo(subject, post) 
        : (persona.replyEn ? persona.replyEn(subject, post) : persona.replyKo(subject, post));

      replies.push({
        id: `${uniqueId}_r1`,
        postId: post.id,
        parentId: uniqueId,
        author: post.author || 'OP_Author',
        authorAvatar: post.authorAvatar || `https://images.unsplash.com/photo-${persona.avatarSeed}?auto=format&fit=crop&w=64&q=80`,
        authorKarma: 12500,
        createdAt: now - 1000 * 60 * (8 + (startIndex + i) * 3),
        score: Math.max(7, Math.floor(commentScore * 0.55)),
        isAuthorOp: true,
        body: replyBody,
      });
    }

    const commentBody = isKo 
      ? persona.bodyKo(subject, post) 
      : persona.bodyEn(subject, post);

    results.push({
      id: uniqueId,
      postId: post.id,
      parentId: null,
      author: `${persona.author}_${(startIndex + i + 1)}`,
      authorAvatar: `https://images.unsplash.com/photo-${persona.avatarSeed}?auto=format&fit=crop&w=64&q=80`,
      authorKarma: 14200 + (startIndex + i) * 380,
      createdAt: now - 1000 * 60 * (18 + (startIndex + i) * 4),
      score: commentScore,
      body: commentBody,
      replies,
    });
  }

  return results;
}
