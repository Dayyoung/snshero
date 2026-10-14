import React, { useState } from 'react';
import { CardData, Language } from '../../types';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface PersonalizedStarterDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployToBattle: (deck: CardData[]) => void;
  language?: Language;
}

export interface StarterDeckPreset {
  id: 'ASSAULT_RUSH' | 'TACTICAL_COUNTER' | 'CHRONO_CONTROL';
  titleKey: string;
  descKey: string;
  themeClass: string;
  borderClass: string;
  accentText: string;
  accentBg: string;
  cards: CardData[];
}

export const STARTER_DECK_PRESETS: StarterDeckPreset[] = [
  {
    id: 'ASSAULT_RUSH',
    titleKey: 'rushTitle',
    descKey: 'rushDesc',
    themeClass: 'from-rose-950/40 to-amber-950/30',
    borderClass: 'border-rose-500/50 hover:border-rose-400',
    accentText: 'text-rose-400',
    accentBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    cards: [
      { id: '101', title: 'SOVEREIGN // PRIME', power: 950, stats: [9, 8, 7, 8], rarity: 'legendary', title_dis: 'Supreme Commander', level: 1, element: 'fire' },
      { id: '204', title: 'VALKYRIE-EX', power: 880, stats: [8, 8, 6, 7], rarity: 'gold', title_dis: 'Aerial Vanguard', level: 1, element: 'wind' },
      { id: '105', title: 'BERSERKER-09', power: 820, stats: [8, 6, 6, 6], rarity: 'silver', title_dis: 'Shock Trooper', level: 1, element: 'fire' },
      { id: '108', title: 'CYBER-STRIKER', power: 760, stats: [7, 7, 5, 6], rarity: 'silver', title_dis: 'Frontline Blade', level: 1, element: 'earth' },
      { id: '112', title: 'TACTICAL SCOUT', power: 700, stats: [6, 6, 5, 5], rarity: 'bronze', title_dis: 'Infiltrator', level: 1, element: 'wind' },
    ]
  },
  {
    id: 'TACTICAL_COUNTER',
    titleKey: 'counterTitle',
    descKey: 'counterDesc',
    themeClass: 'from-cyan-950/40 to-emerald-950/30',
    borderClass: 'border-cyan-500/50 hover:border-cyan-400',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    cards: [
      { id: '102', title: 'AEGIS BULWARK', power: 720, stats: [6, 9, 8, 9], rarity: 'legendary', title_dis: 'Titan Guardian', level: 1, element: 'water' },
      { id: '201', title: 'IRONCLAD DREADNOUGHT', power: 690, stats: [6, 8, 8, 8], rarity: 'gold', title_dis: 'Heavy Armor', level: 1, element: 'earth' },
      { id: '106', title: 'NEXUS REFLECTOR', power: 650, stats: [5, 8, 7, 8], rarity: 'silver', title_dis: 'Energy Barrier', level: 1, element: 'water' },
      { id: '109', title: 'PHALANX WARDEN', power: 610, stats: [5, 7, 7, 7], rarity: 'silver', title_dis: 'Shield Sentinel', level: 1, element: 'earth' },
      { id: '114', title: 'REPAIR MEDIC', power: 540, stats: [4, 6, 7, 6], rarity: 'bronze', title_dis: 'Combat Support', level: 1, element: 'water' },
    ]
  },
  {
    id: 'CHRONO_CONTROL',
    titleKey: 'controlTitle',
    descKey: 'controlDesc',
    themeClass: 'from-violet-950/40 to-indigo-950/30',
    borderClass: 'border-violet-500/50 hover:border-violet-400',
    accentText: 'text-violet-400',
    accentBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    cards: [
      { id: '103', title: 'CHRONOS OVERLORD', power: 850, stats: [8, 8, 7, 8], rarity: 'legendary', title_dis: 'Time Manipulator', level: 1, element: 'undead' },
      { id: '205', title: 'PSIONIC DISRUPTOR', power: 810, stats: [7, 8, 6, 7], rarity: 'gold', title_dis: 'Mind Breaker', level: 1, element: 'undead' },
      { id: '107', title: 'GRAVITY WEAVER', power: 740, stats: [7, 7, 6, 6], rarity: 'silver', title_dis: 'Field Anomaly', level: 1, element: 'undead' },
      { id: '110', title: 'WARP SPECIALIST', power: 700, stats: [6, 7, 5, 6], rarity: 'silver', title_dis: 'Blink Operative', level: 1, element: 'robot' },
      { id: '115', title: 'QUANTUM CATALYST', power: 660, stats: [5, 6, 5, 5], rarity: 'bronze', title_dis: 'Resonance Core', level: 1, element: 'robot' },
    ]
  }
];

const I18N_TEXTS: Record<string, Record<string, string>> = {
  ko: {
    badge: '초개인화 전술 스타터 덱 큐레이션',
    title: '지휘관 맞춤 전투 성향 선택',
    subtitle: '플레이 성향에 최적화된 5인 시너지 덱을 1탭으로 즉시 장착합니다.',
    rushTitle: '속공 돌격형 (ASSAULT RUSH)',
    rushDesc: '강력한 선제 공격과 치명타로 상대 방어선을 순식간에 붕괴시킵니다.',
    counterTitle: '반격 방벽형 (TACTICAL COUNTER)',
    counterDesc: '철벽의 방어막과 피해 반사로 적의 공세를 흡수하고 역습합니다.',
    controlTitle: '제어 시너지형 (CHRONO CONTROL)',
    controlDesc: '시간 왜곡과 스킬 가속으로 전장의 흐름을 완벽히 지배합니다.',
    equipAndPlay: '1탭 즉시 장착 & 실전 배틀 출격',
    close: '나중에 선택'
  },
  en: {
    badge: 'PERSONALIZED STARTER DECK CURATION',
    title: 'SELECT YOUR TACTICAL COMBAT DOCTRINE',
    subtitle: 'Deploy an optimized 5-unit synergy starter deck with a single tap.',
    rushTitle: 'ASSAULT RUSH (BURST OFFENSE)',
    rushDesc: 'Overwhelm enemies with blazing speed, critical strikes, and burst damage.',
    counterTitle: 'TACTICAL COUNTER (FORTIFIED DEFENSE)',
    counterDesc: 'Absorb incoming assaults behind indestructible barriers and retaliate.',
    controlTitle: 'CHRONO CONTROL (TACTICAL DOMINANCE)',
    controlDesc: 'Manipulate time, accelerate skill cool-downs, and control combat flow.',
    equipAndPlay: '1-TAP EQUIP & DEPLOY TO BATTLE',
    close: 'DECIDE LATER'
  },
  ja: {
    badge: 'パーソナライズ初期デッキ選定',
    title: '司令官戦闘ドクトリン選択',
    subtitle: 'あなたのプレイスタイルに最適な5人シナジーデッキを1タップで装備。',
    rushTitle: '速攻突撃型 (ASSAULT RUSH)',
    rushDesc: '先制攻撃とクリティカルで敵陣営を瞬時に殲滅します。',
    counterTitle: '反撃防壁型 (TACTICAL COUNTER)',
    counterDesc: '鉄壁のシールドと反射ダメージで猛攻を受け流し反撃します。',
    controlTitle: '制御シナジー型 (CHRONO CONTROL)',
    controlDesc: '時間操作とスキル加速で戦場の主導権を完全に掌握します。',
    equipAndPlay: '1タップ装備＆実戦出撃',
    close: '後で選択'
  },
  'zh-CN': {
    badge: '个性化战术初始卡组定制',
    title: '指挥官战斗流派决策',
    subtitle: '一键装备最契合您战术风格的5人协同初始卡组，即刻投入实战。',
    rushTitle: '突击先锋型 (ASSAULT RUSH)',
    rushDesc: '以超强先手暴击爆发瞬间撕裂敌方防线。',
    counterTitle: '反击坚壁型 (TACTICAL COUNTER)',
    counterDesc: '构筑不可动摇的能量装甲，吸收伤害并强力弹射反击。',
    controlTitle: '时空控制型 (CHRONO CONTROL)',
    controlDesc: '掌控战场时钟，充能加速并瓦解敌方战术循环。',
    equipAndPlay: '一键装配并立即出战',
    close: '稍后选择'
  },
  'zh-TW': {
    badge: '個性化戰術初始牌組定制',
    title: '指揮官戰鬥流派決策',
    subtitle: '一鍵裝備最契合您戰術風格的5人協同初始牌組，即刻投入實戰。',
    rushTitle: '突擊先鋒型 (ASSAULT RUSH)',
    rushDesc: '以超強先手暴擊爆發瞬間撕裂敵方防線。',
    counterTitle: '反擊堅壁型 (TACTICAL COUNTER)',
    counterDesc: '構築不可動搖的能量裝甲，吸收傷害並強力彈射反擊。',
    controlTitle: '時空控制型 (CHRONO CONTROL)',
    controlDesc: '掌控戰場時鐘，充能加速並瓦解敵方戰術循環。',
    equipAndPlay: '一鍵裝配並立即出戰',
    close: '稍後選擇'
  },
  de: {
    badge: 'PERSONALISIERTE STARTER-DECK-KURATIERUNG',
    title: 'WÄHLEN SIE IHRE KAMPFDOKTRIN',
    subtitle: 'Rüsten Sie ein 5-Einheiten-Synergiedeck mit einem Fingertipp aus.',
    rushTitle: 'STURM-ANGRIFF (ASSAULT RUSH)',
    rushDesc: 'Überwältigen Sie Feinde mit kritischen Treffern und Blitzangriffen.',
    counterTitle: 'TAKTIK-KONTER (TACTICAL COUNTER)',
    counterDesc: 'Absorbieren Sie Angriffe mit Schutzschilden und schlagen Sie zurück.',
    controlTitle: 'CHRONO-KONTROLLE (CHRONO CONTROL)',
    controlDesc: 'Kontrollieren Sie das Kampftempo durch Zeitmanipulation.',
    equipAndPlay: 'AUSRÜSTEN & KÄMPFEN',
    close: 'SPÄTER ENTSCHEIDEN'
  },
  es: {
    badge: 'CURACIÓN DE MAZO INICIAL PERSONALIZADO',
    title: 'SELECCIONE SU DOCTRINA DE COMBATE',
    subtitle: 'Equipa un mazo de sinergia de 5 unidades con un solo toque.',
    rushTitle: 'ASALTO RÁPIDO (ASSAULT RUSH)',
    rushDesc: 'Abruma a los rivales con ataques críticos y daño explosivo.',
    counterTitle: 'CONTRAATAQUE TÁCTICO (TACTICAL COUNTER)',
    counterDesc: 'Absorbe los ataques con escudos y contraataca ferozmente.',
    controlTitle: 'CONTROL CRONO (CHRONO CONTROL)',
    controlDesc: 'Manipula el tiempo y acelera las habilidades para dominar.',
    equipAndPlay: 'EQUIPAR Y DESPLEGAR',
    close: 'DECIDIR MÁS TARDE'
  },
  fr: {
    badge: 'CURATION DE DECK DE DÉPART PERSONNALISÉE',
    title: 'CHOISISSEZ VOTRE DOCTRINE TACTIQUE',
    subtitle: 'Équipez un deck de synergie de 5 unités en une seule touche.',
    rushTitle: 'ASSAUT ÉCLAIR (ASSAULT RUSH)',
    rushDesc: 'Écrasez l ennemi grâce à une vitesse fulgurante et des coups critiques.',
    counterTitle: 'CONTRE-ATTAQUE TACTIQUE (TACTICAL COUNTER)',
    counterDesc: 'Absorbez les assauts derrière des remparts et ripostez.',
    controlTitle: 'CONTRÔLE CHRONO (CHRONO CONTROL)',
    controlDesc: 'Manipulez le temps et accélérez vos compétences.',
    equipAndPlay: 'ÉQUIPER & DÉPLOYER',
    close: 'DÉCIDER PLUS TARD'
  },
  id: {
    badge: 'KURASI DEK PEMULA KHUSUS',
    title: 'PILIH DOKTRIN TEMPUR ANDA',
    subtitle: 'Pasang dek sinergi 5 unit yang optimal dengan satu sentuhan.',
    rushTitle: 'SERANGAN CEPAT (ASSAULT RUSH)',
    rushDesc: 'Tumbangkan musuh dengan kecepatan tinggi dan serangan kritis.',
    counterTitle: 'SERANGAN BALIK (TACTICAL COUNTER)',
    counterDesc: 'Serap serangan di balik perisai kokoh lalu serang balik.',
    controlTitle: 'KONTROL KRONO (CHRONO CONTROL)',
    controlDesc: 'Manipulasi waktu dan percepat skill untuk menguasai medan.',
    equipAndPlay: 'PASANG & LUNCURKAN',
    close: 'NANTI SAJA'
  },
  ru: {
    badge: 'ПЕРСОНАЛЬНЫЙ СТАРТОВЫЙ НАБОР',
    title: 'ВЫБЕРИТЕ БОЕВУЮ ДОКТРИНУ',
    subtitle: 'Установите готовую синергичную колоду из 5 юнитов в одно касание.',
    rushTitle: 'ШТУРМОВОЙ ПРОРЫВ (ASSAULT RUSH)',
    rushDesc: 'Сокрушайте оборону врага молниеносными критическими ударами.',
    counterTitle: 'ТАКТИЧЕСКИЙ КОНТРУДАР (TACTICAL COUNTER)',
    counterDesc: 'Поглощайте урон за крепкими щитами и проводите контратаки.',
    controlTitle: 'ХРОНО-КОНТРОЛЬ (CHRONO CONTROL)',
    controlDesc: 'Управляйте временем боя и ускоряйте свои умения.',
    equipAndPlay: 'В БОЙ В 1 КЛИК',
    close: 'РЕШИТЬ ПОЗЖЕ'
  },
  th: {
    badge: 'การคัดสรรเด็คเริ่มต้นเฉพาะบุคคล',
    title: 'เลือกหลักนิยมการต่อสู้ทางยุทธวิธี',
    subtitle: 'ติดตั้งเด็คทำงานร่วมกัน 5 ยูนิตที่ดีที่สุดได้ด้วยการแตะเพียงครั้งเดียว',
    rushTitle: 'จู่โจมสายฟ้าแลบ (ASSAULT RUSH)',
    rushDesc: 'บดขยี้แนวป้องกันของศัตรูด้วยความเร็วสูงและการโจมตีคริติคอล',
    counterTitle: 'โต้กลับทางยุทธวิธี (TACTICAL COUNTER)',
    counterDesc: 'ดูดซับการโจมตีหลังโล่กำบังแล้วสวนกลับอย่างรุนแรง',
    controlTitle: 'ควบคุมกาลเวลา (CHRONO CONTROL)',
    controlDesc: 'บิดเบือนเวลาและเร่งทักษะเพื่อครองสนามรบอย่างสมบูรณ์',
    equipAndPlay: 'ติดตั้งและออกรบทันที',
    close: 'ตัดสินใจภายหลัง'
  },
  vi: {
    badge: 'TÙY BIẾN BỘ BÀI KHỞI ĐẦU CHIẾN THUẬT',
    title: 'CHỌN HỌC THUYẾT CHIẾN ĐẤU CỦA BẠN',
    subtitle: 'Trang bị ngay bộ bài hiệp đồng 5 đơn vị tối ưu chỉ với 1 chạm.',
    rushTitle: 'TẤN CÔNG THẦN TỐC (ASSAULT RUSH)',
    rushDesc: 'Áp đảo phòng tuyến đối phương bằng tốc độ và đòn chí mạng bộc phát.',
    counterTitle: 'PHẢN CÔNG PHÒNG THỦ (TACTICAL COUNTER)',
    counterDesc: 'Hấp thụ hỏa lực đối thủ phía sau khiên chắn kiên cố rồi phản kích.',
    controlTitle: 'KIỂM SOÁT THỜI GIAN (CHRONO CONTROL)',
    controlDesc: 'Thao túng dòng thời gian và tăng tốc kỹ năng để kiểm soát trận địa.',
    equipAndPlay: 'TRANG BỊ & XUẤT TRẬN',
    close: 'QUYẾT ĐỊNH SAU'
  }
};

export const PersonalizedStarterDeckModal: React.FC<PersonalizedStarterDeckModalProps> = ({
  isOpen,
  onClose,
  onDeployToBattle,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = I18N_TEXTS[currentLang] || I18N_TEXTS.ko;

  const [selectedPresetId, setSelectedPresetId] = useState<'ASSAULT_RUSH' | 'TACTICAL_COUNTER' | 'CHRONO_CONTROL'>('ASSAULT_RUSH');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: StarterDeckPreset) => {
    triggerHaptic('tap');
    setSelectedPresetId(preset.id);
  };

  const handleEquipAndDeploy = () => {
    triggerHaptic('medium');
    const chosenPreset = STARTER_DECK_PRESETS.find(p => p.id === selectedPresetId) || STARTER_DECK_PRESETS[0];

    try {
      // 0ms local storage deck sync
      localStorage.setItem('hero_user_deck', JSON.stringify(chosenPreset.cards));
      localStorage.setItem('hero_personalized_starter_chosen', chosenPreset.id);

      // Add to inventory records safely
      const existingInventory = JSON.parse(localStorage.getItem('hero_user_inventory') || '{}');
      chosenPreset.cards.forEach(card => {
        const idNum = Number(card.id);
        if (!existingInventory[idNum]) {
          existingInventory[idNum] = {
            card,
            quantity: 1,
            unlockedAt: Date.now(),
          };
        }
      });
      localStorage.setItem('hero_user_inventory', JSON.stringify(existingInventory));
    } catch {
      // safe storage failover
    }

    onClose();
    onDeployToBattle(chosenPreset.cards);
  };

  const activePreset = STARTER_DECK_PRESETS.find(p => p.id === selectedPresetId) || STARTER_DECK_PRESETS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-white/15 rounded-xl p-5 sm:p-6 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span className="text-[10px] tracking-widest text-cyan-300 uppercase font-bold">
              {tr.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {tr.title}
          </h2>
          <p className="text-[11px] text-gray-300 mt-1">
            {tr.subtitle}
          </p>
        </div>

        {/* 3 Doctrine Cards (min-h-[52px]) */}
        <div className="grid grid-cols-1 gap-2.5">
          {STARTER_DECK_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            const title = tr[preset.titleKey] || preset.id;
            const desc = tr[preset.descKey] || '';

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all min-h-[52px] bg-gradient-to-r ${preset.themeClass} ${
                  isSelected
                    ? `${preset.borderClass} ring-1 ring-white/20 shadow-lg scale-[1.01]`
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white shadow-xs' : 'bg-gray-600'}`} />
                    <span className={`text-xs font-bold ${preset.accentText}`}>
                      {title}
                    </span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded border font-bold ${preset.accentBg}`}>
                    5-UNIT SYNERGY
                  </span>
                </div>
                <p className="text-[10px] text-gray-300 pl-4.5 leading-relaxed">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Deck Unit Lineup Preview */}
        <div className="p-3 bg-black/60 border border-white/10 rounded-lg space-y-1.5">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider flex justify-between">
            <span>STARTING LINEUP ({activePreset.id})</span>
            <span className="text-emerald-400 font-bold">AVG PWR 8,400</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {activePreset.cards.map((c, i) => (
              <div key={c.id} className="p-1.5 bg-white/5 border border-white/10 rounded text-center">
                <div className="text-[8px] text-gray-400">SLOT 0{i + 1}</div>
                <div className="text-[9px] font-bold text-white truncate mt-0.5">{(c.title || c.title_dis || '').split(' ')[0]}</div>
                <div className="text-[8px] text-cyan-400 font-bold">{c.rarity.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleEquipAndDeploy}
            className="w-full min-h-[48px] bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 active:scale-[0.98] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
              <line x1="13" y1="19" x2="19" y2="13" />
              <line x1="16" y1="16" x2="20" y2="20" />
              <line x1="19" y1="21" x2="21" y2="19" />
            </svg>
            {tr.equipAndPlay}
          </button>

          <button
            onClick={onClose}
            className="w-full min-h-[40px] bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs transition-colors"
          >
            {tr.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedStarterDeckModal;
