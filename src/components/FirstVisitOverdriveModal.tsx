import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { useGameSettings } from '../contexts/GameSettingsContext';

export interface FirstVisitOverdriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterDeck: () => void;
  language?: Language;
}

type ModalStage = 'PACK_READY' | 'CARD_REVEALED' | 'OVERDRIVE_CLIMAX' | 'OVERDRIVE_IMPACT' | 'REWARD_CLAIM';

interface OverdriveTranslation {
  headerProtocol: string;
  skipProtocol: string;
  // Stage 1: Pack
  classifiedDrop: string;
  locked: string;
  bit4096: string;
  containerDetected: string;
  packTitle: string;
  packDesc: string;
  specClassLabel: string;
  specClassVal: string;
  specPwrLabel: string;
  specClearanceLabel: string;
  specClearanceVal: string;
  unsealBtn: string;
  // Stage 1: Reveal
  unsealComplete: string;
  unitRarity: string;
  unitName: string;
  combatPwrLabel: string;
  tacticalCoreStatus: string;
  synergyStatus: string;
  weaponDesc: string;
  urgentAlert: string;
  deployBtn: string;
  // Stage 2: Climax
  climaxHeader: string;
  timeLimitPrefix: string;
  hostileBoss: string;
  bossClass: string;
  bossArmor: string;
  alliedCore: string;
  readyLabel: string;
  condenserStatus: string;
  strikeReady: string;
  criticalDmg: string;
  criticalResult: string;
  engageBtn: string;
  engagingBtn: string;
  // Stage 3: Claim
  victoryConfirmed: string;
  rewardTitle: string;
  rewardDesc: string;
  currencyDropBadge: string;
  ticketTitle: string;
  ticketDesc: string;
  accessBadge: string;
  sovereignTitle: string;
  sovereignDesc: string;
  persistenceNotice: string;
  claimBtn: string;
  systemFooter: string;
}

const TRANSLATIONS: Record<string, OverdriveTranslation> = {
  ko: {
    headerProtocol: '전술 오버드라이브 // 프로토콜 01',
    skipProtocol: '프로토콜 건너뛰기',
    classifiedDrop: '일급 기밀 // SSR 보급',
    locked: '보안 잠금',
    bit4096: '4096-비트',
    containerDetected: '보안 암호화 전술 컨테이너 감지',
    packTitle: '전술 SSR 보급 팩',
    packDesc: '최초 지휘관 인가가 확인되었습니다. 고우선순위 궤도 전술 보급 컨테이너 봉인 해제 대기 중.',
    specClassLabel: '함급',
    specClassVal: '드레드노트',
    specPwrLabel: '예상 전투력',
    specClearanceLabel: '보안 인가',
    specClearanceVal: '1등급 SSR',
    unsealBtn: 'SSR 전술 보급 팩 개봉하기',
    unsealComplete: '봉인 해제 완료 // SSR 유닛 획득',
    unitRarity: 'SSR // 드레드노트',
    unitName: 'SH-101 // 소버린 (SOVEREIGN)',
    combatPwrLabel: '전투력 (PWR)',
    tacticalCoreStatus: '전술 코어: 장착 완료',
    synergyStatus: '시너지: 오버드라이브',
    weaponDesc: '양자 충전 결합 궤도 함포 포격 시스템 완비',
    urgentAlert: '[긴급] 적대적 타이탄 신호 접근 중. 즉각 요격 출격하십시오.',
    deployBtn: '유닛 출격 및 요격 개시',
    climaxHeader: '타이탄 결전 // 클라이맥스',
    timeLimitPrefix: '제한시간: ',
    hostileBoss: '적 타이탄: 에이펙스 골리앗 // MK-IV',
    bossClass: '분류: 타이탄 커럽터',
    bossArmor: '장갑: 초중장갑 요새',
    alliedCore: 'SH-101 // 오버드라이브 코어',
    readyLabel: '준비 완료',
    condenserStatus: '양자 응축기: 최대 출력',
    strikeReady: '치명적 타격 준비 완료',
    criticalDmg: '크리티컬 스트라이크 // 999,999 피해',
    criticalResult: '목표 구조체 파괴. 승리 확인.',
    engageBtn: '전술 오버드라이브 가동',
    engagingBtn: '오버드라이브 가동 중',
    victoryConfirmed: '오버드라이브 작전 승리 확인',
    rewardTitle: '전술 작전 보상 승인',
    rewardDesc: '전투 평가 SSS 등급 달성. 지휘관 계정으로 전술 보상이 정식 지급되었습니다.',
    currencyDropBadge: '재화 보급',
    ticketTitle: '프라임 소환 티켓 10회권',
    ticketDesc: '최상위 전술 유닛 징집용 정규 지휘 티켓',
    accessBadge: '전술 인가',
    sovereignTitle: 'SH-101 소버린 24시간',
    sovereignDesc: '전투력 9,850 기동 전술 지휘 덱 24시간 완전 개방',
    persistenceNotice: '데이터가 로컬 전술 스토리지에 안전하게 동기화되었습니다. 탑승을 환영합니다, 지휘관님.',
    claimBtn: '보상 수령 및 지휘 덱 입장',
    systemFooter: '시스템 // SNS히어로 혁명 전술 온보딩 V1',
  },
  en: {
    headerProtocol: 'TACTICAL OVERDRIVE // PROTOCOL 01',
    skipProtocol: 'Skip Protocol',
    classifiedDrop: 'CLASSIFIED // SSR DROP',
    locked: 'LOCKED',
    bit4096: '4096-BIT',
    containerDetected: 'SECURE ENCRYPTED CONTAINER DETECTED',
    packTitle: 'TACTICAL SSR SUPPLY PACK',
    packDesc: 'First-time authorization verified. High-priority orbital supply container awaiting unseal.',
    specClassLabel: 'CLASS',
    specClassVal: 'DREADNOUGHT',
    specPwrLabel: 'EST. PWR',
    specClearanceLabel: 'CLEARANCE',
    specClearanceVal: 'TIER-1 SSR',
    unsealBtn: 'UNSEAL SSR TACTICAL PACK',
    unsealComplete: 'UNSEAL COMPLETE // SSR UNIT ACQUIRED',
    unitRarity: 'SSR // DREADNOUGHT',
    unitName: 'SH-101 // SOVEREIGN',
    combatPwrLabel: 'COMBAT PWR',
    tacticalCoreStatus: 'TACTICAL CORE: ARMED',
    synergyStatus: 'SYNERGY: OVERDRIVE',
    weaponDesc: 'ORBITAL CANNON ARRAY WITH QUANTUM CHARGE COUPLING',
    urgentAlert: 'URGENT: Hostile titan signature incoming. Engage combat deployment immediately.',
    deployBtn: 'DEPLOY UNIT & COMMENCE INTERCEPT',
    climaxHeader: 'TITAN ENGAGEMENT // CLIMAX',
    timeLimitPrefix: 'TIME LIMIT: ',
    hostileBoss: 'HOSTILE: APEX GOLIATH // MK-IV',
    bossClass: 'CLASS: TITAN CORRUPTOR',
    bossArmor: 'ARMOR: HEAVY FORTIFIED',
    alliedCore: 'SH-101 // OVERDRIVE CORE',
    readyLabel: 'READY',
    condenserStatus: 'QUANTUM CONDENSER: MAX CHARGE',
    strikeReady: 'LETHAL STRIKE READY',
    criticalDmg: 'CRITICAL STRIKE // 999,999 DAMAGE',
    criticalResult: 'TARGET STRUCTURE DESTROYED. VICTORY CONFIRMED.',
    engageBtn: 'ENGAGE TACTICAL OVERDRIVE',
    engagingBtn: 'OVERDRIVE ENGAGED',
    victoryConfirmed: 'OVERDRIVE VICTORY CONFIRMED',
    rewardTitle: 'TACTICAL REWARD AUTHORIZATION',
    rewardDesc: 'Combat performance rated SSS. Rewards registered to your command account.',
    currencyDropBadge: 'CURRENCY DROP',
    ticketTitle: '10x PRIME SUMMON TICKET',
    ticketDesc: 'Standard deployment protocol tickets for premium units.',
    accessBadge: 'TACTICAL ACCESS',
    sovereignTitle: 'SH-101 SOVEREIGN 24H',
    sovereignDesc: 'Full command deck clearance with PWR 9,850 capability.',
    persistenceNotice: 'Data persistence synced to local tactical storage. Welcome aboard, Commander.',
    claimBtn: 'CLAIM & ENTER COMMAND DECK',
    systemFooter: 'SYSTEM // SNSHERO REVOLUTION TACTICAL FTUE V1',
  },
  ja: {
    headerProtocol: '戦術オーバードライブ // プロトコル 01',
    skipProtocol: 'プロトコルをスキップ',
    classifiedDrop: '最高機密 // SSR補給',
    locked: 'ロック',
    bit4096: '4096-BIT',
    containerDetected: '暗号化戦術コンテナを検知',
    packTitle: '戦術SSR補給パック',
    packDesc: '司令官認証完了。優先軌道戦術補給コンテナの封印解除待機中。',
    specClassLabel: '艦級',
    specClassVal: 'ドレッドノート',
    specPwrLabel: '推定戦闘力',
    specClearanceLabel: 'セキュリティ認証',
    specClearanceVal: 'ティア1 SSR',
    unsealBtn: 'SSR戦術補給パックを開封',
    unsealComplete: '開封完了 // SSRユニット獲得',
    unitRarity: 'SSR // ドレッドノート',
    unitName: 'SH-101 // ソヴリン (SOVEREIGN)',
    combatPwrLabel: '戦闘力 (PWR)',
    tacticalCoreStatus: '戦術コア: 装備完了',
    synergyStatus: 'シナジー: オーバードライブ',
    weaponDesc: '量子充填結合型軌道砲撃システム完備',
    urgentAlert: '【緊急】敵性タイタン反応接近中。直ちに出撃せよ。',
    deployBtn: 'ユニット出撃 & 迎撃開始',
    climaxHeader: 'タイタン決戦 // クライマックス',
    timeLimitPrefix: '制限時間: ',
    hostileBoss: '敵性目標: エイペックス・ゴライアス // MK-IV',
    bossClass: '分類: タイタン・コラプター',
    bossArmor: '装甲: 超重装甲要塞',
    alliedCore: 'SH-101 // オーバードライブ・コア',
    readyLabel: '準備完了',
    condenserStatus: '量子凝縮器: 最大出力',
    strikeReady: '致命的打撃準備完了',
    criticalDmg: 'クリティカルストライク // 999,999ダメージ',
    criticalResult: '目標構造体破壊。完全勝利確認。',
    engageBtn: '戦術オーバードライブ発動',
    engagingBtn: 'オーバードライブ発動中',
    victoryConfirmed: '作戦勝利確認',
    rewardTitle: '戦術作戦報酬の承認',
    rewardDesc: '戦闘評価SSS達成。司令官アカウントへ戦術報酬が付与されました。',
    currencyDropBadge: '財貨補給',
    ticketTitle: 'プライム召喚チケット10枚',
    ticketDesc: '最上位戦術ユニット招集用の正規指揮チケット',
    accessBadge: '戦術認可',
    sovereignTitle: 'SH-101 ソヴリン 24時間',
    sovereignDesc: '戦闘力9,850の機動戦術指揮デッキを24時間完全開放',
    persistenceNotice: 'ローカル戦術ストレージへ安全に同期完了。着任を歓迎します、司令官。',
    claimBtn: '報酬を受け取り指揮デッキへ入場',
    systemFooter: 'システム // SNSHERO REVOLUTION 戦術FTUE V1',
  },
  'zh-CN': {
    headerProtocol: '战术超载 // 协议 01',
    skipProtocol: '跳过协议',
    classifiedDrop: '绝密 // SSR补给',
    locked: '锁定',
    bit4096: '4096位',
    containerDetected: '检测到加密战术容器',
    packTitle: '战术SSR补给包',
    packDesc: '指挥官首次授权已确认。高优先级轨道战术补给箱等待解锁。',
    specClassLabel: '舰级',
    specClassVal: '无畏舰',
    specPwrLabel: '预估战力',
    specClearanceLabel: '安全权限',
    specClearanceVal: 'T1级 SSR',
    unsealBtn: '开启SSR战术补给包',
    unsealComplete: '开启完毕 // 获得SSR战术单位',
    unitRarity: 'SSR // 无畏舰',
    unitName: 'SH-101 // 君王 (SOVEREIGN)',
    combatPwrLabel: '战斗力 (PWR)',
    tacticalCoreStatus: '战术核心: 已装配',
    synergyStatus: '协同共鸣: 超载',
    weaponDesc: '配备量子充能轨道重炮阵列',
    urgentAlert: '【紧急】检测到敌对泰坦信号接近。请立即部署迎击。',
    deployBtn: '部署单位并展开拦截',
    climaxHeader: '泰坦决战 // 巅峰对决',
    timeLimitPrefix: '时限: ',
    hostileBoss: '敌对目标: 顶点歌利亚 // MK-IV',
    bossClass: '类别: 泰坦腐蚀者',
    bossArmor: '装甲: 重型要塞装甲',
    alliedCore: 'SH-101 // 超载战术核心',
    readyLabel: '就绪',
    condenserStatus: '量子冷凝器: 满载输出',
    strikeReady: '致命打击已就绪',
    criticalDmg: '暴击打击 // 999,999伤害',
    criticalResult: '目标结构彻底摧毁。确认胜利。',
    engageBtn: '启动战术超载',
    engagingBtn: '超载激活中',
    victoryConfirmed: '超载战役胜利确认',
    rewardTitle: '战术作战奖励核准',
    rewardDesc: '战斗评级达到SSS级。战术奖励已发放至指挥官账户。',
    currencyDropBadge: '物资补给',
    ticketTitle: '10张高级召唤券',
    ticketDesc: '招募顶尖战术单位的特许凭据',
    accessBadge: '战术权限',
    sovereignTitle: 'SH-101 君王 24小时权限',
    sovereignDesc: '战力9,850机动战术指挥甲板24小时全面开放',
    persistenceNotice: '数据已安全同步至本地战术存储。欢迎登舰，指挥官。',
    claimBtn: '领取奖励并进入指挥甲板',
    systemFooter: '系统 // SNSHERO REVOLUTION 战术FTUE V1',
  },
  'zh-TW': {
    headerProtocol: '戰術超載 // 協定 01',
    skipProtocol: '略過協定',
    classifiedDrop: '絕密 // SSR補給',
    locked: '鎖定',
    bit4096: '4096位元',
    containerDetected: '偵測到加密戰術容器',
    packTitle: '戰術SSR補給包',
    packDesc: '指揮官首次授權已確認。高優先級軌道戰術補給箱等待解鎖。',
    specClassLabel: '艦級',
    specClassVal: '無畏艦',
    specPwrLabel: '預估戰力',
    specClearanceLabel: '安全權限',
    specClearanceVal: 'T1級 SSR',
    unsealBtn: '開啟SSR戰術補給包',
    unsealComplete: '開啟完畢 // 獲得SSR戰術單位',
    unitRarity: 'SSR // 無畏艦',
    unitName: 'SH-101 // 君王 (SOVEREIGN)',
    combatPwrLabel: '戰鬥力 (PWR)',
    tacticalCoreStatus: '戰術核心: 已裝配',
    synergyStatus: '協同共鳴: 超載',
    weaponDesc: '配備量子充能軌道重砲陣列',
    urgentAlert: '【緊急】偵測到敵對泰坦信號接近。請立即部署迎擊。',
    deployBtn: '部署單位並展開攔截',
    climaxHeader: '泰坦決戰 // 巔峰對決',
    timeLimitPrefix: '時限: ',
    hostileBoss: '敵對目標: 頂點歌利亞 // MK-IV',
    bossClass: '類別: 泰坦腐蝕者',
    bossArmor: '裝甲: 重型要塞裝甲',
    alliedCore: 'SH-101 // 超載戰術核心',
    readyLabel: '就緒',
    condenserStatus: '量子冷凝器: 滿載輸出',
    strikeReady: '致命打擊已就緒',
    criticalDmg: '暴擊打擊 // 999,999傷害',
    criticalResult: '目標結構徹底摧毀。確認勝利。',
    engageBtn: '啟動戰術超載',
    engagingBtn: '超載激活中',
    victoryConfirmed: '超載戰役勝利確認',
    rewardTitle: '戰術作戰獎勵核准',
    rewardDesc: '戰鬥評級達到SSS級。戰術獎勵已發放至指揮官帳戶。',
    currencyDropBadge: '物資補給',
    ticketTitle: '10張高級召喚券',
    ticketDesc: '招募頂尖戰術單位的特許憑據',
    accessBadge: '戰術權限',
    sovereignTitle: 'SH-101 君王 24小時權限',
    sovereignDesc: '戰力9,850機動戰術指揮甲板24小時全面開放',
    persistenceNotice: '數據已安全同步至本地戰術儲存。歡迎登艦，指揮官。',
    claimBtn: '領取獎勵並進入指揮甲板',
    systemFooter: '系統 // SNSHERO REVOLUTION 戰術FTUE V1',
  },
  es: {
    headerProtocol: 'SOBRECARGA TACTICA // PROTOCOLO 01',
    skipProtocol: 'Omitir Protocolo',
    classifiedDrop: 'CLASIFICADO // SUMINISTRO SSR',
    locked: 'BLOQUEADO',
    bit4096: '4096-BIT',
    containerDetected: 'CONTENEDOR TACTICO CIFRADO DETECTADO',
    packTitle: 'PAQUETE TACTICO SSR',
    packDesc: 'Autorizacion inicial verificada. Contenedor orbital prioritario listo para desbloquear.',
    specClassLabel: 'CLASE',
    specClassVal: 'ACORAZADO',
    specPwrLabel: 'PODER EST.',
    specClearanceLabel: 'AUTORIZACION',
    specClearanceVal: 'NIVEL-1 SSR',
    unsealBtn: 'ABRIR PAQUETE TACTICO SSR',
    unsealComplete: 'APERTURA COMPLETA // UNIDAD SSR OBTENIDA',
    unitRarity: 'SSR // ACORAZADO',
    unitName: 'SH-101 // SOBERANO (SOVEREIGN)',
    combatPwrLabel: 'PODER DE COMBATE',
    tacticalCoreStatus: 'NUCLEO TACTICO: ARMADO',
    synergyStatus: 'SINERGIA: SOBRECARGA',
    weaponDesc: 'BATERIA DE CANON ORBITAL CON ACOPLAMIENTO CUANTICO',
    urgentAlert: 'URGENTE: Titan enemigo detectado. Inicie despliegue de intercepcion inmediatamente.',
    deployBtn: 'DESPLEGAR UNIDAD E INTERCEPTAR',
    climaxHeader: 'COMBATE TITANICO // CLIMAX',
    timeLimitPrefix: 'TIEMPO LIMITE: ',
    hostileBoss: 'ENEMIGO: APEX GOLIATH // MK-IV',
    bossClass: 'CLASE: TITAN CORRUPTOR',
    bossArmor: 'BLINDAJE: FORTIFICADO PESADO',
    alliedCore: 'SH-101 // NUCLEO DE SOBRECARGA',
    readyLabel: 'LISTO',
    condenserStatus: 'CONDENSADOR CUANTICO: CARGA MAXIMA',
    strikeReady: 'ATAQUE LETAL PREPARADO',
    criticalDmg: 'GOLPE CRITICO // 999,999 DANO',
    criticalResult: 'OBJETIVO DESTRUIDO. VICTORIA CONFIRMADA.',
    engageBtn: 'ACTIVAR SOBRECARGA TACTICA',
    engagingBtn: 'SOBRECARGA ACTIVADA',
    victoryConfirmed: 'VICTORIA TACTICA CONFIRMADA',
    rewardTitle: 'AUTORIZACION DE RECOMPENSAS TACTICAS',
    rewardDesc: 'Rendimiento calificado con rango SSS. Recompensas acreditadas a su cuenta de comando.',
    currencyDropBadge: 'SUMINISTRO',
    ticketTitle: '10x TICKETS DE INVOCACION PRIME',
    ticketDesc: 'Tickets de despliegue regular para unidades tacticas de elite.',
    accessBadge: 'ACCESO TACTICO',
    sovereignTitle: 'SH-101 SOBERANO 24H',
    sovereignDesc: 'Acceso total de mando con 9,850 PWR durante 24 horas.',
    persistenceNotice: 'Datos sincronizados con almacenamiento tactico local. Bienvenido, Comandante.',
    claimBtn: 'RECLAMAR Y ENTRAR AL CENTRO DE MANDO',
    systemFooter: 'SISTEMA // SNSHERO REVOLUTION TACTICO FTUE V1',
  },
  fr: {
    headerProtocol: 'SURCHARGE TACTIQUE // PROTOCOLE 01',
    skipProtocol: 'Passer le protocole',
    classifiedDrop: 'CONFIDENTIEL // RAVITAILLEMENT SSR',
    locked: 'VERROUILLE',
    bit4096: '4096-BIT',
    containerDetected: 'CONTENEUR TACTIQUE CHIFFRE DETECTE',
    packTitle: 'PACK TACTIQUE SSR',
    packDesc: 'Autorisation initiale verifiee. Conteneur orbital prioritaire en attente d ouverture.',
    specClassLabel: 'CLASSE',
    specClassVal: 'CUIRASSE',
    specPwrLabel: 'PUISSANCE EST.',
    specClearanceLabel: 'HABILITATION',
    specClearanceVal: 'RANG-1 SSR',
    unsealBtn: 'OUVRIR LE PACK TACTIQUE SSR',
    unsealComplete: 'OUVERTURE REUSSIE // UNITE SSR ACQUISE',
    unitRarity: 'SSR // CUIRASSE',
    unitName: 'SH-101 // SOUVERAIN (SOVEREIGN)',
    combatPwrLabel: 'PUISSANCE DE COMBAT',
    tacticalCoreStatus: 'NOYAU TACTIQUE: ARME',
    synergyStatus: 'SYNERGIE: SURCHARGE',
    weaponDesc: 'CANON ORBITAL A COUPLAGE QUANTIQUE OPERATIONNEL',
    urgentAlert: 'URGENT: Titan hostile detecte. Deploiement immediat requis.',
    deployBtn: 'DEPLOYER L UNITE ET INTERCEPTER',
    climaxHeader: 'COMBAT CONTRE LE TITAN // CLIMAX',
    timeLimitPrefix: 'TEMPS LIMITE: ',
    hostileBoss: 'HOSTILE: APEX GOLIATH // MK-IV',
    bossClass: 'CLASSE: TITAN CORRUPTEUR',
    bossArmor: 'BLINDAGE: LOURD FORTIFIE',
    alliedCore: 'SH-101 // NOYAU DE SURCHARGE',
    readyLabel: 'PRET',
    condenserStatus: 'CONDENSATEUR QUANTIQUE: CHARGE MAX',
    strikeReady: 'FRAPPE LETALE PRETE',
    criticalDmg: 'FRAPPE CRITIQUE // 999,999 DEGATS',
    criticalResult: 'CIBLE DETRUITE. VICTOIRE CONFIRMEE.',
    engageBtn: 'ENCLENCHER LA SURCHARGE TACTIQUE',
    engagingBtn: 'SURCHARGE EN COURS',
    victoryConfirmed: 'VICTOIRE TACTIQUE CONFIRMEE',
    rewardTitle: 'HOMOLOGATION DES RECOMPENSES TACTIQUES',
    rewardDesc: 'Performance de combat rang SSS. Recompenses creditees sur votre compte de commandement.',
    currencyDropBadge: 'RESSOURCES',
    ticketTitle: '10x TICKETS D INVOCATION PRIME',
    ticketDesc: 'Tickets de deploiement standard pour unites d elite.',
    accessBadge: 'ACCES TACTIQUE',
    sovereignTitle: 'SH-101 SOUVERAIN 24H',
    sovereignDesc: 'Acces complet avec puissance de 9,850 pendant 24 heures.',
    persistenceNotice: 'Donnees synchronisees dans le stockage tactique local. Bienvenue a bord, Commandant.',
    claimBtn: 'RECUPERER ET ACCEDER AU COMMANDEMENT',
    systemFooter: 'SYSTEME // SNSHERO REVOLUTION TACTIQUE FTUE V1',
  },
  de: {
    headerProtocol: 'TAKTIK-OVERDRIVE // PROTOKOLL 01',
    skipProtocol: 'Protokoll uberspringen',
    classifiedDrop: 'STRENG GEHEIM // SSR-VERSORGUNG',
    locked: 'GESPERRT',
    bit4096: '4096-BIT',
    containerDetected: 'VERSCHLUSSELTER TAKTIK-CONTAINER ERKANNT',
    packTitle: 'TAKTIK-SSR-VERSORGUNGSPACK',
    packDesc: 'Erstautorisierung bestatigt. Prioritater Orbital-Container wartet auf Entsiegelung.',
    specClassLabel: 'KLASSE',
    specClassVal: 'SCHLACHTSCHIFF',
    specPwrLabel: 'GESCH. KAMPFKRAFT',
    specClearanceLabel: 'FREIGABE',
    specClearanceVal: 'STUFE-1 SSR',
    unsealBtn: 'SSR-TAKTIK-PACK ENTSIEGELN',
    unsealComplete: 'ENTSIEGELUNG ABGESCHLOSSEN // SSR-EINHEIT ERHALTEN',
    unitRarity: 'SSR // SCHLACHTSCHIFF',
    unitName: 'SH-101 // SOUVERAN (SOVEREIGN)',
    combatPwrLabel: 'KAMPFKRAFT (PWR)',
    tacticalCoreStatus: 'TAKTIKKERN: SCHARF',
    synergyStatus: 'SYNERGIE: OVERDRIVE',
    weaponDesc: 'ORBITAL-GESCHUTZARRAY MIT QUANTENKOPPLUNG',
    urgentAlert: 'DRINGEND: Feindliche Titan-Signatur nahert sich. Sofort abfangen.',
    deployBtn: 'EINHEIT VERLEGEN & ABFANGEN',
    climaxHeader: 'TITAN-GEFECHT // HOHEPUNKT',
    timeLimitPrefix: 'ZEITLIMIT: ',
    hostileBoss: 'FEIND: APEX GOLIATH // MK-IV',
    bossClass: 'KLASSE: TITAN-VERDERBER',
    bossArmor: 'PANZERUNG: SCHWER BEFESTIGT',
    alliedCore: 'SH-101 // OVERDRIVE-KERN',
    readyLabel: 'BEREIT',
    condenserStatus: 'QUANTENKONDENSATOR: MAXIMALE LADUNG',
    strikeReady: 'TODLICHER SCHLAG BEREIT',
    criticalDmg: 'KRITISCHER TREFFER // 999,999 SCHADEN',
    criticalResult: 'ZIELZERSTORUNG BESTATIGT. VOLLSTANDIGER SIEG.',
    engageBtn: 'TAKTIK-OVERDRIVE AKTIVIEREN',
    engagingBtn: 'OVERDRIVE AKTIVIERT',
    victoryConfirmed: 'EINSATZSIEG BESTATIGT',
    rewardTitle: 'AUTORISIERUNG DER BELOHNUNGEN',
    rewardDesc: 'Kampfleistung mit Rang SSS bewertet. Belohnungen dem Kommandokonto gutgeschrieben.',
    currencyDropBadge: 'RESSOURCEN',
    ticketTitle: '10x PRIME-BESCHWORUNGSTICKETS',
    ticketDesc: 'Standard-Tickets fur Elite-Einheiten.',
    accessBadge: 'TAKTIKZUGANG',
    sovereignTitle: 'SH-101 SOUVERAN 24H',
    sovereignDesc: 'Voller Kommandodeck-Zugang mit 9,850 PWR fur 24 Stunden.',
    persistenceNotice: 'Daten synchronisiert mit lokalem Taktikspeicher. Willkommen an Bord, Kommandant.',
    claimBtn: 'EINLOSEN & ZUM KOMMANDODECK',
    systemFooter: 'SYSTEM // SNSHERO REVOLUTION TAKTIK-FTUE V1',
  },
  vi: {
    headerProtocol: 'QUA TAI CHIEN THUAT // GIAO THUC 01',
    skipProtocol: 'Bo qua giao thuc',
    classifiedDrop: 'TU MAT // TIEP TE SSR',
    locked: 'KHOA',
    bit4096: '4096-BIT',
    containerDetected: 'PHAT HIEN THUNG CHIEN THUAT MA HOA',
    packTitle: 'GOI TIEP TE CHIEN THUAT SSR',
    packDesc: 'Xac thuc chi huy lan dau thanh cong. Thung tiep te quy dao dang cho mo khoa.',
    specClassLabel: 'LOP',
    specClassVal: 'THIET GIAP HAM',
    specPwrLabel: 'LUC CHIEN UOC TINH',
    specClearanceLabel: 'CAP PHEP',
    specClearanceVal: 'CAP-1 SSR',
    unsealBtn: 'MO KHOA GOI CHIEN THUAT SSR',
    unsealComplete: 'MO KHOA THANH CONG // NHAN DON VI SSR',
    unitRarity: 'SSR // THIET GIAP HAM',
    unitName: 'SH-101 // SOVEREIGN',
    combatPwrLabel: 'LUC CHIEN',
    tacticalCoreStatus: 'LOI CHIEN THUAT: SAN SANG',
    synergyStatus: 'DONG KET: QUA TAI',
    weaponDesc: 'PHAO QUY DAO LIEN KET LUONG TU HOAN CHINH',
    urgentAlert: 'KHAN CAP: Tin hieu Titan dich dang tien den. Trien khai danh chan ngay.',
    deployBtn: 'TRIEN KHAI & DANH CHAN',
    climaxHeader: 'QUYET CHIEN TITAN // CAO TRAO',
    timeLimitPrefix: 'GIOI HAN GIO: ',
    hostileBoss: 'MUC TIEU DICH: APEX GOLIATH // MK-IV',
    bossClass: 'PHAN LOAI: TITAN HU HOAI',
    bossArmor: 'GIAP: KIEN CO HANG NANG',
    alliedCore: 'SH-101 // LOI QUA TAI',
    readyLabel: 'SAN SANG',
    condenserStatus: 'NGUNG TU LUONG TU: MAX NANG LUONG',
    strikeReady: 'DON CHI TU SAN SANG',
    criticalDmg: 'DON CHI MANG // 999,999 SAT THUONG',
    criticalResult: 'MUC TIEU BI TIEU DIET. XAC NHAN CHIEN THANG.',
    engageBtn: 'KICH HOAT QUA TAI CHIEN THUAT',
    engagingBtn: 'DANG KICH HOAT',
    victoryConfirmed: 'XAC NHAN CHIEN THANG',
    rewardTitle: 'PHE DUYET PHAN THUONG CHIEN DICH',
    rewardDesc: 'Danh gia chien dau hang SSS. Phan thuong da duoc gui vao tai khoan chi huy.',
    currencyDropBadge: 'TIEP TE',
    ticketTitle: '10x VE TRIEU HOI PRIME',
    ticketDesc: 'Ve trieu hoi chinh quy danh cho cac don vi cap cao.',
    accessBadge: 'QUYEN TRUY CAP',
    sovereignTitle: 'SH-101 SOVEREIGN 24H',
    sovereignDesc: 'Quyen dieu hanh ham doi voi 9,850 PWR trong 24 gio.',
    persistenceNotice: 'Du lieu da duoc luu an toan vao bo nho cuc bo. Chao mung Chi huy.',
    claimBtn: 'NHAN THUONG & VAO BO CHI HUY',
    systemFooter: 'HE THONG // SNSHERO REVOLUTION FTUE V1',
  },
  th: {
    headerProtocol: 'ยุทธวิธีโอเวอร์ไดรฟ์ // โพรโทคอล 01',
    skipProtocol: 'ข้ามโพรโทคอล',
    classifiedDrop: 'ชั้นความลับสูงสุด // เสบียง SSR',
    locked: 'ล็อก',
    bit4096: '4096-บิต',
    containerDetected: 'ตรวจพบคอนเทนเนอร์ยุทธวิธีเข้ารหัส',
    packTitle: 'แพ็กเกจเสบียงยุทธวิธี SSR',
    packDesc: 'ยืนยันการอนุญาตผู้บัญชาการครั้งแรกสำเร็จ คอนเทนเนอร์วงโคจรพร้อมปลดล็อก',
    specClassLabel: 'คลาส',
    specClassVal: 'เดรดนอต',
    specPwrLabel: 'พลังรบประมาณ',
    specClearanceLabel: 'ระดับการอนุญาต',
    specClearanceVal: 'ระดับ 1 SSR',
    unsealBtn: 'เปิดแพ็กเกจเสบียงยุทธวิธี SSR',
    unsealComplete: 'ปลดผนึกสำเร็จ // ได้รับยูนิต SSR',
    unitRarity: 'SSR // เดรดนอต',
    unitName: 'SH-101 // SOVEREIGN',
    combatPwrLabel: 'พลังรบ (PWR)',
    tacticalCoreStatus: 'แกนยุทธวิธี: พร้อมรบ',
    synergyStatus: 'การทำงานร่วม: โอเวอร์ไดรฟ์',
    weaponDesc: 'ระบบปืนใหญ่วงโคจรควอนตัมพร้อมทำงาน',
    urgentAlert: 'ด่วน: สัญญาณไททันศัตรูกำลังประชิด ส่งกำลังเข้าสกัดกั้นทันที',
    deployBtn: 'ส่งยูนิตเข้าสกัดกั้น',
    climaxHeader: 'ศึกตัดสินไททัน // ไคลแมกซ์',
    timeLimitPrefix: 'เวลาจำกัด: ',
    hostileBoss: 'เป้าหมายศัตรู: APEX GOLIATH // MK-IV',
    bossClass: 'ประเภท: ไททันผู้ทำลายล้าง',
    bossArmor: 'เกราะ: ป้อมปราการหุ้มเกราะหนัก',
    alliedCore: 'SH-101 // แกนโอเวอร์ไดรฟ์',
    readyLabel: 'พร้อมแล้ว',
    condenserStatus: 'ควอนตัมคอนเดนเซอร์: กำลังสูงสุด',
    strikeReady: 'การโจมตีสังหารพร้อมใช้งาน',
    criticalDmg: 'คริติคอลสไตรก์ // 999,999 ความเสียหาย',
    criticalResult: 'ทำลายโครงสร้างเป้าหมายสำเร็จ ยืนยันชัยชนะ',
    engageBtn: 'เปิดใช้งานยุทธวิธีโอเวอร์ไดรฟ์',
    engagingBtn: 'กำลังใช้งาน',
    victoryConfirmed: 'ยืนยันชัยชนะในภารกิจ',
    rewardTitle: 'อนุมัติรางวัลยุทธวิธี',
    rewardDesc: 'ประเมินการรบระดับ SSS บันทึกรางวัลเข้าสู่บัญชีผู้บัญชาการเรียบร้อยแล้ว',
    currencyDropBadge: 'เสบียงทรัพยากร',
    ticketTitle: 'ตั๋วอัญเชิญไพรม์ 10 ใบ',
    ticketDesc: 'ตั๋วคำสั่งการอัญเชิญยูนิตระดับสูง',
    accessBadge: 'สิทธิ์ทางยุทธวิธี',
    sovereignTitle: 'SH-101 SOVEREIGN 24 ชม.',
    sovereignDesc: 'เปิดใช้งานบัญชาการรบเต็มรูปแบบพลัง 9,850 ตลอด 24 ชั่วโมง',
    persistenceNotice: 'ซิงค์ข้อมูลลงในพื้นที่จัดเก็บในเครื่องอย่างปลอดภัย ยินดีต้อนรับสู่ยาน ผู้บัญชาการ',
    claimBtn: 'รับรางวัลและเข้าสู่สะพานเดินเรือ',
    systemFooter: 'ระบบ // SNSHERO REVOLUTION FTUE V1',
  },
  id: {
    headerProtocol: 'OVERDRIVE TAKTIS // PROTOKOL 01',
    skipProtocol: 'Lewati Protokol',
    classifiedDrop: 'RAHASIA NEGARA // PASOKAN SSR',
    locked: 'TERKUNCI',
    bit4096: '4096-BIT',
    containerDetected: 'KONTAINER TAKTIS TERENKRIPSI TERDETEKSI',
    packTitle: 'PAKET PASOKAN TAKTIS SSR',
    packDesc: 'Otorisasi komandan pertama terverifikasi. Kontainer orbital prioritas siap dibuka.',
    specClassLabel: 'KELAS',
    specClassVal: 'KAPAL PERANG DREADNOUGHT',
    specPwrLabel: 'EST. KEKUATAN',
    specClearanceLabel: 'IZIN KEAMANAN',
    specClearanceVal: 'TINGKAT-1 SSR',
    unsealBtn: 'BUKA PAKET TAKTIS SSR',
    unsealComplete: 'PEMBUKAAN SELESAI // UNIT SSR DIPEROLEH',
    unitRarity: 'SSR // DREADNOUGHT',
    unitName: 'SH-101 // SOVEREIGN',
    combatPwrLabel: 'DAYA TEMPUR',
    tacticalCoreStatus: 'INTI TAKTIS: SIAP',
    synergyStatus: 'SINERGI: OVERDRIVE',
    weaponDesc: 'MERIAM ORBITAL KOPLING KUANTUM SIAP TEMBAK',
    urgentAlert: 'MENDESAK: Sinyal Titan musuh mendekat. Luncurkan pencegatan sekarang.',
    deployBtn: 'KERAHKAN UNIT & CEGAT MUSUH',
    climaxHeader: 'PERTEMPURAN TITAN // KLIMAKS',
    timeLimitPrefix: 'BATAS WAKTU: ',
    hostileBoss: 'MUSUH: APEX GOLIATH // MK-IV',
    bossClass: 'KELAS: TITAN PERUSAK',
    bossArmor: 'ZIRAH: BENTENG BERAT',
    alliedCore: 'SH-101 // INTI OVERDRIVE',
    readyLabel: 'SIAP',
    condenserStatus: 'KONDENSOR KUANTUM: DAYA MAKSIMAL',
    strikeReady: 'SERANGAN MEMATIKAN SIAP',
    criticalDmg: 'SERANGAN KRITIS // 999,999 KERUSAKAN',
    criticalResult: 'SASARAN HANCUR. KEMENANGAN TERKONFIRMASI.',
    engageBtn: 'AKTIFKAN OVERDRIVE TAKTIS',
    engagingBtn: 'OVERDRIVE DIAKTIFKAN',
    victoryConfirmed: 'KEMENANGAN TAKTIS DIKONFIRMASI',
    rewardTitle: 'OTORISASI HADIAH TAKTIS',
    rewardDesc: 'Performa pertempuran dinilai SSS. Hadiah didaftarkan ke akun komando Anda.',
    currencyDropBadge: 'PASOKAN MATA UANG',
    ticketTitle: '10x TIKET PEMANGGILAN PRIME',
    ticketDesc: 'Tiket pengerahan standar untuk unit elit.',
    accessBadge: 'AKSES TAKTIS',
    sovereignTitle: 'SH-101 SOVEREIGN 24 JAM',
    sovereignDesc: 'Akses penuh dek komando dengan kekuatan 9,850 selama 24 jam.',
    persistenceNotice: 'Data tersinkronisasi aman ke penyimpanan lokal. Selamat bergabung, Komandan.',
    claimBtn: 'KLAIM & MASUK DEK KOMANDO',
    systemFooter: 'SISTEM // SNSHERO REVOLUTION TAKTIS FTUE V1',
  },
  ru: {
    headerProtocol: 'ТАКТИЧЕСКИЙ ОВЕРДРАЙВ // ПРОТОКОЛ 01',
    skipProtocol: 'Пропустить протокол',
    classifiedDrop: 'СОВЕРШЕННО СЕКРЕТНО // SSR СНАБЖЕНИЕ',
    locked: 'ЗАБЛОКИРОВАНО',
    bit4096: '4096-БИТ',
    containerDetected: 'ОБНАРУЖЕН ЗАШИФРОВАННЫЙ ТАКТИЧЕСКИЙ КОНТЕЙНЕР',
    packTitle: 'ТАКТИЧЕСКИЙ SSR НАБОР СНАБЖЕНИЯ',
    packDesc: 'Первичная авторизация командира подтверждена. Орбитальный контейнер ожидает вскрытия.',
    specClassLabel: 'КЛАСС',
    specClassVal: 'ДРЕДНОУТ',
    specPwrLabel: 'ОЦЕНКА БОЕВОЙ МОЩИ',
    specClearanceLabel: 'ДОПУСК',
    specClearanceVal: 'РАНГ-1 SSR',
    unsealBtn: 'ОТКРЫТЬ ТАКТИЧЕСКИЙ SSR НАБОР',
    unsealComplete: 'ВСКРЫТИЕ ЗАВЕРШЕНО // ПОЛУЧЕН SSR ЮНИТ',
    unitRarity: 'SSR // ДРЕДНОУТ',
    unitName: 'SH-101 // SOVEREIGN',
    combatPwrLabel: 'БОЕВАЯ МОЩЬ (PWR)',
    tacticalCoreStatus: 'ТАКТИЧЕСКОЕ ЯДРО: АКТИВИРОВАНО',
    synergyStatus: 'СИНЕРГИЯ: ОВЕРДРАЙВ',
    weaponDesc: 'ОРБИТАЛЬНЫЙ АРТИЛЛЕРИЙСКИЙ МАССИВ С КВАНТОВЫМ ЗАРЯДОМ',
    urgentAlert: 'СРОЧНО: Приближается вражеский Титан. Немедленно начать перехват.',
    deployBtn: 'РАЗВЕРНУТЬ ЮНИТ И НАЧАТЬ ПЕРЕХВАТ',
    climaxHeader: 'БИТВА С ТИТАНОМ // КУЛЬМИНАЦИЯ',
    timeLimitPrefix: 'ВРЕМЯ: ',
    hostileBoss: 'ЦЕЛЬ: APEX GOLIATH // MK-IV',
    bossClass: 'КЛАСС: ТИТАН-РАЗРУШИТЕЛЬ',
    bossArmor: 'БРОНЯ: ТЯЖЕЛЫЙ УКРЕПЛЕННЫЙ БАСТИОН',
    alliedCore: 'SH-101 // ЯДРО ОВЕРДРАЙВА',
    readyLabel: 'ГОТОВ',
    condenserStatus: 'КВАНТОВЫЙ КОНДЕНСАТОР: МАКСИМАЛЬНЫЙ ЗАРЯД',
    strikeReady: 'СМЕРТОНОСНЫЙ УДАР ГОТОВ',
    criticalDmg: 'КРИТИЧЕСКИЙ УДАР // 999,999 УРОНА',
    criticalResult: 'СТРУКТУРА ЦЕЛИ УНИЧТОЖЕНА. ПОБЕДА ПОДТВЕРЖДЕНА.',
    engageBtn: 'АКТИВИРОВАТЬ ТАКТИЧЕСКИЙ ОВЕРДРАЙВ',
    engagingBtn: 'АКТИВАЦИЯ ОВЕРДРАЙВА',
    victoryConfirmed: 'ПОБЕДА В ОПЕРАЦИИ ПОДТВЕРЖДЕНА',
    rewardTitle: 'АВТОРИЗАЦИЯ НАГРАД ЗА ОПЕРАЦИЮ',
    rewardDesc: 'Оценка боя: SSS. Награды начислены на ваш командирский аккаунт.',
    currencyDropBadge: 'РЕСУРСЫ',
    ticketTitle: '10x ПРАЙМ БИЛЕТОВ ПРИЗЫВА',
    ticketDesc: 'Регулярные билеты призыва элитных тактических юнитов.',
    accessBadge: 'ТАКТИЧЕСКИЙ ДОСТУП',
    sovereignTitle: 'SH-101 SOVEREIGN 24 ЧАСА',
    sovereignDesc: 'Полный доступ к боевой палубе с мощью 9,850 на 24 часа.',
    persistenceNotice: 'Данные надежно синхронизированы с локальным хранилищем. Добро пожаловать, Командир.',
    claimBtn: 'ПОЛУЧИТЬ НАГРАДЫ И ВОЙТИ НА ПАЛУБУ',
    systemFooter: 'СИСТЕМА // SNSHERO REVOLUTION ТАКТИЧЕСКИЙ FTUE V1',
  },
};

// Fallback resolver
const getTranslation = (langCode?: string): OverdriveTranslation => {
  if (!langCode) return TRANSLATIONS.ko;
  if (TRANSLATIONS[langCode]) return TRANSLATIONS[langCode];
  if (langCode === 'gb' || langCode === 'en-GB') return TRANSLATIONS.en;
  const prefix = langCode.split('-')[0];
  if (TRANSLATIONS[prefix]) return TRANSLATIONS[prefix];
  return TRANSLATIONS.ko; // Default to Korean for domestic first-visit compliance
};

// Pure inline SVG icons strictly adhering to strokeWidth="1.75" and Zero-Emoji rule
const TacticalCoreIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const TargetCrosshairIcon = ({ className = 'w-5 h-5 text-rose-500' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ShieldIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const VectorArrowIcon = ({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const SupplyPackIcon = ({ className = 'w-5 h-5 text-indigo-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const ImpactBoltIcon = ({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const CloseIcon = ({ className = 'w-5 h-5 text-slate-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RefreshIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

// Safe haptic vibration wrapper
const triggerHaptic = (pattern: number | number[]) => {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
};

export interface SsrOverdriveUnit {
  id: string;
  name: string;
  rarity: string;
  power: number;
  weaponDesc: string;
}

export const SSR_REQUISITION_POOL: SsrOverdriveUnit[] = [
  {
    id: 'SH-101',
    name: 'SH-101 // 소버린 (SOVEREIGN)',
    rarity: 'SSR // 드레드노트',
    power: 9850,
    weaponDesc: '양자 충전 결합 궤도 함포 포격 시스템 완비',
  },
  {
    id: 'SH-102',
    name: 'SH-102 // 아발란체 (AVALANCHE)',
    rarity: 'SSR // 크루저',
    power: 9920,
    weaponDesc: '초전도 입자 빔 개틀링 및 절대 영도 방벽 탑재',
  },
  {
    id: 'SH-103',
    name: 'SH-103 // 크로노스 (CHRONOS)',
    rarity: 'SSR // 뱅가드',
    power: 9880,
    weaponDesc: '시공간 위상 왜곡 타키온 블레이드 장착',
  },
];

// Safe gtag dispatcher
const triggerFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined') {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      try {
        gtag('event', eventName, params);
      } catch {
        // Safe failover
      }
    }
  }
};

export const FirstVisitOverdriveModal: React.FC<FirstVisitOverdriveModalProps> = ({
  isOpen,
  onClose,
  onEnterDeck,
  language: propLanguage,
}) => {
  let contextLang: Language = 'ko';
  try {
    const settings = useGameSettings();
    if (settings && settings.language) {
      contextLang = settings.language;
    }
  } catch {
    // Context failover
  }

  const effectiveLang = propLanguage || contextLang || 'ko';
  const txt = getTranslation(effectiveLang);

  const [stage, setStage] = useState<ModalStage>('PACK_READY');
  const [bossHpPercent, setBossHpPercent] = useState<number>(100);
  const [overdriveEnergy] = useState<number>(100);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(15000);
  const [isCriticalFlashing, setIsCriticalFlashing] = useState<boolean>(false);
  const [currentUnitIndex, setCurrentUnitIndex] = useState<number>(0);
  const [rerollsLeft, setRerollsLeft] = useState<number>(1);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('PACK_READY');
      setBossHpPercent(100);
      setTimeLeftMs(15000);
      setIsCriticalFlashing(false);
      setCurrentUnitIndex(0);
      setRerollsLeft(1);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Handle countdown during OVERDRIVE_CLIMAX
  useEffect(() => {
    if (stage === 'OVERDRIVE_CLIMAX') {
      const startTime = Date.now();
      const initialRemaining = 15000;

      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, initialRemaining - elapsed);
        setTimeLeftMs(remaining);

        if (remaining <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }, 50);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [stage]);

  if (!isOpen) return null;

  // Stage 1 Action: Unseal Pack
  const handleUnsealPack = () => {
    triggerHaptic([60, 40, 80]);
    triggerFunnelEvent('ftue_pack_open', {
      source: 'tactical_first_visit',
      unit_id: SSR_REQUISITION_POOL[currentUnitIndex].id,
    });
    setStage('CARD_REVEALED');
  };

  // Stage 1 Reroll Action: 1-time Tactical Reroll
  const handleRerollUnit = () => {
    if (rerollsLeft <= 0) return;
    triggerHaptic([40, 50]);
    const nextIdx = (currentUnitIndex + 1) % SSR_REQUISITION_POOL.length;
    setCurrentUnitIndex(nextIdx);
    setRerollsLeft(0);
    triggerFunnelEvent('ftue_unit_reroll', {
      new_unit_id: SSR_REQUISITION_POOL[nextIdx].id,
    });
  };

  // Stage 1 Transition to Boss Battle
  const handleProceedToClimax = () => {
    triggerHaptic([30, 30]);
    setStage('OVERDRIVE_CLIMAX');
  };

  // Stage 2 Action: Engage Tactical Overdrive
  const handleEngageOverdrive = () => {
    if (stage !== 'OVERDRIVE_CLIMAX') return;

    triggerHaptic([80, 50, 120]);
    triggerFunnelEvent('ftue_overdrive_engage', {
      unit: SSR_REQUISITION_POOL[currentUnitIndex].name,
      boss: 'APEX GOLIATH // MK-IV',
      damage: 999999,
    });

    setStage('OVERDRIVE_IMPACT');
    setIsCriticalFlashing(true);

    // Animate Boss HP down to 0%
    setTimeout(() => {
      setBossHpPercent(0);
    }, 150);

    // Transition to Stage 3 (REWARD_CLAIM) after impact sequence
    setTimeout(() => {
      setIsCriticalFlashing(false);
      setStage('REWARD_CLAIM');
    }, 1400);
  };

  // Stage 3 Action: Claim Rewards & Enter Deck
  const handleClaimAndEnterDeck = () => {
    triggerFunnelEvent('ftue_reward_claim', {
      tickets: 10,
      unit_access: 'SH-101_SOVEREIGN_24H',
      status: 'success',
    });

    // Store completed state in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('snshero_ftue_overdrive_v1', new Date().toISOString());

        // Grant 10 prime summon tickets in persistent storage
        const currentTickets = parseInt(localStorage.getItem('hero_prime_summon_tickets') || '0', 10);
        localStorage.setItem('hero_prime_summon_tickets', (currentTickets + 10).toString());

        // Grant 24H Sovereign command access expiry
        const accessExpiry = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('hero_sh101_sovereign_access_until', accessExpiry.toString());
      } catch {
        // Storage fail-safe
      }
    }

    onEnterDeck();
    onClose();
  };

  const handleSkip = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('snshero_ftue_overdrive_v1', 'skipped');
      } catch {
        // Storage fail-safe
      }
    }
    onClose();
  };

  const secondsDisplay = (timeLeftMs / 1000).toFixed(2);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tactical-overdrive-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 min-h-[100dvh] max-h-[100dvh] overflow-y-auto bg-black/80 backdrop-blur-md transition-all select-none"
    >
      {/* Critical Impact Fullscreen Flash Overlay */}
      {isCriticalFlashing && (
        <div className="fixed inset-0 z-60 pointer-events-none bg-rose-500/25 animate-pulse mix-blend-screen" />
      )}

      {/* Main Tactical Container */}
      <div
        className={`relative w-full max-w-lg bg-[#090d16]/95 backdrop-blur-md border border-white/15 rounded-none p-5 sm:p-6 text-white shadow-2xl transition-all duration-300 ${
          isCriticalFlashing ? 'scale-[1.02] border-rose-500/60' : ''
        }`}
      >
        {/* Top Header Row with System Identifiers & Skip Protocol */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-mono tracking-wider uppercase text-xs text-cyan-400 font-semibold">
              {txt.headerProtocol}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-sm border border-transparent hover:border-white/15"
            title={txt.skipProtocol}
            aria-label={txt.skipProtocol}
          >
            <CloseIcon className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* STAGE 1: PACK_READY */}
        {stage === 'PACK_READY' && (
          <div className="space-y-5 animate-fade-in text-center">
            {/* Visual Container */}
            <div className="relative mx-auto w-36 h-36 flex items-center justify-center border border-cyan-500/30 bg-cyan-950/20 rounded-none group">
              <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent opacity-80" />
              <div className="relative flex flex-col items-center">
                <SupplyPackIcon className="w-16 h-16 text-cyan-400" />
                <span className="mt-2 font-mono tracking-wider uppercase text-xs text-cyan-300">
                  {txt.classifiedDrop}
                </span>
              </div>
              <div className="absolute top-1 left-1 text-[9px] font-mono text-cyan-600">{txt.locked}</div>
              <div className="absolute bottom-1 right-1 text-[9px] font-mono text-cyan-600">{txt.bit4096}</div>
            </div>

            <div>
              <div className="font-mono tracking-wider uppercase text-xs text-cyan-400 mb-1">
                {txt.containerDetected}
              </div>
              <h2
                id="tactical-overdrive-title"
                className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-white"
              >
                {txt.packTitle}
              </h2>
              <p className="mt-2 text-xs font-mono text-slate-300 leading-relaxed max-w-sm mx-auto">
                {txt.packDesc}
              </p>
            </div>

            {/* Spec Matrix */}
            <div className="grid grid-cols-3 gap-2 border border-white/10 bg-black/40 p-2 text-left">
              <div>
                <div className="font-mono uppercase text-[10px] text-slate-400">{txt.specClassLabel}</div>
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-white">{txt.specClassVal}</div>
              </div>
              <div>
                <div className="font-mono uppercase text-[10px] text-slate-400">{txt.specPwrLabel}</div>
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-amber-400">9,850+</div>
              </div>
              <div>
                <div className="font-mono uppercase text-[10px] text-slate-400">{txt.specClearanceLabel}</div>
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-cyan-400">{txt.specClearanceVal}</div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUnsealPack}
              className="w-full min-h-[48px] px-6 py-3 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono tracking-wider uppercase text-sm font-bold border border-cyan-400/50 shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer"
            >
              <SupplyPackIcon className="w-5 h-5 text-white" />
              <span>{txt.unsealBtn}</span>
            </button>
          </div>
        )}

        {/* STAGE 1 (Substage): CARD_REVEALED */}
        {stage === 'CARD_REVEALED' && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="font-mono tracking-wider uppercase text-xs text-amber-400 font-semibold">
              {txt.unsealComplete}
            </div>

            {/* Unit Card Visual */}
            <div className="border border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-slate-900/60 to-black/80 p-4 text-left relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 font-mono tracking-wider uppercase text-[10px] text-amber-300 font-bold mb-1">
                    {SSR_REQUISITION_POOL[currentUnitIndex].rarity}
                  </span>
                  <h3 className="text-lg sm:text-xl font-mono font-bold text-white tracking-wide">
                    {SSR_REQUISITION_POOL[currentUnitIndex].name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-mono uppercase text-[10px] text-slate-400">{txt.combatPwrLabel}</div>
                  <div className="font-mono tracking-wider text-xl font-bold text-amber-400">
                    {SSR_REQUISITION_POOL[currentUnitIndex].power.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="my-3 py-2 px-3 bg-black/60 border border-white/10 font-mono text-xs text-slate-300 flex items-center justify-between">
                <span>{txt.tacticalCoreStatus}</span>
                <span className="text-cyan-400 font-semibold">{txt.synergyStatus}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <TacticalCoreIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{SSR_REQUISITION_POOL[currentUnitIndex].weaponDesc}</span>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {txt.urgentAlert}
            </div>

            {/* 2-Column Action Buttons: Reroll & Deploy */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                disabled={rerollsLeft <= 0}
                onClick={handleRerollUnit}
                className={`min-h-[48px] px-3 py-3 font-mono tracking-wider uppercase text-xs font-bold border rounded-sm transition-all flex items-center justify-center gap-1.5 ${
                  rerollsLeft > 0
                    ? 'bg-cyan-950/40 hover:bg-cyan-900/50 border-cyan-500/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)] cursor-pointer'
                    : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed opacity-50'
                }`}
              >
                <RefreshIcon className={`w-4 h-4 ${rerollsLeft > 0 ? 'text-cyan-400' : 'text-white/30'}`} />
                <span className="truncate">
                  {effectiveLang === 'ko' ? `전술 리롤 [${rerollsLeft}/1]` : `RE-ROLL [${rerollsLeft}/1]`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleProceedToClimax}
                className="min-h-[48px] px-3 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-mono tracking-wider uppercase text-xs font-bold border border-amber-400/50 shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-1.5 rounded-sm cursor-pointer"
              >
                <VectorArrowIcon className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">{txt.deployBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: OVERDRIVE_CLIMAX & OVERDRIVE_IMPACT */}
        {(stage === 'OVERDRIVE_CLIMAX' || stage === 'OVERDRIVE_IMPACT') && (
          <div className="space-y-4 animate-fade-in">
            {/* Climax Header & Timer */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <TargetCrosshairIcon className="w-4 h-4 text-rose-500 animate-spin" />
                <span className="font-mono tracking-wider uppercase text-xs text-rose-400 font-semibold">
                  {txt.climaxHeader}
                </span>
              </div>
              <div className="font-mono tracking-wider uppercase text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5">
                {txt.timeLimitPrefix}{secondsDisplay}s
              </div>
            </div>

            {/* Boss Threat Profile */}
            <div className="border border-rose-500/30 bg-rose-950/20 p-3 relative">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-mono tracking-wider uppercase text-xs text-rose-400 font-bold flex items-center gap-1.5">
                  <span>{txt.hostileBoss}</span>
                </div>
                <span className="font-mono uppercase text-[10px] text-slate-400">
                  {bossHpPercent}% HP
                </span>
              </div>

              {/* Boss HP Gauge */}
              <div className="w-full h-3 bg-black/60 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-500 transition-all duration-300"
                  style={{ width: `${bossHpPercent}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span>{txt.bossClass}</span>
                <span>{txt.bossArmor}</span>
              </div>
            </div>

            {/* Allied Overdrive Status */}
            <div className="border border-cyan-500/30 bg-cyan-950/20 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-mono tracking-wider uppercase text-xs text-cyan-400 font-bold flex items-center gap-1.5">
                  <TacticalCoreIcon className="w-4 h-4 text-cyan-400" />
                  <span>{txt.alliedCore}</span>
                </div>
                <span className="font-mono uppercase text-xs text-cyan-300 font-bold">
                  {overdriveEnergy}% {txt.readyLabel}
                </span>
              </div>

              {/* Allied Tactical Energy Gauge */}
              <div className="w-full h-3 bg-black/60 border border-white/10 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500 transition-all duration-300 animate-pulse"
                  style={{ width: `${overdriveEnergy}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-400">
                <span>{txt.condenserStatus}</span>
                <span className="text-cyan-400 font-semibold">{txt.strikeReady}</span>
              </div>
            </div>

            {/* Impact Banner during strike */}
            {stage === 'OVERDRIVE_IMPACT' && (
              <div className="py-2.5 px-3 bg-rose-600/30 border border-rose-500 text-center animate-bounce">
                <div className="font-mono tracking-wider uppercase text-xs font-bold text-rose-300">
                  {txt.criticalDmg}
                </div>
                <div className="font-mono text-[11px] text-white">
                  {txt.criticalResult}
                </div>
              </div>
            )}

            {/* Action Button: Engage Tactical Overdrive */}
            <button
              onClick={handleEngageOverdrive}
              disabled={stage === 'OVERDRIVE_IMPACT'}
              className={`w-full min-h-[48px] px-6 py-3 font-mono tracking-wider uppercase text-sm font-bold border transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer ${
                stage === 'OVERDRIVE_IMPACT'
                  ? 'bg-rose-700 text-white border-rose-400 opacity-90'
                  : 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border-rose-400/60 shadow-xl shadow-rose-950/80 active:scale-[0.99]'
              }`}
            >
              <ImpactBoltIcon className="w-5 h-5 text-white" />
              <span>{stage === 'OVERDRIVE_IMPACT' ? txt.engagingBtn : txt.engageBtn}</span>
            </button>
          </div>
        )}

        {/* STAGE 3: REWARD_CLAIM */}
        {stage === 'REWARD_CLAIM' && (
          <div className="space-y-4 animate-fade-in text-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono tracking-wider uppercase text-[10px] font-bold mb-1">
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{txt.victoryConfirmed}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-white">
                {txt.rewardTitle}
              </h2>
              <p className="mt-1 text-xs font-mono text-slate-300">
                {txt.rewardDesc}
              </p>
            </div>

            {/* Rewards Display Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {/* Reward 1: 10x Prime Summon Ticket */}
              <div className="border border-indigo-500/40 bg-indigo-950/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono uppercase text-[10px] text-indigo-400 font-semibold">
                    {txt.currencyDropBadge}
                  </span>
                  <span className="font-mono tracking-wider uppercase text-xs font-bold text-amber-400">
                    x10
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-white">
                  {txt.ticketTitle}
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  {txt.ticketDesc}
                </div>
              </div>

              {/* Reward 2: SH-101 Sovereign 24H Command Access */}
              <div className="border border-cyan-500/40 bg-cyan-950/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono uppercase text-[10px] text-cyan-400 font-semibold">
                    {txt.accessBadge}
                  </span>
                  <span className="font-mono tracking-wider uppercase text-xs font-bold text-cyan-300">
                    24:00:00
                  </span>
                </div>
                <div className="font-mono font-bold text-sm text-white">
                  {txt.sovereignTitle}
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  {txt.sovereignDesc}
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-2.5 bg-black/40 border border-white/10 text-left flex items-start gap-2">
              <ShieldIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-mono text-slate-300 leading-tight">
                {txt.persistenceNotice}
              </div>
            </div>

            {/* CTA Button: Claim & Enter Command Deck */}
            <button
              onClick={handleClaimAndEnterDeck}
              className="w-full min-h-[48px] px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono tracking-wider uppercase text-sm font-bold border border-emerald-400/50 shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 rounded-sm cursor-pointer"
            >
              <VectorArrowIcon className="w-5 h-5 text-white" />
              <span>{txt.claimBtn}</span>
            </button>
          </div>
        )}

        {/* Footer Subtext */}
        <div className="mt-4 pt-2 border-t border-white/5 text-center">
          <span className="font-mono uppercase text-[10px] text-slate-400 tracking-wider">
            {txt.systemFooter}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FirstVisitOverdriveModal;
