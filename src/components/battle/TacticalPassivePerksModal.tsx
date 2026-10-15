import React, { useState, useEffect } from 'react';
import {
  TACTICAL_PERKS_CATALOG,
  getUnlockedPerks,
  getHeroEquippedPerks,
  equipPerkToHero,
  unequipPerkFromHero,
  calculateHeroPerkModifiers,
  TacticalPerk
} from '../../utils/perkSystem';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalPassivePerksModalProps {
  isOpen: boolean;
  heroId: string | number;
  heroName?: string;
  onClose: () => void;
  onPerkUpdated?: () => void;
  language?: string;
}

const PERK_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '히어로 전술 패시브 특성 소켓',
    subtitle: '110종 미니게임 업적 배지로 영구 패시브를 소켓에 장착합니다.',
    socketTitle: '전술 특성 슬롯 (최대 3개)',
    emptySocket: '빈 소켓 [특성 장착 대기]',
    unequipBtn: '해제',
    equipBtn: '장착',
    fullSocketsMsg: '3개 소켓이 모두 찼습니다. 기존 특성을 해제 후 장착하세요.',
    availablePerksTitle: '보유 미니게임 전술 배지 풀',
    totalStatsTitle: '총 적용 패시브 가중치',
    perkCritName: '정밀 타격 코어 (+8% 치명타율)',
    perkCritDesc: '미니게임 고득점 연계: 적 약점을 분석하여 치명타 확률을 8% 상승시킵니다.',
    perkCdName: '양자 가속 회로 (-10% 쿨다운)',
    perkCdDesc: '미니게임 스피드런 달성: 스킬 쿨다운 주기를 10% 단축합니다.',
    perkShieldName: '방벽 생성 매트릭스 (+12% 실드)',
    perkShieldDesc: '미니게임 생존 달성: 전투 개시 시 최대 HP의 12% 보호막을 전개합니다.',
    perkPowerName: '오버클럭 타격기 (+10% 공격력)',
    perkPowerDesc: '미니게임 콤보 달성: 기본 공격력을 10% 증폭시킵니다.',
    perkDrainName: '나노 뱀프 흡수기 (+6% 생명력 흡수)',
    perkDrainDesc: '미니게임 보스 클리어: 타격 시 피해량의 6%를 체력으로 회복합니다.',
    closeBtn: '완료'
  },
  en: {
    modalTitle: 'HERO TACTICAL PASSIVE PERK SOCKETS',
    subtitle: 'EQUIP PERMANENT PASSIVES UNLOCKED FROM 110 MINIGAME MILESTONES',
    socketTitle: 'TACTICAL PERK SLOTS (MAX 3)',
    emptySocket: 'EMPTY SOCKET [READY FOR PERK]',
    unequipBtn: 'REMOVE',
    equipBtn: 'EQUIP',
    fullSocketsMsg: 'All 3 sockets equipped. Remove an existing perk to slot another.',
    availablePerksTitle: 'UNLOCKED MINIGAME PERK POOL',
    totalStatsTitle: 'ACTIVE PASSIVE MODIFIERS',
    perkCritName: 'PRECISION CORE (+8% CRIT CHANCE)',
    perkCritDesc: 'Minigame high combo: Boosts critical strike probability by 8%.',
    perkCdName: 'QUANTUM ACCEL (-10% COOLDOWN)',
    perkCdDesc: 'Minigame speedrun: Shortens skill reload intervals by 10%.',
    perkShieldName: 'BARRIER MATRIX (+12% SHIELD)',
    perkShieldDesc: 'Minigame survival: Generates a 12% HP barrier at combat start.',
    perkPowerName: 'OVERCLOCK STRIKE (+10% POWER)',
    perkPowerDesc: 'Minigame combo: Amplifies raw hero combat power by 10%.',
    perkDrainName: 'NANITE DRAIN (+6% LIFE VAMP)',
    perkDrainDesc: 'Minigame boss clear: Restores 6% of dealt damage as vitality.',
    closeBtn: 'CONFIRM'
  },
  ja: {
    modalTitle: 'ヒーロー戦術パッシブソケット',
    subtitle: '110種ミニゲーム実績バッジで永続パッシブを装備します。',
    socketTitle: '戦術特性スロット (最大3枠)',
    emptySocket: '空きスロット [特性装着可能]',
    unequipBtn: '解除',
    equipBtn: '装備',
    fullSocketsMsg: '3スロット全て装備済みです。',
    availablePerksTitle: '開放済みミニゲームバッジプール',
    totalStatsTitle: '適用中パッシブ合計',
    perkCritName: '精密射撃コア (+8% 会心率)',
    perkCritDesc: '会心率を8%上昇させます。',
    perkCdName: '量子加速回路 (-10% クールダウン)',
    perkCdDesc: 'スキルリロード間隔を10%短縮します。',
    perkShieldName: 'バリア展開マトリクス (+12% シールド)',
    perkShieldDesc: '戦闘開始時に12%のシールドを展開します。',
    perkPowerName: 'オーバークロック撃 (+10% 攻撃力)',
    perkPowerDesc: '基本戦闘力を10%増幅します。',
    perkDrainName: 'ナノドレイン (+6% HP吸収)',
    perkDrainDesc: '与ダメージの6%を回復します。',
    closeBtn: '完了'
  },
  'zh-CN': {
    modalTitle: '英雄战术被动特性插槽',
    subtitle: '装备源自110款小游戏成就的永久战术被动芯片。',
    socketTitle: '战术特性插槽 (上限3槽)',
    emptySocket: '空置插槽 [可插入芯片]',
    unequipBtn: '卸下',
    equipBtn: '装配',
    fullSocketsMsg: '3个插槽均已装满。',
    availablePerksTitle: '已解锁小游戏战术徽章库',
    totalStatsTitle: '当前激活被动加成总计',
    perkCritName: '精密打击核心 (+8% 暴击率)',
    perkCritDesc: '暴击概率提升 8%。',
    perkCdName: '量子加速回路 (-10% 冷却时间)',
    perkCdDesc: '战术技能冷却缩短 10%。',
    perkShieldName: '力场护盾矩阵 (+12% 护盾)',
    perkShieldDesc: '战斗开始生成相当于最大生命12%的护盾。',
    perkPowerName: '超频重击模块 (+10% 战力)',
    perkPowerDesc: '提升 10% 基础攻击战力。',
    perkDrainName: '纳米汲取装置 (+6% 吸血率)',
    perkDrainDesc: '造成伤害的 6% 转化为生命回复。',
    closeBtn: '完成'
  },
  'zh-TW': {
    modalTitle: '英雄戰術被動特性插槽',
    subtitle: '裝備源自110款小遊戲成就的永久戰術被動晶片。',
    socketTitle: '戰術特性插槽 (上限3槽)',
    emptySocket: '空置插槽 [可插入晶片]',
    unequipBtn: '卸下',
    equipBtn: '裝配',
    fullSocketsMsg: '3個插槽均已裝滿。',
    availablePerksTitle: '已解鎖小遊戲戰術徽章庫',
    totalStatsTitle: '當前啟用被動加成總計',
    perkCritName: '精密打擊核心 (+8% 暴擊率)',
    perkCritDesc: '暴擊機率提升 8%。',
    perkCdName: '量子加速迴路 (-10% 冷卻時間)',
    perkCdDesc: '戰術技能冷卻縮短 10%。',
    perkShieldName: '力場護盾矩陣 (+12% 護盾)',
    perkShieldDesc: '戰鬥開始生成相當於最大生命12%的護盾。',
    perkPowerName: '超頻重擊模組 (+10% 戰力)',
    perkPowerDesc: '提升 10% 基礎攻擊戰力。',
    perkDrainName: '奈米汲取裝置 (+6% 吸血率)',
    perkDrainDesc: '造成傷害的 6% 轉化為生命回復。',
    closeBtn: '完成'
  },
  de: {
    modalTitle: 'HELDEN-TAKTIK-PERK-SLOTS',
    subtitle: 'PERMANENTE PASSIV-EFFEKTE DURCH MINISPIEL-MEILENSTEINE',
    socketTitle: 'PERK-SLOTS (MAX. 3)',
    emptySocket: 'LEERER SLOT',
    unequipBtn: 'ENTFERNEN',
    equipBtn: 'AUSRÜSTEN',
    fullSocketsMsg: 'Alle 3 Slots belegt.',
    availablePerksTitle: 'FREIGESCHALTETE PERKS',
    totalStatsTitle: 'AKTIVE MODIFIKATOREN',
    perkCritName: 'PRÄZISIONSKERN (+8% KRIT)',
    perkCritDesc: 'Erhöht die Krit-Chance um 8%.',
    perkCdName: 'QUANTEN-BESCHLEUNIGER (-10% CD)',
    perkCdDesc: 'Verkürzt Cooldowns um 10%.',
    perkShieldName: 'SCHUTZMATRIX (+12% SCHILD)',
    perkShieldDesc: 'Erzeugt zu Beginn ein Schild.',
    perkPowerName: 'ÜBERTAKTUNGS-SCHLAG (+10% POWER)',
    perkPowerDesc: 'Verstärkt die Kampfkraft um 10%.',
    perkDrainName: 'NANITEN-SAUGER (+6% VAMPIRISMUS)',
    perkDrainDesc: 'Wandelt Schaden in Heilung um.',
    closeBtn: 'SCHLIESSEN'
  },
  es: {
    modalTitle: 'RANURAS DE VENTAJAS TÁCTICAS DE HÉROE',
    subtitle: 'EQUIPA PASIVAS PERMANENTES DE 110 MINIJUEGOS',
    socketTitle: 'RANURAS DE VENTAJAS (MÁX 3)',
    emptySocket: 'RANURA VACÍA',
    unequipBtn: 'QUITAR',
    equipBtn: 'EQUIPAR',
    fullSocketsMsg: '3 ranuras ocupadas.',
    availablePerksTitle: 'VENTAJAS DESBLOQUEADAS',
    totalStatsTitle: 'MODIFICADORES ACTIVOS',
    perkCritName: 'NÚCLEO DE PRECISIÓN (+8% CRÍTICO)',
    perkCritDesc: 'Aumenta el crítico en un 8%.',
    perkCdName: 'ACELERACIÓN CUÁNTICA (-10% CD)',
    perkCdDesc: 'Reduce los enfriamientos un 10%.',
    perkShieldName: 'MATRIZ DE BARRERA (+12% ESCUDO)',
    perkShieldDesc: 'Despliega un escudo al inicio.',
    perkPowerName: 'GOLPE SOBRERELOJ (+10% PODER)',
    perkPowerDesc: 'Aumenta el poder de combate un 10%.',
    perkDrainName: 'DRENAJE DE NANITOS (+6% VAMPIRO)',
    perkDrainDesc: 'Restaura vida con el daño infligido.',
    closeBtn: 'CERRAR'
  },
  fr: {
    modalTitle: 'EMPLACEMENTS DE PERKS TACTIQUES DU HÉROS',
    subtitle: 'ÉQUIPEZ DES PASSIFS DÉBLOQUÉS VIA LES 110 MINI-JEUX',
    socketTitle: 'SLOTS TACTIQUES (MAX 3)',
    emptySocket: 'SLOT VIDE',
    unequipBtn: 'RETIRER',
    equipBtn: 'ÉQUIPER',
    fullSocketsMsg: '3 slots occupés.',
    availablePerksTitle: 'PERKS DÉBLOQUÉS',
    totalStatsTitle: 'MODIFICATEURS ACTIFS',
    perkCritName: 'CŒUR DE PRÉCISION (+8% CRITIQUE)',
    perkCritDesc: 'Augmente les coups critiques de 8%.',
    perkCdName: 'ACCÉLÉRATEUR QUANTIQUE (-10% RECHARGE)',
    perkCdDesc: 'Réduit les temps de recharge de 10%.',
    perkShieldName: 'MATRICE DE BOUCLIER (+12% BOUCLIER)',
    perkShieldDesc: 'Crée un bouclier au début du combat.',
    perkPowerName: 'FRAPPE SURCADENCÉE (+10% PUISSANCE)',
    perkPowerDesc: 'Amplifie la puissance de 10%.',
    perkDrainName: 'DRAIN DE NANITES (+6% VOL DE VIE)',
    perkDrainDesc: 'Convertit les dégâts en soins.',
    closeBtn: 'VALIDER'
  },
  id: {
    modalTitle: 'SLOT PERK PASIF TAKTIS HERO',
    subtitle: 'PASANG PASIF PERMANEN DARI PRESTASI 110 MINIGAME',
    socketTitle: 'SLOT PERK (MAKS 3)',
    emptySocket: 'SLOT KOSONG',
    unequipBtn: 'LEPAS',
    equipBtn: 'PASANG',
    fullSocketsMsg: 'Semua 3 slot terisi.',
    availablePerksTitle: 'POOL PERK DIBUKA',
    totalStatsTitle: 'MODIFIKATOR AKTIF',
    perkCritName: 'INTI PRESISI (+8% KRITIKAL)',
    perkCritDesc: 'Meningkatkan peluang kritikal 8%.',
    perkCdName: 'AKSELERASI KUANTUM (-10% CD)',
    perkCdDesc: 'Mengurangi cooldown skill 10%.',
    perkShieldName: 'MATRIKS PERISAI (+12% SHIELD)',
    perkShieldDesc: 'Membuka perisai di awal pertarungan.',
    perkPowerName: 'HANTAMAN OVERCLOCK (+10% POWER)',
    perkPowerDesc: 'Meningkatkan kekuatan 10%.',
    perkDrainName: 'SERAP NANITE (+6% VAMP)',
    perkDrainDesc: 'Memulihkan HP dari serangan.',
    closeBtn: 'SELESAI'
  },
  ru: {
    modalTitle: 'СЛОТЫ ПАССИВНЫХ ПЕРКОВ ГЕРОЯ',
    subtitle: 'УСТАНАВЛИВАЙТЕ ПЕРКИ ИЗ ДОСТИЖЕНИЙ 110 МИНИ-ИГР',
    socketTitle: 'ТАКТИЧЕСКИЕ СЛОТЫ (МАКС 3)',
    emptySocket: 'ПУСТОЙ СЛОТ',
    unequipBtn: 'СНЯТЬ',
    equipBtn: 'УСТАНОВИТЬ',
    fullSocketsMsg: 'Все 3 слота заняты.',
    availablePerksTitle: 'РАЗБЛОКИРОВАННЫЕ ПЕРКИ',
    totalStatsTitle: 'АКТИВНЫЕ МОДИФИКАТОРЫ',
    perkCritName: 'ЯДРО ТОЧНОСТИ (+8% КРИТ)',
    perkCritDesc: 'Шанс критического удара +8%.',
    perkCdName: 'КВАНТОВЫЙ РАЗГОН (-10% КД)',
    perkCdDesc: 'Перезарядка способностей быстрее на 10%.',
    perkShieldName: 'МАТРИЦА ЩИТА (+12% ЩИТ)',
    perkShieldDesc: 'Щит в начале боя.',
    perkPowerName: 'УДАР С РАЗГОНОМ (+10% МОЩЬ)',
    perkPowerDesc: 'Увеличение боевой мощи на 10%.',
    perkDrainName: 'НАНО-ВАМПИРИЗМ (+6% КРАЖА ХП)',
    perkDrainDesc: 'Лечение от нанесенного урона.',
    closeBtn: 'ЗАКРЫТЬ'
  },
  th: {
    modalTitle: 'ช่องใส่คุณสมบัติทางยุทธวิธีของฮีโร่',
    subtitle: 'ติดตั้งคุณสมบัติติดตัวถาวรจากความสำเร็จใน 110 มินิเกม',
    socketTitle: 'สล็อตเพิร์ก (สูงสุด 3 ช่อง)',
    emptySocket: 'ช่องว่าง [พร้อมติดตั้ง]',
    unequipBtn: 'ถอดออก',
    equipBtn: 'ติดตั้ง',
    fullSocketsMsg: 'ติดตั้งครบทั้ง 3 ช่องแล้ว',
    availablePerksTitle: 'คลังเพิร์กที่ปลดล็อคแล้ว',
    totalStatsTitle: 'ค่าสถานะติดตัวที่ทำงานอยู่',
    perkCritName: 'แกนความแม่นยำ (+8% คริติคอล)',
    perkCritDesc: 'เพิ่มโอกาสคริติคอล 8%',
    perkCdName: 'วงจรควอนตัมเร่งความเร็ว (-10% คูลดาวน์)',
    perkCdDesc: 'ลดคูลดาวน์สกิลลง 10%',
    perkShieldName: 'เมทริกซ์โล่ป้องกัน (+12% โล่)',
    perkShieldDesc: 'กางโล่เมื่อเริ่มการต่อสู้',
    perkPowerName: 'การโจมตีโอเวอร์คล็อก (+10% พลัง)',
    perkPowerDesc: 'เพิ่มพลังโจมตี 10%',
    perkDrainName: 'การดูดกลืนนาไนต์ (+6% ดูดเลือด)',
    perkDrainDesc: 'ฟื้นฟู HP จากดาเมจ',
    closeBtn: 'เสร็จสิ้น'
  },
  vi: {
    modalTitle: 'KHE CẮM ĐẶC TÍNH NỘI TẠI CHIẾN THUẬT',
    subtitle: 'TRANG BỊ NỘI TẠI VĨNH VIỄN MỞ KHÓA TỪ 110 MINI-GAME',
    socketTitle: 'KHE CẮM ĐẶC TÍNH (TỐI ĐA 3 KHE)',
    emptySocket: 'KHE TRỐNG [SẴN SÀNG]',
    unequipBtn: 'THÁO',
    equipBtn: 'LẮP',
    fullSocketsMsg: 'Cả 3 khe cắm đã đầy.',
    availablePerksTitle: 'KHO ĐẶC TÍNH ĐÃ MỞ KHÓA',
    totalStatsTitle: 'TỔNG CHỈ SỐ NỘI TẠI KÍCH HOẠT',
    perkCritName: 'LÕI CHÍ MẠNG CHÍNH XÁC (+8% CHÍ MẠNG)',
    perkCritDesc: 'Tăng tỷ lệ chí mạng thêm 8%.',
    perkCdName: 'MẠCH TĂNG TỐC LƯỢNG TỬ (-10% HỒI CHIÊU)',
    perkCdDesc: 'Rút ngắn thời gian hồi chiêu 10%.',
    perkShieldName: 'MA TRẬN KHIÊN CHẮN (+12% KHIÊN)',
    perkShieldDesc: 'Tạo lớp khiên bảo vệ vào đầu trận.',
    perkPowerName: 'ĐÒN ĐÁNH ÉP XUNG (+10% SỨC MẠNH)',
    perkPowerDesc: 'Khuếch đại sức mạnh chiến đấu 10%.',
    perkDrainName: 'HÚT MÁU NANO (+6% HÚT MÁU)',
    perkDrainDesc: 'Chuyển hóa 6% sát thương thành sinh lực.',
    closeBtn: 'HOÀN THÀNH'
  }
};

export const TacticalPassivePerksModal: React.FC<TacticalPassivePerksModalProps> = ({
  isOpen,
  heroId,
  heroName,
  onClose,
  onPerkUpdated,
  language: propLang
}) => {
  const { language: contextLang } = useGameSettings();
  const currentLang = propLang || contextLang || 'ko';
  const tr = PERK_I18N[currentLang] || PERK_I18N.ko;

  const [equippedPerkIds, setEquippedPerkIds] = useState<string[]>([]);
  const [unlockedPerkIds, setUnlockedPerkIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEquippedPerkIds(getHeroEquippedPerks(heroId));
      setUnlockedPerkIds(getUnlockedPerks());
    }
  }, [isOpen, heroId]);

  const handleEquip = (perkId: string) => {
    triggerHaptic('tap');
    const success = equipPerkToHero(heroId, perkId);
    if (success) {
      setEquippedPerkIds(getHeroEquippedPerks(heroId));
      if (onPerkUpdated) onPerkUpdated();
    }
  };

  const handleUnequip = (perkId: string) => {
    triggerHaptic('tap');
    unequipPerkFromHero(heroId, perkId);
    setEquippedPerkIds(getHeroEquippedPerks(heroId));
    if (onPerkUpdated) onPerkUpdated();
  };

  if (!isOpen) return null;

  const totalMods = calculateHeroPerkModifiers(heroId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#090d16]/95 border border-white/15 rounded-xl p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-[11px] font-bold text-amber-300 tracking-wider uppercase">
              {tr.modalTitle} {heroName ? `// ${heroName}` : ''}
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

        <p className="text-[11px] text-gray-300">
          {tr.subtitle}
        </p>

        {/* 3 Tactical Sockets (Max 3) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase text-gray-400">{tr.socketTitle}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[0, 1, 2].map((slotIdx) => {
              const perkId = equippedPerkIds[slotIdx];
              const perk = TACTICAL_PERKS_CATALOG.find(p => p.id === perkId);

              return (
                <div
                  key={slotIdx}
                  className={`p-3 rounded-lg border flex flex-col justify-between min-h-[72px] ${
                    perk
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-300'
                      : 'bg-black/50 border-white/10 text-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">SOCKET 0{slotIdx + 1}</span>
                    {perk && (
                      <span className="text-[9px] px-1 rounded bg-amber-900/50 text-amber-200 font-bold border border-amber-500/30">
                        {perk.category}
                      </span>
                    )}
                  </div>

                  {perk ? (
                    <div className="my-1">
                      <div className="text-[11px] font-bold text-white truncate">{tr[perk.nameKey]}</div>
                      <button
                        onClick={() => handleUnequip(perk.id)}
                        className="mt-1 text-[9px] text-rose-400 hover:text-rose-300 underline font-bold"
                      >
                        [{tr.unequipBtn}]
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-500 italic my-auto">
                      {tr.emptySocket}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregated Modifiers Preview */}
        <div className="p-3 bg-black/60 border border-white/10 rounded-lg space-y-1 text-xs">
          <div className="text-[10px] text-gray-400 uppercase font-bold">{tr.totalStatsTitle}</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="text-amber-400 font-bold">CRIT: +{totalMods.critChance}%</div>
            <div className="text-cyan-400 font-bold">CD: -{totalMods.cooldownReduction}%</div>
            <div className="text-emerald-400 font-bold">SHIELD: +{totalMods.shieldBonus}%</div>
            <div className="text-rose-400 font-bold">PWR: +{totalMods.powerBonus}%</div>
          </div>
        </div>

        {/* Available Perks Pool */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase text-gray-400">{tr.availablePerksTitle}</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {TACTICAL_PERKS_CATALOG.map((perk) => {
              const isEquipped = equippedPerkIds.includes(perk.id);
              const isUnlocked = unlockedPerkIds.includes(perk.id);
              const canEquip = !isEquipped && equippedPerkIds.length < 3 && isUnlocked;

              return (
                <div
                  key={perk.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                    isEquipped
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-[11px] truncate">{tr[perk.nameKey]}</span>
                      <span className="text-[9px] text-gray-400 font-mono">[{perk.minigameSource}]</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{tr[perk.descKey]}</div>
                  </div>

                  <div>
                    {isEquipped ? (
                      <button
                        onClick={() => handleUnequip(perk.id)}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded text-[10px] font-bold"
                      >
                        {tr.unequipBtn}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEquip(perk.id)}
                        disabled={!canEquip}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                          canEquip
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300 cursor-pointer active:scale-95'
                            : 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {tr.equipBtn}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full min-h-[44px] bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 font-bold rounded-lg text-xs transition-colors"
        >
          {tr.closeBtn}
        </button>
      </div>
    </div>
  );
};

export default TacticalPassivePerksModal;
