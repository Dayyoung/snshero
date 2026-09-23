export interface KadanNovelScriptLine {
  speaker: string;
  name: string;
  text: string;
  cardId?: number;
}

export type KadanRpgNovelScriptMap = Record<number, KadanNovelScriptLine[]>;

function generateDefaultScripts(): KadanRpgNovelScriptMap {
  const map: KadanRpgNovelScriptMap = {};
  for (let ch = 1; ch <= 40; ch++) {
    map[ch] = [
      {
        speaker: 'narrator',
        name: `제 ${ch}장`,
        text: `아케인의 메아리가 울려 퍼지는 엘윈의 고지대에서 카단의 여정이 이어진다.`,
        cardId: ch <= 110 ? ch : 1,
      },
      {
        speaker: 'kadan',
        name: '카단',
        text: `“바람의 흐름이 변하고 있어. 이 앞에 심상치 않은 에코가 느껴진다.”`,
        cardId: 41,
      },
      {
        speaker: 'opponent',
        name: `수호자 #${ch}`,
        text: `“이곳을 통과하려거든 네 힘의 진가를 증명해 보여라!”`,
        cardId: ch <= 110 ? ch : 2,
      },
    ];
  }
  return map;
}

export const KADAN_RPG_NOVEL_SCRIPTS: KadanRpgNovelScriptMap = generateDefaultScripts();
export default KADAN_RPG_NOVEL_SCRIPTS;
