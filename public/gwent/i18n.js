/* ==========================================================================
   GWENT - MULTILINGUAL (KO / EN) SYSTEM & HOW-TO-PLAY TRANSLATIONS
   ========================================================================== */

const I18N = {
  currentLang: localStorage.getItem('gwent_lang') || 'ko',

  translations: {
    ko: {
      // Header & Navigation
      upload_deck: "덱 불러오기",
      change_faction: "진영 변경",
      download_deck: "덱 저장",
      how_to_play: "❖ 플레이 방법 (Rules)",
      card_gallery: "❖ 카드 도감 (Gallery)",
      lang_btn: "🌐 언어: 한국어",
      
      // Deck Builder Stats
      card_collection: "보유 카드 컬렉션",
      cards_in_deck: "덱 편성 카드",
      leader: "지도자 (Leader)",
      total_cards: "덱 총 카드 수",
      unit_cards: "유닛 카드 수",
      special_cards: "특수 카드 수",
      total_strength: "유닛 총 공격력",
      hero_cards: "영웅 카드 수",
      start_game: "전투 시작",
      opponent_deck: "상대 덱",
      random: "무작위 (Random)",
      
      // In-Game UI
      pass: "패스 (Pass)",
      choose_redraw: "다시 뽑을 카드를 최대 2장 선택하세요.",
      round_start: "라운드 시작!",
      turn_me: "당신의 턴",
      turn_op: "상대의 턴",
      round_won: "라운드 승리!",
      round_lost: "라운드 패배",
      round_draw: "무승부",
      game_won: "최종 승리!",
      game_lost: "최종 패배...",
      
      // Gallery
      gallery_title: "❖ 궨트 전체 카드 도감 (216 Cards Library)",
      gallery_count: "표시 중: {count} / {total}장",
      gallery_filter_all: "전체 (216)",
      gallery_filter_sheet12: "Sheet 1·2 유닛 (185)",
      gallery_filter_sheet3: "Sheet 3 리더/특수 (31)",
      gallery_filter_realms: "북부 왕국",
      gallery_filter_nilfgaard: "닐프가드",
      gallery_filter_monsters: "괴물",
      gallery_filter_scoiatael: "스코이아'텔",
      gallery_filter_skellige: "스켈리게",
      gallery_filter_special: "중립·특수·날씨",
      gallery_sheet12_header: "❖ Sheet 1 & 2 : 유닛 카드 (Unit Cards)",
      gallery_sheet12_sub: "총 185종 (캐릭터 스프라이트 #1 ~ #185)",
      gallery_sheet3_header: "❖ Sheet 3 : 리더 및 특수/날씨 카드 (Leaders & Special Cards)",
      gallery_sheet3_sub: "총 31종 (캐릭터 & 마법 아티팩트 #201 ~ #231)",
      close: "✕ 닫기",

      // How to Play Modal
      rules_title: "❖ 궨트 플레이 방법 & 게임 규칙 (How to Play)",
      rules_subtitle: "전술적 카드 배치와 두뇌 심리전 가이드",
      
      rule_sec1_title: "1. 게임 목표 및 승리 조건 (Objective)",
      rule_sec1_body: `
        <ul>
          <li><strong>3판 2선승제 (Best of 3)</strong>: 총 3번의 라운드 중 <strong>2번의 라운드를 먼저 승리</strong>하는 사령관이 최종 승리합니다.</li>
          <li><strong>라운드 승리 조건</strong>: 라운드가 종료되었을 때, 자신의 전장 전선에 배치된 유닛들의 <strong>총 전투력(Total Strength)이 상대보다 높은 쪽</strong>이 승리합니다.</li>
          <li><strong>보석(생명력) 시스템</strong>: 양 플레이어는 각각 2개의 붉은 보석을 가지고 시작하며, 라운드에서 패배할 때마다 보석이 1개씩 깨집니다. 2개의 보석을 모두 잃으면 패배합니다.</li>
        </ul>
      `,

      rule_sec2_title: "2. 턴 진행 방식과 '패스(Pass)'의 미학 (Turns & Passing)",
      rule_sec2_body: `
        <ul>
          <li><strong>매 턴 1장 배치</strong>: 자신의 턴이 돌아오면 손패에서 <strong>카드 1장을 선택해 전장에 배치</strong>하거나, <strong>리더 능력</strong>을 사용할 수 있습니다.</li>
          <li><strong>패스(Pass) 선언</strong>: 이번 라운드에서 더 이상 카드를 내지 않고 현재 점수를 확정짓고 싶다면 언제든 <strong>[Pass]</strong> 버튼을 누를 수 있습니다.</li>
          <li><strong>라운드 종료</strong>: <em>양 플레이어가 모두 패스를 선언</em>하면 라운드가 즉시 종료되고 최종 점수를 비교합니다.</li>
          <li><strong>핸드 보존 전략</strong>: 궨트는 라운드가 끝나도 카드를 새로 채워주지 않습니다(일부 특성 제외)! 이전 라운드에 카드를 과도하게 소모하면 다음 라운드에서 손패가 부족해집니다. 이길 수 없는 판은 과감히 패스하여 상대의 강력한 카드를 낭비시키는 전략이 중요합니다.</li>
        </ul>
      `,

      rule_sec3_title: "3. 전장의 3대 전선과 카드 분류 (Battlefield Rows & Types)",
      rule_sec3_body: `
        <ul>
          <li><strong>근접 전선 (⚔️ Close Combat)</strong>: 최전방 행. 검사, 기사, 맹수 등 근접 전사들이 배치됩니다.</li>
          <li><strong>원거리 전선 (🏹 Ranged Combat)</strong>: 중거리 행. 궁수, 마법사, 투척수들이 배치됩니다.</li>
          <li><strong>공성 전선 (🎯 Siege Combat)</strong>: 후방 행. 투석기, 발리스타, 공성 병기들이 배치됩니다.</li>
          <li><strong>유연한 전선 (🔄 Agile)</strong>: 배치 시 근접 또는 원거리 중 원하는 행을 자유롭게 선택할 수 있습니다.</li>
          <li><strong>일반 유닛 vs 영웅 유닛 (⭐ Hero)</strong>:
            <ul>
              <li><strong>일반 유닛</strong>: 나팔의 버프를 받아 2배가 될 수 있지만, 날씨나 스코치의 공격을 받습니다.</li>
              <li><strong>영웅 유닛 (금빛 테두리)</strong>: 날씨, 스코치, 파괴 마법 등 <em>모든 특수 효과에 절대 면역</em>인 최정예 불사 카드입니다.</li>
            </ul>
          </li>
        </ul>
      `,

      rule_sec4_title: "4. 전세를 뒤집는 특수 & 날씨 카드 (Special & Weather)",
      rule_sec4_body: `
        <ul>
          <li><strong>미끼 인형 (Decoy)</strong>: 전장에 이미 나와 있는 내 일반 유닛 1장을 패로 회수하고 대신 인형을 놓습니다. (상대의 첩자를 되돌려 쓰거나 치료 유닛을 재활용할 때 강력!)</li>
          <li><strong>전장의 나팔 (Commander's Horn)</strong>: 배치된 행의 모든 아군 일반 유닛 공격력을 <strong>2배</strong>로 증폭합니다.</li>
          <li><strong>멸망의 업화 (Scorch)</strong>: 전장 전체에서 가장 공격력이 높은 유닛을 <strong>전부 소각(파괴)</strong>합니다. (적군/아군 불문이므로 자신의 유닛이 타지 않도록 주의!)</li>
          <li><strong>광전사의 비약 (Berserker Elixir)</strong>: 해당 행의 모든 버서커 유닛을 거대한 곰 전사(공격력 14)로 영구 각성시킵니다.</li>
          <li><strong>날씨 카드 (Weather)</strong>:
            <ul>
              <li><strong>혹한의 서리 (Frost)</strong>: 양 플레이어의 모든 <strong>근접 유닛 공격력을 1</strong>로 고정.</li>
              <li><strong>침묵의 안개 (Fog)</strong>: 양 플레이어의 모든 <strong>원거리 유닛 공격력을 1</strong>로 고정.</li>
              <li><strong>폭풍의 폭우 (Rain)</strong>: 양 플레이어의 모든 <strong>공성 유닛 공격력을 1</strong>로 고정.</li>
              <li><strong>맑은 창공 (Clear Sky)</strong>: 전장의 모든 날씨 효과를 즉시 정화하여 본래 수치로 복구.</li>
              <li><strong>스켈리게 대폭풍 (Storm)</strong>: 안개와 폭우가 동시에 몰아칩니다.</li>
            </ul>
          </li>
        </ul>
      `,

      rule_sec5_title: "5. 5대 진영 고유 특성 (Faction Perks)",
      rule_sec5_body: `
        <ul>
          <li><strong>북부 왕국 (Northern Realms)</strong>: 라운드에서 승리할 때마다 덱에서 <strong>카드 1장을 즉시 추가 드로우</strong>합니다.</li>
          <li><strong>닐프가드 제국 (Nilfgaard)</strong>: 라운드 동점(무승부)이 발생할 경우 <strong>무조건 닐프가드의 승리</strong>로 판정됩니다.</li>
          <li><strong>괴물 군단 (Monsters)</strong>: 라운드가 종료되어도 전장의 <strong>무작위 몬스터 유닛 1장이 무덤으로 가지 않고 다음 라운드에 잔류</strong>합니다.</li>
          <li><strong>스코이아'텔 (Scoia'tael)</strong>: 게임 시작 시 <strong>선공/후공을 자유롭게 선택</strong>할 수 있는 주도권을 가집니다.</li>
          <li><strong>스켈리게 군도 (Skellige)</strong>: 결전의 3라운드 시작 시 <strong>무덤에서 전사 유닛 2장을 무작위로 전장에 즉시 부활</strong>시킵니다.</li>
        </ul>
      `
    },

    en: {
      // Header & Navigation
      upload_deck: "Import Deck",
      change_faction: "Change Faction",
      download_deck: "Export Deck",
      how_to_play: "❖ How to Play (Rules)",
      card_gallery: "❖ Card Gallery",
      lang_btn: "🌐 Language: English",

      // Deck Builder Stats
      card_collection: "Card Collection",
      cards_in_deck: "Cards in Deck",
      leader: "Leader",
      total_cards: "Total cards in deck",
      unit_cards: "Number of Unit Cards",
      special_cards: "Special Cards",
      total_strength: "Total Unit Strength",
      hero_cards: "Hero Cards",
      start_game: "Start Game",
      opponent_deck: "Opponent's Deck",
      random: "Random",

      // In-Game UI
      pass: "Pass Turn",
      choose_redraw: "Choose up to 2 cards to redraw.",
      round_start: "Round Start!",
      turn_me: "Your Turn",
      turn_op: "Opponent's Turn",
      round_won: "Round Won!",
      round_lost: "Round Lost",
      round_draw: "Round Draw",
      game_won: "Victory!",
      game_lost: "Defeat...",

      // Gallery
      gallery_title: "❖ Gwent Complete Card Library (216 Cards)",
      gallery_count: "Showing: {count} / {total} cards",
      gallery_filter_all: "All (216)",
      gallery_filter_sheet12: "Sheet 1·2 Units (185)",
      gallery_filter_sheet3: "Sheet 3 Leaders/Special (31)",
      gallery_filter_realms: "Northern Realms",
      gallery_filter_nilfgaard: "Nilfgaard",
      gallery_filter_monsters: "Monsters",
      gallery_filter_scoiatael: "Scoia'tael",
      gallery_filter_skellige: "Skellige",
      gallery_filter_special: "Neutral & Special",
      gallery_sheet12_header: "❖ Sheet 1 & 2 : Unit Cards",
      gallery_sheet12_sub: "Total 185 Cards (Character Sprites #1 ~ #185)",
      gallery_sheet3_header: "❖ Sheet 3 : Leaders & Special/Weather Cards",
      gallery_sheet3_sub: "Total 31 Cards (Characters & Magical Artifacts #201 ~ #231)",
      close: "✕ Close",

      // How to Play Modal
      rules_title: "❖ Gwent Rules & How to Play Guide",
      rules_subtitle: "Master Tactical Placement and Psychological Warfare",

      rule_sec1_title: "1. Game Objective & Winning Condition",
      rule_sec1_body: `
        <ul>
          <li><strong>Best of Three (Bo3)</strong>: The commander who <strong>wins 2 out of 3 rounds</strong> claims total victory.</li>
          <li><strong>Round Victory</strong>: When a round ends, the player with the <strong>higher Total Strength</strong> across all rows wins the round.</li>
          <li><strong>Gem (Life) System</strong>: Both players start with 2 red gems. Losing a round shatters 1 gem. Lose both, and the battle is lost.</li>
        </ul>
      `,

      rule_sec2_title: "2. Turn Mechanics & The Art of Passing",
      rule_sec2_body: `
        <ul>
          <li><strong>Play 1 Card per Turn</strong>: On your turn, <strong>play exactly 1 card</strong> to the battlefield or activate your Leader ability.</li>
          <li><strong>Passing</strong>: If you are satisfied with your score or want to save cards, you may <strong>[Pass]</strong> at any time.</li>
          <li><strong>Round Conclusion</strong>: When <em>both commanders pass</em>, the round ends immediately and scores are tallied.</li>
          <li><strong>Card Advantage Strategy</strong>: Hands are NOT automatically replenished between rounds! Conserving cards and baiting your opponent to overcommit is the true key to victory.</li>
        </ul>
      `,

      rule_sec3_title: "3. Battlefield Rows & Card Types",
      rule_sec3_body: `
        <ul>
          <li><strong>Close Combat (⚔️)</strong>: Front line for swordsmen, knights, and beasts.</li>
          <li><strong>Ranged Combat (🏹)</strong>: Middle line for archers, spellcasters, and marksmen.</li>
          <li><strong>Siege Combat (🎯)</strong>: Rear line for trebuchets, catapults, and heavy artillery.</li>
          <li><strong>Agile (🔄)</strong>: Flexible units that can be placed in either Close or Ranged combat upon deployment.</li>
          <li><strong>Standard Units vs. Hero Units (⭐)</strong>:
            <ul>
              <li><strong>Standard Units</strong>: Can be boosted by horns and morale, but vulnerable to weather and Scorch.</li>
              <li><strong>Hero Units (Gold Border)</strong>: Elite champions completely <em>immune to all weather, special effects, and Scorch</em>.</li>
            </ul>
          </li>
        </ul>
      `,

      rule_sec4_title: "4. Special & Weather Cards",
      rule_sec4_body: `
        <ul>
          <li><strong>Decoy Dummy</strong>: Swap with one of your non-hero cards on the board to return it to your hand. (Incredible for reusing Medics or turning enemy Spies!)</li>
          <li><strong>Commander's Horn</strong>: <strong>Doubles the strength</strong> of all friendly non-hero units in its row.</li>
          <li><strong>Scorch Cataclysm</strong>: <strong>Destroys the strongest unit(s)</strong> currently on the board. (Careful: it can burn your own cards if they share the highest value!)</li>
          <li><strong>Berserker Elixir</strong>: Permanently transforms all Berserkers in the row into fearsome Bear Warriors (14 Strength).</li>
          <li><strong>Weather Cards</strong>:
            <ul>
              <li><strong>Biting Frost</strong>: Sets all <strong>Close Combat units to 1 Strength</strong> for both players.</li>
              <li><strong>Impenetrable Fog</strong>: Sets all <strong>Ranged Combat units to 1 Strength</strong> for both players.</li>
              <li><strong>Torrential Rain</strong>: Sets all <strong>Siege Combat units to 1 Strength</strong> for both players.</li>
              <li><strong>Clear Sky</strong>: Clears all active weather effects across the entire battlefield.</li>
              <li><strong>Skellige Storm</strong>: Rages with both Fog and Rain effects simultaneously.</li>
            </ul>
          </li>
        </ul>
      `,

      rule_sec5_title: "5. Five Faction Perks",
      rule_sec5_body: `
        <ul>
          <li><strong>Northern Realms</strong>: Draws <strong>an additional card</strong> from your deck whenever you win a round.</li>
          <li><strong>Nilfgaardian Empire</strong>: Wins every tied (draw) round automatically.</li>
          <li><strong>Monsters</strong>: One randomly chosen Monster unit <strong>remains on the board</strong> into the next round.</li>
          <li><strong>Scoia'tael</strong>: Grants the tactical privilege to <strong>choose who takes the first turn</strong>.</li>
          <li><strong>Skellige</strong>: In Round 3, randomly resurrects <strong>2 warrior units from the graveyard</strong> directly to the battlefield.</li>
        </ul>
      `
    }
  },

  t(key, params = {}) {
    let str = (this.translations[this.currentLang] && this.translations[this.currentLang][key])
           || (this.translations['ko'] && this.translations['ko'][key])
           || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return str;
  },

  setLanguage(lang) {
    if (lang !== 'ko' && lang !== 'en') return;
    this.currentLang = lang;
    localStorage.setItem('gwent_lang', lang);
    this.applyAll();
    window.dispatchEvent(new CustomEvent('gwent-language-changed', { detail: { lang } }));
  },

  toggleLanguage() {
    this.setLanguage(this.currentLang === 'ko' ? 'en' : 'ko');
  },

  applyAll() {
    const isKo = this.currentLang === 'ko';

    // 1. Navigation & Deck Options
    const btnLang = document.getElementById('toggle-language');
    if (btnLang) btnLang.innerHTML = this.t('lang_btn');

    const btnHowToPlay = document.getElementById('open-how-to-play');
    if (btnHowToPlay) btnHowToPlay.innerHTML = this.t('how_to_play');

    const btnGallery = document.getElementById('open-gallery');
    if (btnGallery) btnGallery.innerHTML = this.t('card_gallery');

    const uploadDeck = document.getElementById('upload-deck');
    if (uploadDeck) {
      const input = uploadDeck.querySelector('input');
      uploadDeck.innerHTML = '';
      if (input) uploadDeck.appendChild(input);
      uploadDeck.appendChild(document.createTextNode(' ' + this.t('upload_deck')));
    }

    const changeFaction = document.getElementById('change-faction');
    if (changeFaction) changeFaction.innerHTML = this.t('change_faction');

    const downloadDeck = document.getElementById('download-deck');
    if (downloadDeck) downloadDeck.innerHTML = this.t('download_deck');

    // 2. Deck stats labels
    const cardBankTitle = document.getElementById('card-bank-title');
    if (cardBankTitle) cardBankTitle.innerHTML = this.t('card_collection');

    const cardDeckTitle = document.getElementById('card-deck-title');
    if (cardDeckTitle) cardDeckTitle.innerHTML = this.t('cards_in_deck');

    const leaderElemP = document.querySelector('#card-leader > p');
    if (leaderElemP) leaderElemP.innerHTML = this.t('leader');

    const leaderFactionTitle = document.getElementById('leader-faction-title');
    const factionDesc = document.getElementById('faction-description');
    if (window.dm && dm.faction && window.factions) {
      const fac = factions[dm.faction];
      if (fac) {
        if (leaderFactionTitle) {
          leaderFactionTitle.innerHTML = isKo ? (fac.name_ko || fac.name) : (fac.name_en || fac.name);
        }
        if (factionDesc) {
          factionDesc.innerHTML = isKo ? (fac.desc_ko || fac.description) : (fac.desc_en || fac.description);
        }
      }
    }

    const statsPs = document.querySelectorAll('#deck-stats > p');
    if (statsPs.length >= 10) {
      statsPs[0].innerHTML = this.t('total_cards');
      statsPs[2].innerHTML = this.t('unit_cards');
      statsPs[4].innerHTML = this.t('special_cards');
      statsPs[6].innerHTML = this.t('total_strength');
      statsPs[8].innerHTML = this.t('hero_cards');
    }

    const startBtn = document.getElementById('start-game');
    if (startBtn) startBtn.innerHTML = this.t('start_game');

    const passBtn = document.getElementById('btn-pass');
    if (passBtn) passBtn.innerHTML = this.t('pass');

    // 3. How to Play Modal
    const rulesTitle = document.getElementById('rules-modal-title');
    if (rulesTitle) rulesTitle.innerHTML = this.t('rules_title');

    const rulesSub = document.getElementById('rules-modal-sub');
    if (rulesSub) rulesSub.innerHTML = this.t('rules_subtitle');

    for (let i = 1; i <= 5; i++) {
      const sTitle = document.getElementById(`rules-sec${i}-title`);
      const sBody = document.getElementById(`rules-sec${i}-body`);
      if (sTitle) sTitle.innerHTML = this.t(`rule_sec${i}_title`);
      if (sBody) sBody.innerHTML = this.t(`rule_sec${i}_body`);
    }

    // 4. Update Cards Display Name dynamically
    if (window.Card && Card.instances) {
      Card.instances.forEach(c => {
        if (c.elem) {
          const title = isKo ? (c.title_ko || c.name) : (c.title_en || c.name);
          c.elem.setAttribute('data-title', title);
        }
      });
    }

    // 5. Update Gallery if active
    if (window.GwentGallery && typeof GwentGallery.updateLanguage === 'function') {
      GwentGallery.updateLanguage();
    }
  }
};

window.I18N = I18N;
