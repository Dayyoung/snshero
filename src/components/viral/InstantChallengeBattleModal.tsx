import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import {
 ChallengePayload,
 generateTacticalChallengeDataUrl,
 downloadTacticalChallengeImage,
 copyChallengeToClipboard,
 shareChallengeViaWebShare,
} from '../../utils/challengeCanvasGenerator';
import { InstantRevengeModal } from './InstantRevengeModal';

export interface BattleResult {
 winner: 'player' | 'challenger';
 playerScore: number;
 challengerScore: number;
 rewardsGranted: {
 credits: number;
 trialCard: string;
 durationHours: number;
 };
}

export interface InstantChallengeBattleModalProps {
 isOpen: boolean;
 deckCode: string;
 onClose: () => void;
 onNavigateDeck: () => void;
 language?: string;
}

type ModalStage = 'PREVIEW' | 'BATTLING' | 'RESULT_REWARD';

// Pure inline SVG icons strictly adhering to strokeWidth="1.75" and Zero-Emoji rule
const CrossedSwordsIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
 <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
 <line x1="13" y1="19" x2="19" y2="13" />
 <line x1="16" y1="16" x2="20" y2="20" />
 <line x1="19" y1="21" x2="21" y2="19" />
 <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
 <line x1="5" y1="14" x2="9" y2="18" />
 <line x1="7" y1="17" x2="4" y2="20" />
 <line x1="3" y1="19" x2="5" y2="21" />
 </svg>
);

const TargetScopeIcon = ({ className = 'w-5 h-5 text-cyan-400' }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="10" />
 <line x1="22" y1="12" x2="18" y2="12" />
 <line x1="6" y1="12" x2="2" y2="12" />
 <line x1="12" y1="6" x2="12" y2="2" />
 <line x1="12" y1="22" x2="12" y2="18" />
 <circle cx="12" cy="12" r="3" />
 </svg>
);

const ShareArrowIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="18" cy="5" r="3" />
 <circle cx="6" cy="12" r="3" />
 <circle cx="18" cy="19" r="3" />
 <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
 <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
 </svg>
);

const TacticalChipsetIcon = ({ className = 'w-5 h-5 text-amber-400' }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
 <rect x="4" y="4" width="16" height="16" rx="2" />
 <rect x="9" y="9" width="6" height="6" />
 <line x1="9" y1="1" x2="9" y2="4" />
 <line x1="15" y1="1" x2="15" y2="4" />
 <line x1="9" y1="20" x2="9" y2="23" />
 <line x1="15" y1="20" x2="15" y2="23" />
 <line x1="20" y1="9" x2="23" y2="9" />
 <line x1="20" y1="14" x2="23" y2="14" />
 <line x1="1" y1="9" x2="4" y2="9" />
 <line x1="1" y1="14" x2="4" y2="14" />
 </svg>
);

const CloseIcon = ({ className = 'w-4 h-4 text-slate-400' }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
 <line x1="18" y1="6" x2="6" y2="18" />
 <line x1="6" y1="6" x2="18" y2="18" />
 </svg>
);

const ShieldBadgeIcon = ({ className = 'w-5 h-5 text-emerald-400' }: { className?: string }) => (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
 </svg>
);

// Safe gtag dispatcher
const triggerGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
 if (typeof window !== 'undefined') {
 const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
 if (typeof gtag === 'function') {
 try {
 gtag('event', eventName, params);
 } catch {
 // fail-safe
 }
 }
 }
};

interface ChallengeTranslations {
 modalHeader: string;
 challengerTitle: string;
 challengerDesc: string;
 deckCodeLabel: string;
 totalPwrLabel: string;
 winRateLabel: string;
 flagshipUnit: string;
 engageBtn: string;
 simulatingHeader: string;
 simulationProgress: string;
 fastForwardBtn: string;
 resultHeader: string;
 victoryLabel: string;
 defeatLabel: string;
 rewardDossierTitle: string;
 rewardCredits: string;
 rewardTrialCard: string;
 buildDeckBtn: string;
 shareChallengeBtn: string;
 copiedNotice: string;
 downloadSheetBtn: string;
 dismissText: string;
}

const TRANSLATIONS: Record<string, ChallengeTranslations> = {
 ko: {
 modalHeader: '[카단 연대기: 영웅의 결투 서약 // 1-CLICK DUEL]',
 challengerTitle: '설원의 도전자 영웅 덱 조우',
 challengerDesc: '1클릭 쾌속 결투로 상대방 영웅 덱에 도전하고 설원 원정 보급품을 획득하세요.',
 deckCodeLabel: '덱 서약 코드',
 totalPwrLabel: '총 전투력',
 winRateLabel: '결투 승률',
 flagshipUnit: '선봉 영웅',
 engageBtn: '[영웅 결투 개시 // 1-클릭 배틀]',
 simulatingHeader: '대륙 영웅 결투 시뮬레이션 중',
 simulationProgress: '결투 진행도: ',
 fastForwardBtn: '[즉시 결과 판정 // 스킵]',
 resultHeader: '[영웅 결투 작전 결과]',
 victoryLabel: '결투 대승 // 설원의 명예 증명',
 defeatLabel: '결투 석패 // 재도전 권장',
 rewardDossierTitle: '결투 감사 원정 보급품 지급 완료',
 rewardCredits: '500 SNS 보급품',
 rewardTrialCard: '24시간 도전자 영웅 대여권',
 buildDeckBtn: '[내 카운터 덱 빌더로 이동]',
 shareChallengeBtn: '[영웅 결투 도전장 공유 (1200x630 시트)]',
 copiedNotice: '결투 도전장 링크와 서약문이 클립보드에 복사되었습니다!',
 downloadSheetBtn: '[결투 서약 시트 다운로드]',
 dismissText: '[닫기]',
 },
 en: {
 modalHeader: '[KADAN CHRONICLES: HERO DUEL VOW // 1-CLICK]',
 challengerTitle: 'CHALLENGER HERO DECK ENCOUNTERED',
 challengerDesc: 'Challenge the rival hero deck via 1-click duel and claim expedition supplies.',
 deckCodeLabel: 'DECK VOW CODE',
 totalPwrLabel: 'TOTAL PWR',
 winRateLabel: 'WIN RATE',
 flagshipUnit: 'FLAGSHIP HERO',
 engageBtn: '[COMMENCE HERO DUEL // 1-CLICK]',
 simulatingHeader: 'CONTINENTAL HERO DUEL IN PROGRESS',
 simulationProgress: 'DUEL PROGRESS: ',
 fastForwardBtn: '[RESOLVE DUEL INSTANTLY]',
 resultHeader: '[HERO DUEL OUTCOME]',
 victoryLabel: 'TRIUMPHANT VICTORY // HONOR PROVEN',
 defeatLabel: 'DEFEAT // REVENGE RECOMMENDED',
 rewardDossierTitle: 'EXPEDITION TACTICAL SUPPLY GRANTED',
 rewardCredits: '500 SNS CREDITS',
 rewardTrialCard: '24H CHALLENGER HERO TRIAL',
 buildDeckBtn: '[BUILD MY COUNTER DECK]',
 shareChallengeBtn: '[SHARE HERO DUEL DOSSIER (1200x630)]',
 copiedNotice: 'Duel challenge link & vow copied to clipboard!',
 downloadSheetBtn: '[DOWNLOAD DUEL DOSSIER IMAGE]',
 dismissText: '[CLOSE]',
 },
 ja: {
 modalHeader: '戦術デッキチャレンジ // 1クリックWEBバトル',
 challengerTitle: '挑戦者デッキを検知',
 challengerDesc: '1クリック高速シミュレーションで即座に対戦し、レンタル報酬を獲得しましょう。',
 deckCodeLabel: 'デッキコード',
 totalPwrLabel: '総戦闘力',
 winRateLabel: '勝率',
 flagshipUnit: '旗艦ユニット',
 engageBtn: 'チャレンジ開始 (1クリックバトル)',
 simulatingHeader: '戦術高速自動戦闘シミュレーション中',
 simulationProgress: '進行時間: ',
 fastForwardBtn: '結果へスキップ [高速完了]',
 resultHeader: '戦術チャレンジ作戦結果',
 victoryLabel: '作戦勝利 // チャレンジ成功',
 defeatLabel: '作戦終了 // カウンター推奨',
 rewardDossierTitle: '挑戦感謝・戦術補給品の支給完了',
 rewardCredits: '500 戦術クレジット',
 rewardTrialCard: '24時間 挑戦者ヒーロー体験権 (SH-204)',
 buildDeckBtn: 'カウンターデッキ構築へ移動',
 shareChallengeBtn: '戦術チャレンジを共有 (1200x630)',
 copiedNotice: 'チャレンジリンクがクリップボードにコピーされました！',
 downloadSheetBtn: '戦術シート画像を保存',
 dismissText: '閉じる',
 },
 'zh-CN': {
 modalHeader: '战术卡组对决 // 一键即玩网页战斗',
 challengerTitle: '截获挑战者战术卡组',
 challengerDesc: '一键高速模拟对战，立即挑战对手卡组并获取租借试用补给。',
 deckCodeLabel: '卡组代码',
 totalPwrLabel: '总战力',
 winRateLabel: '胜率',
 flagshipUnit: '旗舰单位',
 engageBtn: '开启挑战 (一键战斗)',
 simulatingHeader: '战术高速自动战斗模拟中',
 simulationProgress: '模拟进度: ',
 fastForwardBtn: '快进查看结果 [立即判定]',
 resultHeader: '战术挑战作战报告',
 victoryLabel: '作战胜利 // 成功击溃',
 defeatLabel: '作战结束 // 推荐构筑针对卡组',
 rewardDossierTitle: '挑战感谢战术物资发放完毕',
 rewardCredits: '500 战术积分',
 rewardTrialCard: '24小时挑战者英雄体验特权 (SH-204)',
 buildDeckBtn: '前往构筑针对卡组',
 shareChallengeBtn: '分享战术挑战 (1200x630战术表)',
 copiedNotice: '挑战链接与战报文本已复制至剪贴板！',
 downloadSheetBtn: '下载战术图表',
 dismissText: '关闭',
 },
 'zh-TW': {
 modalHeader: '戰術牌組對決 // 一鍵即玩網頁戰鬥',
 challengerTitle: '截獲挑戰者戰術牌組',
 challengerDesc: '一鍵高速模擬對戰，立即挑戰對手牌組並獲取租借試用補給。',
 deckCodeLabel: '牌組代碼',
 totalPwrLabel: '總戰力',
 winRateLabel: '勝率',
 flagshipUnit: '旗艦單位',
 engageBtn: '開啟挑戰 (一鍵戰鬥)',
 simulatingHeader: '戰術高速自動戰鬥模擬中',
 simulationProgress: '模擬進度: ',
 fastForwardBtn: '快進查看結果 [立即判定]',
 resultHeader: '戰術挑戰作戰報告',
 victoryLabel: '作戰勝利 // 成功擊潰',
 defeatLabel: '作戰結束 // 推薦構築針對牌組',
 rewardDossierTitle: '挑戰感謝戰術物資發放完畢',
 rewardCredits: '500 戰術積分',
 rewardTrialCard: '24小時挑戰者英雄體驗特權 (SH-204)',
 buildDeckBtn: '前往構築針對牌組',
 shareChallengeBtn: '分享戰術挑戰 (1200x630戰術表)',
 copiedNotice: '挑戰連結與戰報文字已複製至剪貼簿！',
 downloadSheetBtn: '下載戰術圖表',
 dismissText: '關閉',
 },
 es: {
 modalHeader: 'DESAFIO TACTICO DE MAZO // 1-CLICK WEB BATTLE',
 challengerTitle: 'MAZO DESAFIANTE DETECTADO',
 challengerDesc: 'Inicie una simulacion de combate instantanea de 1 clic para probar este mazo y ganar suministros.',
 deckCodeLabel: 'CODIGO DE MAZO',
 totalPwrLabel: 'PODER TOTAL',
 winRateLabel: 'VICTORIAS',
 flagshipUnit: 'UNIDAD INSIGNIA',
 engageBtn: 'INICIAR DESAFIO (BATALLA 1-CLIC)',
 simulatingHeader: 'SIMULANDO AUTOBATALLA TACTICA',
 simulationProgress: 'TIEMPO: ',
 fastForwardBtn: 'AVANCE RAPIDO AL RESULTADO',
 resultHeader: 'RESULTADO DE LA MISION TACTICA',
 victoryLabel: 'VICTORIA // DESAFIO SUPERADO',
 defeatLabel: 'MISION FINALIZADA // CONTRAMAZO RECOMENDADO',
 rewardDossierTitle: 'SUMINISTRO DE AGRADECIMIENTO OTORGADO',
 rewardCredits: '500 CREDITOS TACTICOS',
 rewardTrialCard: 'ACCESO TEMPORAL 24H A HEROE (SH-204)',
 buildDeckBtn: 'CONSTRUIR MI CONTRAMAZO',
 shareChallengeBtn: 'COMPARTIR DESAFIO TACTICO (1200x630)',
 copiedNotice: 'Enlace de desafio copiado al portapapeles.',
 downloadSheetBtn: 'DESCARGAR DOSSIER TACTICO',
 dismissText: 'Cerrar',
 },
 fr: {
 modalHeader: 'DEFI TACTIQUE DE DECK // COMBAT WEB 1-CLIC',
 challengerTitle: 'DECK DU DEFIANT INTERCEPTE',
 challengerDesc: 'Lancez un combat automatique instantane en 1 clic pour affronter ce deck et gagner des recompenses.',
 deckCodeLabel: 'CODE DU DECK',
 totalPwrLabel: 'PUISSANCE TOTALE',
 winRateLabel: 'RATIO VICTOIRE',
 flagshipUnit: 'UNITE AMIRALE',
 engageBtn: 'ENGAGER LE DEFI (COMBAT 1-CLIC)',
 simulatingHeader: 'SIMULATION DU COMBAT AUTOMATIQUE',
 simulationProgress: 'PROGRESSION: ',
 fastForwardBtn: 'AVANCE RAPIDE VERS LE RESULTAT',
 resultHeader: 'RAPPORT DE COMBAT TACTIQUE',
 victoryLabel: 'VICTOIRE // DEFI VALIDE',
 defeatLabel: 'FIN DE MISSION // CONTRE-DECK CONSEILLE',
 rewardDossierTitle: 'SUPPLEMENT TACTIQUE DE RECOMPENSE ACCORDE',
 rewardCredits: '500 CREDITS TACTIQUES',
 rewardTrialCard: 'ACCES D ESSAI 24H HEROIQUE (SH-204)',
 buildDeckBtn: 'CREER MON CONTRE-DECK',
 shareChallengeBtn: 'PARTAGER LE DEFI TACTIQUE (1200x630)',
 copiedNotice: 'Lien du defi copie dans le presse-papier.',
 downloadSheetBtn: 'TELECHARGER LE DOSSIER',
 dismissText: 'Fermer',
 },
 de: {
 modalHeader: 'TAKTIK-DECK-HERAUSFORDERUNG // 1-KLICK-WEBKAMPF',
 challengerTitle: 'HERAUSFORDERER-DECK ABGEFANGEN',
 challengerDesc: 'Starten Sie eine 1-Klick-Gefechtssimulation, um dieses Deck herauszufordern und Pachtbelohnungen zu erhalten.',
 deckCodeLabel: 'DECK-CODE',
 totalPwrLabel: 'GESAMTLEISTUNG',
 winRateLabel: 'SIEGQUOTE',
 flagshipUnit: 'FLAGGSCHIFF-EINHEIT',
 engageBtn: 'HERAUSFORDERUNG STARTEN (1-KLICK-KAMPF)',
 simulatingHeader: 'TAKTIK-AUTOKAMPF WIRD SIMULIERT',
 simulationProgress: 'SIMULATIONSZEIT: ',
 fastForwardBtn: 'SCHNELLER VORLAUF ZUM ERGEBNIS',
 resultHeader: 'ERGEBNIS DES TAKTIKEINSATZES',
 victoryLabel: 'EINSATZSIEG // HERAUSFORDERUNG GEMEISTERT',
 defeatLabel: 'EINSATZENDE // KONTERDECK EMPFOHLEN',
 rewardDossierTitle: 'TAKTIK-VERSORGUNG ZUGEWIESEN',
 rewardCredits: '500 TAKTIK-KREDITE',
 rewardTrialCard: '24H HELDEN-TESTZUGANG (SH-204)',
 buildDeckBtn: 'MEIN KONTERDECK BAUEN',
 shareChallengeBtn: 'HERAUSFORDERUNG TEILEN (1200x630)',
 copiedNotice: 'Herausforderungslink in Zwischenablage kopiert.',
 downloadSheetBtn: 'TAKTIK-DOSSIER HERUNTERLADEN',
 dismissText: 'Schliessen',
 },
 vi: {
 modalHeader: 'THACH THUC BO THE CHIEN THUAT // 1-CLICK WEB BATTLE',
 challengerTitle: 'PHAT HIEN BO THE THACH DAU',
 challengerDesc: 'Mo phong chien dau tu dong 1-click ngay de thu nghiem bo the va nhan tiep te quan nhu.',
 deckCodeLabel: 'MA BO THE',
 totalPwrLabel: 'TONG LUC CHIEN',
 winRateLabel: 'TY LE THANG',
 flagshipUnit: 'DON VI CHU LUC',
 engageBtn: 'CHAP NHAN THACH DAU (1-CLICK BATTLE)',
 simulatingHeader: 'DANG MO PHONG GIAO TRAN TU DONG',
 simulationProgress: 'THOI GIAN MO PHONG: ',
 fastForwardBtn: 'CHUYEN NHANH DEN KET QUA',
 resultHeader: 'KET QUA CHIEN DICH THACH THUC',
 victoryLabel: 'CHIEN THANG // DA VUOT QUA THACH THUC',
 defeatLabel: 'KET THUC CHIEN DICH // NEN XAY DUNG THE PHAN KICH',
 rewardDossierTitle: 'DA TRAO PHAN THUONG TRI AN THACH DAU',
 rewardCredits: '500 TIEN CHIEN THUAT',
 rewardTrialCard: 'QUYEN DUNG THU ANH HUNG 24H (SH-204)',
 buildDeckBtn: 'XAY DUNG BO THE PHAN KICH',
 shareChallengeBtn: 'CHIA SE THACH THUC (1200x630)',
 copiedNotice: 'Da sao chep lien ket vao bo nho tam.',
 downloadSheetBtn: 'TAI XUONG HO SO CHIEN THUAT',
 dismissText: 'Dong',
 },
 th: {
 modalHeader: 'ท้าประลองเด็คยุทธวิธี // เว็บบัตเทิล 1-คลิก',
 challengerTitle: 'ตรวจจับเด็คผู้ท้าประลอง',
 challengerDesc: 'จำลองการรบด่วนแบบ 1-คลิก เพื่อทดสอบเด็คนี้และรับเสบียงทดลองใช้งานทันที',
 deckCodeLabel: 'รหัสเด็ค',
 totalPwrLabel: 'พลังรบรวม',
 winRateLabel: 'อัตราการชนะ',
 flagshipUnit: 'ยูนิตเรือธง',
 engageBtn: 'เริ่มการท้าทาย (1-คลิก บัตเทิล)',
 simulatingHeader: 'กำลังจำลองการรบอัตโนมัติความเร็วสูง',
 simulationProgress: 'เวลาการจำลอง: ',
 fastForwardBtn: 'ข้ามไปยังผลการรบ [ตรวจผลทันที]',
 resultHeader: 'ผลลัพธ์ภารกิจการท้าทาย',
 victoryLabel: 'ชัยชนะในภารกิจ // ผ่านการท้าทายสำเร็จ',
 defeatLabel: 'สิ้นสุดภารกิจ // แนะนำให้จัดเด็คแก้ทาง',
 rewardDossierTitle: 'มอบเสบียงยุทธวิธียกย่องการท้าทายเรียบร้อย',
 rewardCredits: '500 เครดิตยุทธวิธี',
 rewardTrialCard: 'สิทธิ์ทดลองใช้ฮีโร่ 24 ชม. (SH-204)',
 buildDeckBtn: 'สร้างเด็คแก้ทางของฉัน',
 shareChallengeBtn: 'แชร์การท้าทายยุทธวิธี (1200x630)',
 copiedNotice: 'คัดลอกลิงก์การท้าทายลงในคลิปบอร์ดแล้ว!',
 downloadSheetBtn: 'ดาวน์โหลดภาพแผนยุทธวิธี',
 dismissText: 'ปิด',
 },
 id: {
 modalHeader: 'TANTANGAN DEK TAKTIS // 1-KLIK WEB BATTLE',
 challengerTitle: 'DEK PENANTANG TERDETEKSI',
 challengerDesc: 'Mulai simulasi tempur kilat 1-klik untuk menguji dek ini dan dapatkan pasokan sewa.',
 deckCodeLabel: 'KODE DEK',
 totalPwrLabel: 'TOTAL KEKUATAN',
 winRateLabel: 'TINGKAT KEMENANGAN',
 flagshipUnit: 'UNIT UNGGULAN',
 engageBtn: 'TERIMA TANTANGAN (1-KLIK BATTLE)',
 simulatingHeader: 'MENYIMULASIKAN PERTEMPURAN OTOMATIS',
 simulationProgress: 'WAKTU SIMULASI: ',
 fastForwardBtn: 'PERCEPAT KE HASIL',
 resultHeader: 'HASIL MISI TANTANGAN TAKTIS',
 victoryLabel: 'KEMENANGAN MISI // TANTANGAN DIBERSIHKAN',
 defeatLabel: 'MISI SELESAI // DISARANKAN DEK COUNTER',
 rewardDossierTitle: 'PASOKAN PENGHARGAAN DIBERIKAN',
 rewardCredits: '500 KREDIT TAKTIS',
 rewardTrialCard: 'AKSES SEWA HERO 24H (SH-204)',
 buildDeckBtn: 'RANCANG DEK COUNTER SAYA',
 shareChallengeBtn: 'BAGIKAN TANTANGAN TAKTIS (1200x630)',
 copiedNotice: 'Tautan tantangan disalin ke papan klip!',
 downloadSheetBtn: 'UNDUH BERKAS TAKTIS',
 dismissText: 'Tutup',
 },
 ru: {
 modalHeader: 'ТАКТИЧЕСКИЙ ВЫЗОВ КОЛОДЫ // 1-КЛИК ВЕБ-БОЙ',
 challengerTitle: 'ПЕРЕХВАЧЕНА КОЛОДА ПРЕТЕНДЕНТА',
 challengerDesc: 'Запустите мгновенную симуляцию в 1 клик, чтобы испытать эту колоду и получить награды.',
 deckCodeLabel: 'КОД КОЛОДЫ',
 totalPwrLabel: 'ОБЩАЯ БОЕВАЯ МОЩЬ',
 winRateLabel: 'ВИНРЕЙТ',
 flagshipUnit: 'ФЛАГМАНСКИЙ ЮНИТ',
 engageBtn: 'ПРИНЯТЬ ВЫЗОВ (1-КЛИК БОЙ)',
 simulatingHeader: 'ИДЕТ СИМУЛЯЦИЯ АВТОМАТИЧЕСКОГО БОЯ',
 simulationProgress: 'ВРЕМЯ СИМУЛЯЦИИ: ',
 fastForwardBtn: 'БЫСТРЫЙ ПЕРЕХОД К РЕЗУЛЬТАТУ',
 resultHeader: 'ИТОГИ ТАКТИЧЕСКОГО ВЫЗОВА',
 victoryLabel: 'ПОБЕДА В ОПЕРАЦИИ // ВЫЗОВ ПРОЙДЕН',
 defeatLabel: 'МИССИЯ ЗАВЕРШЕНА // РЕКОМЕНДУЕТСЯ КОНТРКОЛОДА',
 rewardDossierTitle: 'ТАКТИЧЕСКОЕ СНАБЖЕНИЕ ЗА УЧАСТИЕ НАЧИСЛЕНО',
 rewardCredits: '500 ТАКТИЧЕСКИХ КРЕДИТОВ',
 rewardTrialCard: '24Ч ТЕСТОВЫЙ ДОСТУП К ГЕРОЮ (SH-204)',
 buildDeckBtn: 'СОЗДАТЬ СВОЮ КОНТРКОЛОДУ',
 shareChallengeBtn: 'ПОДЕЛИТЬСЯ ВЫЗОВОМ (1200x630)',
 copiedNotice: 'Ссылка на вызов скопирована в буфер обмена!',
 downloadSheetBtn: 'СКАЧАТЬ ТАКТИЧЕСКИЙ ДОСЬЕ',
 dismissText: 'Закрыть',
 },
};

const getChallengeText = (langCode?: string): ChallengeTranslations => {
 if (!langCode) return TRANSLATIONS.ko;
 if (TRANSLATIONS[langCode]) return TRANSLATIONS[langCode];
 if (langCode === 'gb' || langCode === 'en-GB') return TRANSLATIONS.en;
 const prefix = langCode.split('-')[0];
 if (TRANSLATIONS[prefix]) return TRANSLATIONS[prefix];
 return TRANSLATIONS.ko;
};

export const InstantChallengeBattleModal: React.FC<InstantChallengeBattleModalProps> = ({
 isOpen,
 deckCode,
 onClose,
 onNavigateDeck,
 language: propLanguage,
}) => {
 let contextLang = 'ko';
 try {
 const settings = useGameSettings();
 if (settings && settings.language) {
 contextLang = settings.language;
 }
 } catch {
 // context failover
 }

 const effectiveLang = propLanguage || contextLang || 'ko';
 const txt = getChallengeText(effectiveLang);

 const [stage, setStage] = useState<ModalStage>('PREVIEW');
 const [battleCountdown, setBattleCountdown] = useState<number>(30);
 const [playerHp, setPlayerHp] = useState<number>(100);
 const [challengerHp, setChallengerHp] = useState<number>(100);
 const [battleLog, setBattleLog] = useState<string>('COMBAT MATRIX INITIALIZED');
 const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
 const [showRevengeModal, setShowRevengeModal] = useState<boolean>(false);
 const timerRef = useRef<NodeJS.Timeout | null>(null);

 // Parse or mock challenger profile from deckCode
 const challengerPayload: ChallengePayload = {
 deckCode: deckCode || 'SNSH1-ALPHA-77',
 commanderName: 'COMMANDER_GHOST',
 totalPwr: 28450,
 winRate: 68.4,
 leadHeroName: 'SH-204 // VALKYRIE-EX',
 leadHeroPwr: 9420,
 leadHeroClass: 'ASSAULT VANGUARD',
 cardsCount: 5,
 };

 useEffect(() => {
 if (isOpen) {
 setStage('PREVIEW');
 setBattleCountdown(30);
 setPlayerHp(100);
 setChallengerHp(100);
 setBattleLog('COMBAT MATRIX INITIALIZED');
 setCopiedSuccess(false);

 triggerGtagEvent('challenge_modal_opened', {
 deckCode,
 });
 } else {
 if (timerRef.current) {
 clearInterval(timerRef.current);
 timerRef.current = null;
 }
 }
 }, [isOpen, deckCode]);

 // Finish battle and grant rewards
 const finishBattle = useCallback((isImmediateVictory = false) => {
 if (timerRef.current) {
 clearInterval(timerRef.current);
 timerRef.current = null;
 }

 setPlayerHp(isImmediateVictory ? 72 : Math.max(10, Math.floor(Math.random() * 40) + 40));
 setChallengerHp(0);
 setStage('RESULT_REWARD');

 // Grant 500 Credits & 24H Trial card into localStorage
 if (typeof window !== 'undefined') {
 try {
 const currentCredits = parseInt(localStorage.getItem('hero_user_credits') || '0', 10);
 localStorage.setItem('hero_user_credits', (currentCredits + 500).toString());

 const trialExpiry = Date.now() + 24 * 60 * 60 * 1000;
 localStorage.setItem('hero_trial_sh204_challenge_access_until', trialExpiry.toString());
 sessionStorage.setItem(`snshero_challenge_completed_${deckCode}`, 'true');
 } catch {
 // safe storage failover
 }
 }

 triggerGtagEvent('challenge_battle_completed', {
 deckCode,
 winner: 'player',
 rewardCredits: 500,
 });
 }, [deckCode]);

 // Start 30-second rapid autobattle simulation
 const handleStartBattle = () => {
 setStage('BATTLING');
 setBattleCountdown(30);
 setPlayerHp(100);
 setChallengerHp(100);
 setBattleLog('ENGAGING ORBITAL WEAPONS // SIMULATION ACTIVE');

 triggerGtagEvent('challenge_battle_started', {
 deckCode,
 });

 let currentSec = 30;
 timerRef.current = setInterval(() => {
 currentSec -= 1;
 setBattleCountdown(currentSec);

 // Simulate dynamic turn impacts
 const turnDamageToChallenger = Math.floor(Math.random() * 8) + 3;
 const turnDamageToPlayer = Math.floor(Math.random() * 5) + 2;

 setChallengerHp((prev) => Math.max(0, prev - turnDamageToChallenger));
 setPlayerHp((prev) => Math.max(20, prev - turnDamageToPlayer));

 if (currentSec % 3 === 0) {
 setBattleLog(`TURN ${31 - currentSec} // QUANTUM BURST CRITICAL HIT`);
 }

 if (currentSec <= 0) {
 finishBattle(false);
 }
 }, 1000);
 };

 const handleFastForward = () => {
 finishBattle(true);
 };

 const handleShareClick = async () => {
 const success = await shareChallengeViaWebShare(challengerPayload);
 if (success) {
 setCopiedSuccess(true);
 setTimeout(() => setCopiedSuccess(false), 3000);
 }
 triggerGtagEvent('challenge_shared_clipboard', {
 deckCode,
 });
 };

 const handleDownloadSheet = async () => {
 await downloadTacticalChallengeImage(challengerPayload, `SNSHero-Tactical-Challenge-${deckCode}.png`);
 triggerGtagEvent('challenge_sheet_downloaded', {
 deckCode,
 });
 };

 const handleGoToDeckBuilder = () => {
 triggerGtagEvent('challenge_navigate_deck_builder', {
 deckCode,
 });
 onNavigateDeck();
 onClose();
 };

 if (!isOpen) return null;

 return (
 <div
 role="dialog"
 aria-modal="true"
 aria-labelledby="challenge-modal-title"
 className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 min-h-[100dvh] max-h-[100dvh] overflow-y-auto bg-black/85 backdrop-blur-md select-none animate-fade-in"
 >
 <div className="relative w-full max-w-lg bg-[#090d16] border border-[#646262]/40 rounded-none p-5 sm:p-6 font-mono text-xs text-white shadow-none space-y-4">
 {/* Top Header Row with System Identifiers & Close */}
 <div className="flex items-center justify-between border-b border-white/10 pb-3">
 <div className="flex items-center gap-2">
 <span className="text-[10px] text-amber-400 font-bold">[CHALLENGE]</span>
 <span className="font-mono tracking-wider uppercase text-[11px] font-bold text-stone-200">
 {txt.modalHeader}
 </span>
 </div>

 <button
 onClick={onClose}
 className="min-h-[44px] text-stone-400 hover:text-white p-1 rounded-sm border border-transparent hover:border-stone-700 cursor-pointer"
 aria-label={txt.dismissText}
 >
 [x]
 </button>
 </div>

 {/* STAGE 1: PREVIEW */}
 {stage === 'PREVIEW' && (
 <div className="space-y-4 animate-fade-in">
 <div>
 <h2 id="challenge-modal-title" className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
 {txt.challengerTitle}
 </h2>
 <p className="mt-1 text-stone-400 text-[11px] leading-relaxed">
 {txt.challengerDesc}
 </p>
 </div>

 {/* Challenger Profile Card */}
 <div className="p-3.5 bg-stone-950 border border-stone-800 rounded-none space-y-3">
 <div className="flex items-center justify-between border-b border-white/10 pb-2">
 <div>
 <div className="text-[10px] uppercase text-slate-400">{txt.deckCodeLabel}</div>
 <div className="text-sm font-bold text-cyan-400">{challengerPayload.deckCode}</div>
 </div>
 <div className="text-right">
 <span className="inline-block px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
 VERIFIED ENCRYPTION
 </span>
 </div>
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 gap-2 text-left">
 <div className="p-2 bg-black/40 border border-white/10 rounded-sm">
 <div className="text-[10px] text-slate-400">{txt.totalPwrLabel}</div>
 <div className="text-base font-bold text-amber-400">
 {challengerPayload.totalPwr.toLocaleString()}
 </div>
 </div>
 <div className="p-2 bg-black/40 border border-white/10 rounded-sm">
 <div className="text-[10px] text-slate-400">{txt.winRateLabel}</div>
 <div className="text-base font-bold text-emerald-400">
 {challengerPayload.winRate}%
 </div>
 </div>
 </div>

 {/* Flagship Unit Showcase */}
 <div className="flex items-center justify-between p-2.5 bg-black/50 border border-white/10 rounded-sm">
 <div className="flex items-center gap-2">
 <TacticalChipsetIcon className="w-5 h-5 text-amber-400" />
 <div>
 <div className="text-[9px] uppercase text-slate-400">{txt.flagshipUnit}</div>
 <div className="font-bold text-white text-xs">{challengerPayload.leadHeroName}</div>
 </div>
 </div>
 <div className="text-right">
 <div className="text-[10px] text-amber-400 font-bold">
 PWR {challengerPayload.leadHeroPwr.toLocaleString()}
 </div>
 <div className="text-[9px] text-slate-400">{challengerPayload.leadHeroClass}</div>
 </div>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="space-y-2 pt-1">
 {/* Engage 1-Click Battle Button (min-h-[48px]) */}
 <button
 onClick={handleStartBattle}
 className="w-full min-h-[48px] px-5 py-3 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 font-bold font-mono tracking-wider uppercase text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-none shadow-none"
 >
 <CrossedSwordsIcon className="w-5 h-5 text-emerald-400" />
 <span>{txt.engageBtn}</span>
 </button>

 {/* Viral Share Button (1200x630 Sheet) */}
 <button
 onClick={handleShareClick}
 className="w-full min-h-[44px] px-4 py-2 bg-black/40 hover:bg-black/60 border border-white/15 hover:border-white/30 text-slate-300 hover:text-white font-mono text-xs rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
 >
 <ShareArrowIcon className="w-4 h-4 text-emerald-400" />
 <span>{copiedSuccess ? txt.copiedNotice : txt.shareChallengeBtn}</span>
 </button>
 </div>
 </div>
 )}

 {/* STAGE 2: BATTLING (30s Rapid Simulation) */}
 {stage === 'BATTLING' && (
 <div className="space-y-4 animate-fade-in text-center">
 <div className="flex items-center justify-between border-b border-white/10 pb-2">
 <span className="font-bold text-cyan-400">{txt.simulatingHeader}</span>
 <span className="text-amber-400 font-bold text-xs">
 {txt.simulationProgress}{battleCountdown}s
 </span>
 </div>

 {/* Live HP Matrix */}
 <div className="grid grid-cols-2 gap-3 text-left">
 {/* Player Side */}
 <div className="p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-sm">
 <div className="flex justify-between text-[11px] mb-1">
 <span className="text-cyan-400 font-bold">MY SQUAD</span>
 <span className="text-white font-mono">{playerHp}%</span>
 </div>
 <div className="w-full h-2.5 bg-black/60 border border-white/10 overflow-hidden">
 <div
 className="h-full bg-cyan-400 transition-all duration-300"
 style={{ width: `${playerHp}%` }}
 />
 </div>
 </div>

 {/* Challenger Side */}
 <div className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-sm">
 <div className="flex justify-between text-[11px] mb-1">
 <span className="text-rose-400 font-bold">CHALLENGER</span>
 <span className="text-white font-mono">{challengerHp}%</span>
 </div>
 <div className="w-full h-2.5 bg-black/60 border border-white/10 overflow-hidden">
 <div
 className="h-full bg-rose-500 transition-all duration-300"
 style={{ width: `${challengerHp}%` }}
 />
 </div>
 </div>
 </div>

 {/* Combat Matrix Log Console */}
 <div className="p-3 bg-black/80 border border-white/10 font-mono text-[11px] text-cyan-300 text-left min-h-[48px] flex items-center">
 <span>{`> ${battleLog}`}</span>
 </div>

 {/* Fast-Forward Button */}
 <button
 onClick={handleFastForward}
 className="w-full min-h-[44px] px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 font-mono text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-2"
 >
 <TargetScopeIcon className="w-4 h-4 text-cyan-400" />
 <span>{txt.fastForwardBtn}</span>
 </button>
 </div>
 )}

 {/* STAGE 3: RESULT_REWARD */}
 {stage === 'RESULT_REWARD' && (
 <div className="space-y-4 animate-fade-in text-center">
 <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
 <ShieldBadgeIcon className="w-3.5 h-3.5 text-emerald-400" />
 <span>{txt.victoryLabel}</span>
 </div>

 <h2 className="text-lg sm:text-xl font-bold font-mono text-white">
 {txt.rewardDossierTitle}
 </h2>

 {/* Rewards Card Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
 {/* Reward 1: 500 Credits */}
 <div className="p-3 bg-amber-950/20 border border-amber-500/40 rounded-sm">
 <div className="text-[10px] uppercase text-amber-400 font-bold mb-0.5">CURRENCY BONUS</div>
 <div className="text-sm font-bold text-white">{txt.rewardCredits}</div>
 <div className="text-[10px] text-slate-400 mt-1">Instant bonus credited to account.</div>
 </div>

 {/* Reward 2: 24H Trial Hero Access */}
 <div className="p-3 bg-cyan-950/20 border border-cyan-500/40 rounded-sm">
 <div className="text-[10px] uppercase text-cyan-400 font-bold mb-0.5">CHALLENGE TRIAL</div>
 <div className="text-sm font-bold text-white">{txt.rewardTrialCard}</div>
 <div className="text-[10px] text-slate-400 mt-1">Full 9,420 PWR capability for 24h.</div>
 </div>
 </div>

 {/* Actions */}
 <div className="space-y-2 pt-2">
 {/* Build Counter Deck CTA: DESIGN.md button-primary */}
 <button
 onClick={handleGoToDeckBuilder}
 className="w-full min-h-[44px] px-5 py-3 bg-[#201d1d] hover:bg-stone-800 active:bg-[#0f0000] border border-stone-700 text-stone-100 font-bold font-mono tracking-wider uppercase text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
 >
 <CrossedSwordsIcon className="w-4 h-4 text-amber-400" />
 <span>{txt.buildDeckBtn}</span>
 </button>

 {/* RSI-008: Tactical Revenge Match (+20% Overclock Buff) */}
 <button
 onClick={() => setShowRevengeModal(true)}
 className="w-full min-h-[44px] px-4 py-2.5 bg-stone-900 hover:bg-stone-800 border border-rose-500/60 text-rose-300 font-bold font-mono tracking-wider uppercase text-xs rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
 >
 <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
 <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
 </svg>
 <span>{effectiveLang === 'ko' ? '설욕전 결투 재도전 (+20% 버프)' : 'TACTICAL REVENGE REMATCH (+20% BUFF)'}</span>
 </button>

 {/* Share & Download Row */}
 <div className="grid grid-cols-2 gap-2">
 <button
 onClick={handleShareClick}
 className="min-h-[44px] min-h-[40px] px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/15 text-slate-300 hover:text-white font-mono text-[11px] rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
 >
 <ShareArrowIcon className="w-3.5 h-3.5 text-emerald-400" />
 <span>{copiedSuccess ? txt.copiedNotice : txt.shareChallengeBtn}</span>
 </button>

 <button
 onClick={handleDownloadSheet}
 className="min-h-[44px] min-h-[40px] px-3 py-2 bg-black/40 hover:bg-black/60 border border-white/15 text-slate-300 hover:text-white font-mono text-[11px] rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
 >
 <TargetScopeIcon className="w-3.5 h-3.5 text-cyan-400" />
 <span>{txt.downloadSheetBtn}</span>
 </button>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* RSI-008: Instant Revenge Combat Modal */}
 <InstantRevengeModal
 isOpen={showRevengeModal}
 deckCode={deckCode}
 challengerPayload={challengerPayload}
 onClose={() => setShowRevengeModal(false)}
 language={effectiveLang}
 />
 </div>
 );
};

export default InstantChallengeBattleModal;
export const InstantDuelBattleModal = InstantChallengeBattleModal;
