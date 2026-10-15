// ==========================================================================
// GWENT REIMAGINED - ALL 216 CARDS ENCYCLOPEDIA (GALLERY) & RULES MODAL
// ==========================================================================

(function() {
  let currentFilter = 'all';

  function initGallery() {
    const openBtn = document.getElementById('open-gallery');
    const modal = document.getElementById('card-gallery-modal');
    const closeBtn = document.getElementById('close-gallery-btn');
    const detailModal = document.getElementById('gallery-detail-modal');
    const detailCloseBtn = document.getElementById('detail-close-btn');

    // How to Play Modal Elements
    const rulesOpenBtn = document.getElementById('open-how-to-play');
    const rulesModal = document.getElementById('how-to-play-modal');
    const rulesCloseBtn = document.getElementById('close-rules-btn');

    // Language Toggle Button
    const langBtn = document.getElementById('toggle-language');
    if (langBtn) {
      langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.I18N) {
          I18N.toggleLanguage();
        }
      });
    }

    // Rules Modal Listeners
    if (rulesOpenBtn && rulesModal) {
      rulesOpenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.I18N) I18N.applyAll();
        rulesModal.classList.remove('hide');
      });
    }

    if (rulesCloseBtn && rulesModal) {
      rulesCloseBtn.addEventListener('click', () => {
        rulesModal.classList.add('hide');
      });
    }

    if (rulesModal) {
      rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
          rulesModal.classList.add('hide');
        }
      });
    }

    // Gallery Listeners
    if (openBtn && modal) {
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        renderGalleryCards();
        modal.classList.remove('hide');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hide');
      });
    }

    if (detailCloseBtn && detailModal) {
      detailCloseBtn.addEventListener('click', () => {
        detailModal.classList.add('hide');
      });
    }

    if (detailModal) {
      detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
          detailModal.classList.add('hide');
        }
      });
    }

    // Filter Buttons
    const filterBtns = document.querySelectorAll('.gallery-filters .filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderGalleryCards();
      });
    });

    // Keyboard ESC listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (rulesModal && !rulesModal.classList.contains('hide')) {
          rulesModal.classList.add('hide');
        } else if (detailModal && !detailModal.classList.contains('hide')) {
          detailModal.classList.add('hide');
        } else if (modal && !modal.classList.contains('hide')) {
          modal.classList.add('hide');
        }
      }
    });

    // Initial i18n render
    if (window.I18N) {
      I18N.applyAll();
    }
  }

  function isKo() {
    return !window.I18N || I18N.currentLang === 'ko';
  }

  function getSortedCards() {
    if (!window.card_dict) return [];
    
    const list = [...window.card_dict];
    list.sort((a, b) => {
      const cidA = a.characterId || 999;
      const cidB = b.characterId || 999;
      const groupA = cidA <= 200 ? 1 : 2;
      const groupB = cidB <= 200 ? 1 : 2;
      
      if (groupA !== groupB) {
        return groupA - groupB;
      }
      return cidA - cidB;
    });

    return list;
  }

  function filterCards(cards) {
    if (currentFilter === 'all') return cards;
    if (currentFilter === 'sheet1_2') {
      return cards.filter(c => (c.characterId || 0) <= 200);
    }
    if (currentFilter === 'sheet3') {
      return cards.filter(c => (c.characterId || 0) > 200);
    }
    if (currentFilter === 'neutral_special') {
      return cards.filter(c => ['neutral', 'special', 'weather'].includes(c.deck));
    }
    return cards.filter(c => c.deck === currentFilter);
  }

  function renderGalleryCards() {
    const gridContainer = document.getElementById('gallery-card-grid-container');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    const sorted = getSortedCards();
    const filtered = filterCards(sorted);

    const sheet1_2Cards = filtered.filter(c => (c.characterId || 0) <= 200);
    const sheet3Cards = filtered.filter(c => (c.characterId || 0) > 200);

    // Section 1: Sheet 1 & 2
    if (sheet1_2Cards.length > 0) {
      const divider1 = document.createElement('div');
      divider1.className = 'sheet-section-divider sheet1_2';
      const headerTitle = isKo() ? '❖ Sheet 1 & 2 : 유닛 카드 (Unit Cards)' : '❖ Sheet 1 & 2 : Unit Cards';
      const headerSub = isKo() ? `총 ${sheet1_2Cards.length}종 (캐릭터 스프라이트 #1 ~ #185)` : `Total ${sheet1_2Cards.length} Cards (Sprites #1 ~ #185)`;
      divider1.innerHTML = `
        <h3>${headerTitle}</h3>
        <span>${headerSub}</span>
      `;
      gridContainer.appendChild(divider1);

      const grid1 = document.createElement('div');
      grid1.className = 'gallery-grid';
      sheet1_2Cards.forEach(card => {
        grid1.appendChild(createCardItemDOM(card));
      });
      gridContainer.appendChild(grid1);
    }

    // Section 2: Sheet 3
    if (sheet3Cards.length > 0) {
      const divider3 = document.createElement('div');
      divider3.className = 'sheet-section-divider sheet3';
      const headerTitle = isKo() ? '❖ Sheet 3 : 리더 및 특수/날씨 카드 (Leaders & Special Cards)' : '❖ Sheet 3 : Leaders & Special/Weather Cards';
      const headerSub = isKo() ? `총 ${sheet3Cards.length}종 (캐릭터 & 마법 아티팩트 #201 ~ #231)` : `Total ${sheet3Cards.length} Cards (Artifacts & Leaders #201 ~ #231)`;
      divider3.innerHTML = `
        <h3>${headerTitle}</h3>
        <span>${headerSub}</span>
      `;
      gridContainer.appendChild(divider3);

      const grid3 = document.createElement('div');
      grid3.className = 'gallery-grid';
      sheet3Cards.forEach(card => {
        grid3.appendChild(createCardItemDOM(card));
      });
      gridContainer.appendChild(grid3);
    }

    // Update count badge
    const badge = document.getElementById('gallery-count-badge');
    if (badge) {
      badge.textContent = isKo() ? `표시 중: ${filtered.length} / 216장` : `Showing: ${filtered.length} / 216 cards`;
    }
  }

  function createCardItemDOM(card) {
    const item = document.createElement('div');
    item.className = 'gallery-card-item';
    if (card.row === 'leader') item.classList.add('leader-item');

    const cid = card.characterId || 0;
    const sheetName = cid <= 100 ? 'Sheet 1' : (cid <= 200 ? 'Sheet 2' : 'Sheet 3');
    const smURL = `img/sm/${card.deck}_${card.filename}.jpg`;
    const cardTitle = isKo() ? (card.title_ko || card.name) : (card.title_en || card.name);
    const factionName = getFactionText(card.deck);

    item.innerHTML = `
      <div class="gallery-card-thumb" style="background-image: url('${smURL}');">
        <span class="gallery-cid-badge">#${cid}</span>
      </div>
      <div class="gallery-card-info">
        <div class="gallery-card-name" title="${cardTitle}">${cardTitle}</div>
        <div class="gallery-card-sub">${sheetName} • ${factionName}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      openDetailModal(card);
    });

    return item;
  }

  function openDetailModal(card) {
    const modal = document.getElementById('gallery-detail-modal');
    if (!modal) return;

    const cid = card.characterId || 0;
    const sheetName = cid <= 100 ? 'Sheet 1 (#1~#100)' : (cid <= 200 ? 'Sheet 2 (#101~#200)' : 'Sheet 3 (#201~#231)');
    const lgURL = `img/lg/${card.deck}_${card.filename}.jpg`;
    const cardTitle = isKo() ? (card.title_ko || card.name) : (card.title_en || card.name);
    const subTitle = isKo() ? `${card.title_en || card.filename} • Character #${cid}` : `${card.title_ko || card.filename} • Character #${cid}`;

    document.getElementById('detail-card-img').style.backgroundImage = `url('${lgURL}')`;
    document.getElementById('detail-title-ko').textContent = cardTitle;
    document.getElementById('detail-title-en').textContent = subTitle;

    const strengthLabel = isKo() ? `전투력: ${card.strength}` : `Strength: ${card.strength}`;
    const rowLabel = isKo() ? `전선: ${getRowText(card.row)}` : `Row: ${getRowText(card.row)}`;
    const abilityLabel = isKo() ? `능력: ${card.ability}` : `Ability: ${card.ability}`;
    const countLabel = isKo() ? `수량: ${card.count}장` : `Count: ${card.count}`;

    // Meta tags
    const metaContainer = document.getElementById('detail-meta-tags');
    metaContainer.innerHTML = `
      <span class="detail-tag gold">${sheetName}</span>
      <span class="detail-tag">${getFactionText(card.deck)}</span>
      <span class="detail-tag">${getTypeText(card)}</span>
      ${card.strength !== "" ? `<span class="detail-tag">${strengthLabel}</span>` : ''}
      ${card.row && card.row !== 'leader' ? `<span class="detail-tag">${rowLabel}</span>` : ''}
      ${card.ability ? `<span class="detail-tag">${abilityLabel}</span>` : ''}
      <span class="detail-tag">${countLabel}</span>
    `;

    // Lore text
    const loreText = getCardDescription(card);
    document.getElementById('detail-lore').textContent = loreText;

    modal.classList.remove('hide');
  }

  function getFactionText(deck) {
    const mapKo = {
      realms: '북부 왕국',
      nilfgaard: '닐프가드',
      monsters: '괴물',
      scoiatael: "스코이아'텔",
      skellige: '스켈리게',
      neutral: '중립',
      special: '특수',
      weather: '날씨'
    };
    const mapEn = {
      realms: 'Northern Realms',
      nilfgaard: 'Nilfgaard',
      monsters: 'Monsters',
      scoiatael: "Scoia'tael",
      skellige: 'Skellige',
      neutral: 'Neutral',
      special: 'Special',
      weather: 'Weather'
    };
    return isKo() ? (mapKo[deck] || deck) : (mapEn[deck] || deck);
  }

  function getTypeText(card) {
    if (isKo()) {
      if (card.row === 'leader') return '지도자 (Leader)';
      if (card.deck === 'special') return '특수 카드 (Special)';
      if (card.deck === 'weather') return '날씨 카드 (Weather)';
      if ((card.ability || '').includes('hero')) return '영웅 유닛 (Hero)';
      return '일반 유닛 (Unit)';
    } else {
      if (card.row === 'leader') return 'Leader';
      if (card.deck === 'special') return 'Special Card';
      if (card.deck === 'weather') return 'Weather Card';
      if ((card.ability || '').includes('hero')) return 'Hero Unit';
      return 'Standard Unit';
    }
  }

  function getRowText(row) {
    if (isKo()) {
      const map = {
        close: '근접 (Close)',
        ranged: '원거리 (Ranged)',
        siege: '공성 (Siege)',
        agile: '민첩 (Agile)'
      };
      return map[row] || row;
    } else {
      const map = {
        close: 'Close Combat',
        ranged: 'Ranged Combat',
        siege: 'Siege Combat',
        agile: 'Agile'
      };
      return map[row] || row;
    }
  }

  function getCardDescription(card) {
    if (isKo()) {
      if (card.lore_ko) return card.lore_ko;
      if (card.row === 'leader') return `${getFactionText(card.deck)}의 위엄 있는 지도자 카드입니다. 게임 중 1회 리더 고유 능력을 발동할 수 있습니다.`;
      if (card.deck === 'special') return `전장의 판세를 일거에 뒤집는 강력한 특수 전술 카드입니다.`;
      if (card.deck === 'weather') return `전선 전체에 원소 마법의 재앙을 내리는 날씨 카드입니다.`;
      return `${getFactionText(card.deck)}의 핵심 전투 유닛으로, 전장에 배치되어 아군의 승리를 견인합니다.`;
    } else {
      if (card.lore_en) return card.lore_en;
      if (card.row === 'leader') return `Mighty commander of ${getFactionText(card.deck)}. Can unleash a unique strategic leader perk once per match.`;
      if (card.deck === 'special') return `A powerful tactical card designed to turn the tides of the battlefield.`;
      if (card.deck === 'weather') return `A cataclysmic elemental weather card affecting entire rows across the battlefield.`;
      return `Core combat unit of ${getFactionText(card.deck)}, deployed to lead friendly forces to victory.`;
    }
  }

  function updateFilterButtonsText() {
    const isKorean = isKo();
    const titleElem = document.querySelector('.gallery-title-box h2');
    if (titleElem && window.I18N) {
      titleElem.textContent = I18N.t('gallery_title');
    }
    const closeBtn = document.getElementById('close-gallery-btn');
    if (closeBtn && window.I18N) {
      closeBtn.textContent = I18N.t('close');
    }
    const filterMap = {
      all: isKorean ? '전체 (216)' : 'All (216)',
      sheet1_2: isKorean ? 'Sheet 1·2 유닛 (185)' : 'Sheet 1·2 Units (185)',
      sheet3: isKorean ? 'Sheet 3 리더/특수 (31)' : 'Sheet 3 Leaders/Special (31)',
      realms: isKorean ? '북부 왕국' : 'Northern Realms',
      nilfgaard: isKorean ? '닐프가드' : 'Nilfgaard',
      monsters: isKorean ? '괴물' : 'Monsters',
      scoiatael: isKorean ? "스코이아'텔" : "Scoia'tael",
      skellige: isKorean ? '스켈리게' : 'Skellige',
      neutral_special: isKorean ? '중립·특수·날씨' : 'Neutral & Special'
    };
    document.querySelectorAll('.gallery-filters .filter-btn').forEach(btn => {
      const f = btn.getAttribute('data-filter');
      if (filterMap[f]) {
        btn.textContent = filterMap[f];
      }
    });
  }

  window.GwentGallery = {
    updateLanguage: function() {
      updateFilterButtonsText();
      const modal = document.getElementById('card-gallery-modal');
      if (modal && !modal.classList.contains('hide')) {
        renderGalleryCards();
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }
})();
