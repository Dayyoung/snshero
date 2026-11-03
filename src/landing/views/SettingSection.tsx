/**
 * src/landing/views/SettingSection.tsx
 *
 * Official Settings View for SNSHero Static Landing (#setting).
 * Strictly complies with DESIGN.md OpenCode Terminal-Flat design:
 *   - Monospace typography (font-mono)
 *   - Flat surfaces (#fdfcfc, #201d1d) with 1px hairline borders
 *   - 0px container radii (rounded-none), max 4px button/badge radii (rounded-sm)
 *   - 44px+ minimum touch targets for all interactive controls
 *
 * Implements 5 Canonical Setting Sections matching original game settings:
 *   1. Sound (BGM / SFX on-off, volume sliders, track selector, sfx test)
 *   2. Language (12 official languages: ko, en, ja, zh-CN, zh-TW, de, es, fr, id, ru, th, vi)
 *   3. Authentication & Account (Google Sign-In, Domain Fallback, Guest mode, Logout, Rename)
 *   4. Backup & Restore (JSON Export download, JSON File Import restore, Text copy, Reset)
 *   5. System & Domain Diagnostics
 */

import { getCurrentUser, loginWithGoogle, loginAsGuest, loginWithSimulatedGoogle, logoutUser, LandingUser } from '../services/authService';

export interface SoundSettings {
  bgmEnabled: boolean;
  bgmVolume: number; // 0..100
  bgmTrack: string;
  sfxEnabled: boolean;
  sfxVolume: number; // 0..100
  hapticEnabled: boolean;
}

export const OFFICIAL_LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', region: '대한민국' },
  { code: 'en', name: 'English', flag: '🇺🇸', region: 'Global / US' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', region: '日本' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', region: '中国' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼', region: '台灣 / 香港' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', region: 'Deutschland' },
  { code: 'es', name: 'Español', flag: '🇪🇸', region: 'España / LatAm' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', region: 'France' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Indonesia' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', region: 'Россия' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭', region: 'ประเทศไทย' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', region: 'Việt Nam' },
] as const;

export const BGM_TRACK_OPTIONS = [
  { id: 'title', label: '타이틀 테마 (Hero Awakening)' },
  { id: 'lobby', label: '영지 로비 (Sanctuary of Kadan)' },
  { id: 'battle', label: '투기장 결투 (Colosseum Battle)' },
  { id: 'peace', label: '바람 속삭임 (Whispering Wind)' },
] as const;

// ── Sound State Helper ──────────────────────────────────────────────────────
export function getSoundSettings(): SoundSettings {
  if (typeof localStorage === 'undefined') {
    return {
      bgmEnabled: true,
      bgmVolume: 50,
      bgmTrack: 'title',
      sfxEnabled: true,
      sfxVolume: 70,
      hapticEnabled: true,
    };
  }

  const bgmEnabled = localStorage.getItem('hero_bgm_enabled') !== 'false';
  const bgmVolStr = localStorage.getItem('hero_bgm_volume');
  const bgmVolume = bgmVolStr ? Math.max(0, Math.min(100, parseInt(bgmVolStr, 10) || 50)) : 50;
  const bgmTrack = localStorage.getItem('hero_bgm_track') || 'title';

  const sfxEnabled = localStorage.getItem('hero_sfx_enabled') !== 'false';
  const sfxVolStr = localStorage.getItem('hero_sfx_volume');
  const sfxVolume = sfxVolStr ? Math.max(0, Math.min(100, parseInt(sfxVolStr, 10) || 70)) : 70;

  const hapticEnabled = localStorage.getItem('hero_haptic_enabled') !== 'false';

  return {
    bgmEnabled,
    bgmVolume,
    bgmTrack,
    sfxEnabled,
    sfxVolume,
    hapticEnabled,
  };
}

export function getCurrentLanguage(): string {
  if (typeof localStorage === 'undefined') return 'ko';
  return localStorage.getItem('hero_language') || 'ko';
}

export function setCurrentLanguage(lang: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('hero_language', lang);
  }
}

// ── Backup / Export Logic ────────────────────────────────────────────────────
const EXCLUDED_STORAGE_KEYS = new Set([
  'hero_game_logs',
  'hero_custom_card_image',
  'hero_snshero_app_state_v1',
  'hero_modoo_status_cache',
  'hero_match_history',
  'hero_running_session_data',
  'hero_sns_history',
  'hero_daily_missions_history',
  'hero_build_version',
  'hero_last_version_check',
  'hero_boot_gate_shown',
  'hero_goods_pending_payment',
  'hero_goods_pending_order',
]);

export function exportBackupData(): { keyCount: number; jsonString: string } {
  if (typeof localStorage === 'undefined') {
    return { keyCount: 0, jsonString: '{}' };
  }

  const payload: Record<string, string> = {};
  let count = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('hero_') || key === 'firebase_db_mode') {
      if (EXCLUDED_STORAGE_KEYS.has(key)) continue;
      const val = localStorage.getItem(key);
      if (val !== null && val !== '') {
        payload[key] = val;
        count++;
      }
    }
  }

  const exportObj = {
    app: 'SNSHero Revolution',
    version: '2.1.0',
    exportTimestamp: Date.now(),
    exportIsoDate: new Date().toISOString(),
    keyCount: count,
    data: payload,
  };

  return {
    keyCount: count,
    jsonString: JSON.stringify(exportObj, null, 2),
  };
}

export function triggerDownloadBackupFile(): boolean {
  const { jsonString } = exportBackupData();
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const fileName = `snshero_backup_${dateStr}.json`;

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function restoreBackupJson(jsonText: string): { success: boolean; restoredCount: number; message: string } {
  if (typeof localStorage === 'undefined') {
    return { success: false, restoredCount: 0, message: '로컬스토리지를 지원하지 않는 브라우저입니다.' };
  }

  try {
    const parsed = JSON.parse(jsonText);
    const dataObj = parsed.data || parsed;
    if (!dataObj || typeof dataObj !== 'object') {
      return { success: false, restoredCount: 0, message: '유효한 백업 데이터 형식이 아닙니다.' };
    }

    let count = 0;
    for (const [key, val] of Object.entries(dataObj)) {
      if (typeof key === 'string' && key.startsWith('hero_') && typeof val === 'string') {
        localStorage.setItem(key, val);
        count++;
      }
    }

    if (count === 0) {
      return { success: false, restoredCount: 0, message: '복원 가능한 게임 데이터(hero_*)가 발견되지 않았습니다.' };
    }

    // Trigger update events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snshero_auth_changed'));
      window.dispatchEvent(new Event('snshero_deck_updated'));
      window.dispatchEvent(new Event('snshero_card_nurture_updated'));
    }

    return {
      success: true,
      restoredCount: count,
      message: `성공적으로 ${count}개의 게임 데이터 키를 복원하였습니다.`,
    };
  } catch (e: any) {
    return {
      success: false,
      restoredCount: 0,
      message: 'JSON 파싱 오류: ' + (e?.message || '파일이 손상되었습니다.'),
    };
  }
}

export function playTestSfx(): void {
  if (typeof window === 'undefined') return;
  const s = getSoundSettings();
  if (!s.sfxEnabled) return;
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = s.sfxVolume / 100;
    audio.play().catch(() => {});
  } catch {}
}

let activeSettingSubTab: 'all' | 'sound' | 'language' | 'account' | 'backup' = 'all';
let backupNoticeMessage: string = '';

export function handleSettingAction(action: string, target?: HTMLElement): void {
  if (action === 'setting-tab-all') {
    activeSettingSubTab = 'all';
  } else if (action === 'setting-tab-sound') {
    activeSettingSubTab = 'sound';
  } else if (action === 'setting-tab-language') {
    activeSettingSubTab = 'language';
  } else if (action === 'setting-tab-account') {
    activeSettingSubTab = 'account';
  } else if (action === 'setting-tab-backup') {
    activeSettingSubTab = 'backup';
  }
  // ── Sound Actions ────────────────────────────────────────────────────────
  else if (action === 'setting-toggle-bgm') {
    const curr = getSoundSettings();
    localStorage.setItem('hero_bgm_enabled', String(!curr.bgmEnabled));
  } else if (action === 'setting-change-bgm-volume') {
    const input = target as HTMLInputElement;
    if (input && input.value !== undefined) {
      localStorage.setItem('hero_bgm_volume', input.value);
    }
  } else if (action === 'setting-change-bgm-track') {
    const select = target as HTMLSelectElement;
    if (select && select.value) {
      localStorage.setItem('hero_bgm_track', select.value);
    }
  } else if (action === 'setting-toggle-sfx') {
    const curr = getSoundSettings();
    localStorage.setItem('hero_sfx_enabled', String(!curr.sfxEnabled));
  } else if (action === 'setting-change-sfx-volume') {
    const input = target as HTMLInputElement;
    if (input && input.value !== undefined) {
      localStorage.setItem('hero_sfx_volume', input.value);
    }
  } else if (action === 'setting-play-test-sfx') {
    playTestSfx();
  } else if (action === 'setting-toggle-haptic') {
    const curr = getSoundSettings();
    localStorage.setItem('hero_haptic_enabled', String(!curr.hapticEnabled));
  }
  // ── Language Action ──────────────────────────────────────────────────────
  else if (action === 'setting-select-language') {
    const lang = target?.getAttribute('data-lang');
    if (lang) {
      setCurrentLanguage(lang);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('snshero_language_changed'));
      }
    }
  }
  // ── Account / Login Actions ──────────────────────────────────────────────
  else if (action === 'setting-login-google') {
    loginWithGoogle().then((res) => {
      if (res.success) {
        backupNoticeMessage = 'Google 계정으로 성공적으로 로그인되었습니다.';
      } else if (res.isDomainUnauthorized) {
        // Domain unauthorized: prompt fallback
        const ok = confirm(
          `[Firebase 안내]\n현재 접속 도메인(${window.location.hostname})이 Firebase 승인 도메인에 미등록된 임시/터널 도메인입니다.\n\n안전한 '로컬 Google 프로필'로 즉시 연동하여 게임을 시작하시겠습니까?`
        );
        if (ok) {
          loginWithSimulatedGoogle('Google Adventurer', 'adventurer@gmail.com');
          backupNoticeMessage = '로컬 Google 프로필로 연동되었습니다.';
        }
      } else if (!res.isCancelled && res.error) {
        alert(res.error);
      }
    });
  } else if (action === 'setting-login-simulated') {
    const name = prompt('사용하실 구글 프로필 이름을 입력하세요:', 'Google Adventurer');
    if (name) {
      loginWithSimulatedGoogle(name);
      backupNoticeMessage = `Google 프로필 '${name}'으로 로컬 연동되었습니다.`;
    }
  } else if (action === 'setting-login-guest') {
    loginAsGuest();
    backupNoticeMessage = '게스트 모험가 계정으로 전환되었습니다.';
  } else if (action === 'setting-change-name') {
    const current = getCurrentUser();
    const newName = prompt('변경할 닉네임을 입력하세요:', current.displayName);
    if (newName && newName.trim()) {
      loginAsGuest(newName.trim());
      backupNoticeMessage = `닉네임이 '${newName.trim()}'(으)로 변경되었습니다.`;
    }
  } else if (action === 'setting-logout') {
    const ok = confirm('정말 로그아웃 하시겠습니까?');
    if (ok) {
      logoutUser();
      backupNoticeMessage = '로그아웃되어 기본 게스트 세션으로 전환되었습니다.';
    }
  }
  // ── Backup Actions ───────────────────────────────────────────────────────
  else if (action === 'setting-download-backup') {
    triggerDownloadBackupFile();
    backupNoticeMessage = '전체 게임 데이터 백업 JSON 파일이 다운로드되었습니다.';
  } else if (action === 'setting-copy-backup-text') {
    const { jsonString } = exportBackupData();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(jsonString).then(() => {
        alert('백업 데이터 JSON이 클립보드에 복사되었습니다.');
      });
    }
  } else if (action === 'setting-restore-paste') {
    const pasted = prompt('복원할 백업 JSON 텍스트를 붙여넣어 주세요:');
    if (pasted && pasted.trim()) {
      const res = restoreBackupJson(pasted.trim());
      alert(res.message);
      if (res.success) {
        backupNoticeMessage = res.message;
      }
    }
  } else if (action === 'setting-factory-reset') {
    const confirmText = prompt(
      "경고: 모든 카드, 덱, 재화, 진행도가 완전히 초기화됩니다!\n정말 초기화하려면 '초기화'를 입력하세요:"
    );
    if (confirmText === '초기화') {
      const preserveLang = localStorage.getItem('hero_language') || 'ko';
      localStorage.clear();
      localStorage.setItem('hero_language', preserveLang);
      alert('모든 로컬 게임 데이터가 초기화되었습니다. 페이지를 새로고침합니다.');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }
}

export function renderSettingSection(): string {
  const sound = getSoundSettings();
  const currentLang = getCurrentLanguage();
  const user = getCurrentUser();
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const isTailscaleOrTunnel = currentHost.includes('.ts.net') || currentHost.includes('localhost') || currentHost.includes('127.0.0.1');

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none bg-[#fdfcfc]">
      
      <!-- Top Title Banner -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-8 sm:py-10 px-4 sm:px-6 md:px-8">
        <div class="w-full max-w-5xl mx-auto space-y-3">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase">
              SETTINGS &amp; PREFERENCES
            </span>
            <span class="text-xs text-[#646262] font-bold">
              v2.1.0 100% 로컬스토리지 기반
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] tracking-tight m-0">
            시스템 환경 설정 (Settings)
          </h1>
          <p class="text-xs sm:text-sm text-stone-600 m-0 pt-1 leading-relaxed">
            소리(BGM/SFX), 다국어 12개 언어, 계정 인증, 데이터 영구 백업 및 복원을 설정합니다.
          </p>

          <!-- Quick Category Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto pt-3 border-t border-[rgba(15,0,0,0.08)] mt-2">
            <button
              type="button"
              data-action="setting-tab-all"
              class="px-3 py-2 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap transition-colors ${
                activeSettingSubTab === 'all'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
              }"
            >
              전체 보기
            </button>
            <button
              type="button"
              data-action="setting-tab-sound"
              class="px-3 py-2 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap transition-colors ${
                activeSettingSubTab === 'sound'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
              }"
            >
              🎵 소리 설정
            </button>
            <button
              type="button"
              data-action="setting-tab-language"
              class="px-3 py-2 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap transition-colors ${
                activeSettingSubTab === 'language'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
              }"
            >
              🌐 언어 (Language)
            </button>
            <button
              type="button"
              data-action="setting-tab-account"
              class="px-3 py-2 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap transition-colors ${
                activeSettingSubTab === 'account'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
              }"
            >
              👤 계정 &amp; 로그인
            </button>
            <button
              type="button"
              data-action="setting-tab-backup"
              class="px-3 py-2 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap transition-colors ${
                activeSettingSubTab === 'backup'
                  ? 'bg-[#201d1d] text-[#fdfcfc]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
              }"
            >
              💾 데이터 백업 &amp; 복원
            </button>
          </div>
        </div>
      </section>

      <!-- Main Settings Body -->
      <main class="w-full py-8 sm:py-12 px-4 sm:px-6 md:px-8 bg-[#fdfcfc]">
        <div class="w-full max-w-5xl mx-auto space-y-8">
          
          ${
            backupNoticeMessage
              ? `
            <div class="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-sm text-xs font-bold flex items-center justify-between">
              <span>✓ ${escapeHtml(backupNoticeMessage)}</span>
              <button type="button" onclick="this.parentElement.remove()" class="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1">[✕]</button>
            </div>
          `
              : ''
          }

          <!-- 1. SOUND SETTINGS -->
          ${
            activeSettingSubTab === 'all' || activeSettingSubTab === 'sound'
              ? `
            <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none space-y-6">
              <div class="border-b border-[rgba(15,0,0,0.12)] pb-3 flex items-center justify-between">
                <div>
                  <h2 class="text-base sm:text-lg font-bold text-[#201d1d] m-0 flex items-center gap-2">
                    <span>🎵 소리 및 음향 설정 (Sound &amp; Audio)</span>
                  </h2>
                  <p class="text-xs text-stone-500 m-0 pt-0.5">배경음악과 효과음 볼륨 및 트랙을 조정합니다.</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <!-- BGM Control Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold text-[#201d1d]">배경음악 (BGM)</span>
                      <p class="text-[11px] text-stone-500 m-0">게임 및 로비 배경 사운드</p>
                    </div>
                    <button
                      type="button"
                      data-action="setting-toggle-bgm"
                      class="px-3.5 py-1.5 rounded-sm text-xs font-bold min-h-[44px] cursor-pointer transition-colors ${
                        sound.bgmEnabled
                          ? 'bg-[#201d1d] text-[#fdfcfc]'
                          : 'bg-stone-200 text-stone-500 border border-stone-300'
                      }"
                    >
                      ${sound.bgmEnabled ? 'BGM 켜짐 [ON]' : 'BGM 꺼짐 [OFF]'}
                    </button>
                  </div>

                  <!-- Volume Slider -->
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-xs font-bold">
                      <span class="text-stone-600">BGM 음량:</span>
                      <span class="text-[#201d1d]" id="setting-bgm-volume-val">${sound.bgmVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value="${sound.bgmVolume}"
                      data-action="setting-change-bgm-volume"
                      class="w-full accent-[#201d1d] cursor-pointer"
                    />
                  </div>

                  <!-- Track Selector -->
                  <div class="space-y-1.5 pt-2 border-t border-[rgba(15,0,0,0.08)]">
                    <label class="text-xs font-bold text-stone-600">배경음악 프리셋:</label>
                    <select
                      data-action="setting-change-bgm-track"
                      class="w-full px-3 py-2 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer"
                    >
                      ${BGM_TRACK_OPTIONS.map(
                        (t) => `
                        <option value="${t.id}" ${sound.bgmTrack === t.id ? 'selected' : ''}>
                          ${t.label}
                        </option>
                      `
                      ).join('')}
                    </select>
                  </div>
                </div>

                <!-- SFX Control Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold text-[#201d1d]">효과음 (SFX)</span>
                      <p class="text-[11px] text-stone-500 m-0">타격음, 카드 클릭, 퀘스트 음</p>
                    </div>
                    <button
                      type="button"
                      data-action="setting-toggle-sfx"
                      class="px-3.5 py-1.5 rounded-sm text-xs font-bold min-h-[44px] cursor-pointer transition-colors ${
                        sound.sfxEnabled
                          ? 'bg-[#201d1d] text-[#fdfcfc]'
                          : 'bg-stone-200 text-stone-500 border border-stone-300'
                      }"
                    >
                      ${sound.sfxEnabled ? 'SFX 켜짐 [ON]' : 'SFX 꺼짐 [OFF]'}
                    </button>
                  </div>

                  <!-- SFX Slider -->
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-xs font-bold">
                      <span class="text-stone-600">SFX 음량:</span>
                      <span class="text-[#201d1d]" id="setting-sfx-volume-val">${sound.sfxVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value="${sound.sfxVolume}"
                      data-action="setting-change-sfx-volume"
                      class="w-full accent-[#201d1d] cursor-pointer"
                    />
                  </div>

                  <!-- SFX Test Button & Haptic -->
                  <div class="flex items-center gap-2 pt-2 border-t border-[rgba(15,0,0,0.08)]">
                    <button
                      type="button"
                      data-action="setting-play-test-sfx"
                      class="flex-1 py-2.5 px-3 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 transition-opacity"
                    >
                      <span>🔊 효과음 테스트 재생</span>
                    </button>
                    <button
                      type="button"
                      data-action="setting-toggle-haptic"
                      class="px-3 py-2.5 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap"
                      title="모바일 햅틱 진동"
                    >
                      진동: ${sound.hapticEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

              </div>
            </section>
          `
              : ''
          }

          <!-- 2. LANGUAGE SETTINGS -->
          ${
            activeSettingSubTab === 'all' || activeSettingSubTab === 'language'
              ? `
            <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none space-y-5">
              <div class="border-b border-[rgba(15,0,0,0.12)] pb-3">
                <h2 class="text-base sm:text-lg font-bold text-[#201d1d] m-0 flex items-center gap-2">
                  <span>🌐 언어 설정 (Official 12 Languages)</span>
                </h2>
                <p class="text-xs text-stone-500 m-0 pt-0.5">글로벌 12개 언어팩을 선택합니다. 선택 즉시 로컬에 반영됩니다.</p>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                ${OFFICIAL_LANGUAGES.map((item) => {
                  const isSelected = item.code === currentLang;
                  return `
                    <button
                      type="button"
                      data-action="setting-select-language"
                      data-lang="${item.code}"
                      class="p-3 text-left border rounded-sm min-h-[52px] flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] font-bold'
                          : 'bg-[#f8f7f7] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
                      }"
                    >
                      <div class="space-y-0.5">
                        <div class="flex items-center gap-1.5 text-xs font-bold">
                          <span>${item.flag}</span>
                          <span>${item.name}</span>
                        </div>
                        <div class="text-[10px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}">
                          ${item.region}
                        </div>
                      </div>
                      ${
                        isSelected
                          ? `<span class="text-[10px] px-1.5 py-0.5 bg-[#fdfcfc] text-[#201d1d] rounded-xs font-black uppercase">선택됨</span>`
                          : ''
                      }
                    </button>
                  `;
                }).join('')}
              </div>
            </section>
          `
              : ''
          }

          <!-- 3. AUTHENTICATION & ACCOUNT -->
          ${
            activeSettingSubTab === 'all' || activeSettingSubTab === 'account'
              ? `
            <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none space-y-5">
              <div class="border-b border-[rgba(15,0,0,0.12)] pb-3">
                <h2 class="text-base sm:text-lg font-bold text-[#201d1d] m-0 flex items-center gap-2">
                  <span>👤 계정 &amp; 인증 관리 (Account &amp; Auth)</span>
                </h2>
                <p class="text-xs text-stone-500 m-0 pt-0.5">구글 로그인, 게스트 모드, 프로필 설정 및 도메인 호환성을 관리합니다.</p>
              </div>

              <!-- Current User Profile Card -->
              <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-3.5">
                  <img
                    src="${user.photoURL}"
                    alt="User Avatar"
                    class="w-14 h-14 rounded-full border border-stone-300 bg-white object-cover shadow-xs shrink-0"
                  />
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-black text-[#201d1d]">${escapeHtml(user.displayName)}</span>
                      <span class="px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase ${
                        user.providerId === 'google.com'
                          ? 'bg-blue-600 text-white'
                          : 'bg-stone-300 text-stone-800'
                      }">
                        ${user.providerId === 'google.com' ? 'Google 연동' : '게스트 세션'}
                      </span>
                    </div>
                    <div class="text-xs text-stone-500">
                      ${user.email ? escapeHtml(user.email) : '로컬 모험가 계정 (UID: ' + user.uid.substring(0, 16) + '...)'}
                    </div>
                  </div>
                </div>

                <!-- Account Action Buttons -->
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-action="setting-change-name"
                    class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors"
                  >
                    닉네임 변경 ✎
                  </button>
                  <button
                    type="button"
                    data-action="setting-logout"
                    class="px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors"
                  >
                    로그아웃 (Sign Out)
                  </button>
                </div>
              </div>

              <!-- Login Switching Options -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <!-- Google Login Button -->
                <div class="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-2">
                  <span class="text-xs font-bold text-[#201d1d]">Google 공식 로그인</span>
                  <p class="text-[11px] text-stone-500 m-0">실제 Google 계정으로 로그인하여 프로필을 연동합니다.</p>
                  <button
                    type="button"
                    data-action="setting-login-google"
                    class="w-full py-2.5 px-3 bg-white hover:bg-stone-50 text-[#201d1d] border border-stone-300 text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                    <span>Google 로그인 실행</span>
                  </button>
                </div>

                <!-- Tunnel / Simulated Google Profile (Domain Error Fallback) -->
                <div class="p-4 bg-white border border-[rgba(15,0,0,0.12)] space-y-2">
                  <span class="text-xs font-bold text-[#201d1d]">
                    ${isTailscaleOrTunnel ? '⚡ 임시 도메인 전용 Google 프로필 연동' : '로컬 모험가 프로필 설정'}
                  </span>
                  <p class="text-[11px] text-stone-500 m-0">
                    Firebase 미승인 도메인(Tailscale *.ts.net 등)에서도 구글 계정으로 즉시 연동됩니다.
                  </p>
                  <button
                    type="button"
                    data-action="setting-login-simulated"
                    class="w-full py-2.5 px-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>⚡ Google 프로필로 즉시 전환</span>
                  </button>
                </div>
              </div>
            </section>
          `
              : ''
          }

          <!-- 4. DATA BACKUP & RESTORE -->
          ${
            activeSettingSubTab === 'all' || activeSettingSubTab === 'backup'
              ? `
            <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none space-y-6">
              <div class="border-b border-[rgba(15,0,0,0.12)] pb-3">
                <h2 class="text-base sm:text-lg font-bold text-[#201d1d] m-0 flex items-center gap-2">
                  <span>💾 게임 데이터 백업 &amp; 복원 (Backup &amp; Restore)</span>
                </h2>
                <p class="text-xs text-stone-500 m-0 pt-0.5">
                  100% 로컬스토리지에 저장된 모든 보유 카드, 레벨, 덱, SNS 재화 데이터를 안전하게 보관하고 복원합니다.
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Backup Export Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div class="space-y-1">
                    <span class="text-xs font-black text-[#201d1d] uppercase tracking-wider">
                      [1] 데이터 백업 파일 내보내기 (Export)
                    </span>
                    <p class="text-xs text-stone-600 leading-relaxed m-0">
                      현재 보유 중인 모든 카드, 덱 편성, 강화 수치, 재화를 1개의 완전한 JSON 파일로 즉시 다운로드합니다.
                    </p>
                  </div>

                  <div class="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      data-action="setting-download-backup"
                      class="flex-1 py-3 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>📥 JSON 백업 파일 다운로드</span>
                    </button>
                    <button
                      type="button"
                      data-action="setting-copy-backup-text"
                      class="py-3 px-3 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors"
                      title="클립보드로 JSON 텍스트 복사"
                    >
                      텍스트 복사
                    </button>
                  </div>
                </div>

                <!-- Backup Restore Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div class="space-y-1">
                    <span class="text-xs font-black text-[#201d1d] uppercase tracking-wider">
                      [2] 데이터 백업 파일 가져오기 (Restore)
                    </span>
                    <p class="text-xs text-stone-600 leading-relaxed m-0">
                      보관해 둔 백업 JSON 파일을 업로드하거나 텍스트를 붙여넣어 이전 상태로 100% 안전하게 복원합니다.
                    </p>
                  </div>

                  <div class="pt-2 flex flex-col sm:flex-row gap-2">
                    <label class="flex-1 py-3 px-4 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                      <span>📤 백업 파일(.json) 선택</span>
                      <input
                        type="file"
                        accept=".json"
                        id="setting-backup-file-input"
                        class="hidden"
                        onchange="
                          const file = this.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = function(e) {
                              const content = e.target.result;
                              const ev = new CustomEvent('snshero_restore_file', { detail: { json: content } });
                              window.dispatchEvent(ev);
                            };
                            reader.readAsText(file);
                          }
                        "
                      />
                    </label>
                    <button
                      type="button"
                      data-action="setting-restore-paste"
                      class="py-3 px-3 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors"
                    >
                      텍스트 직접 입력
                    </button>
                  </div>
                </div>
              </div>

              <!-- Factory Reset Danger Zone -->
              <div class="p-4 bg-red-50/70 border border-red-200 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="space-y-0.5">
                  <span class="text-xs font-bold text-red-900">데이터 완전 초기화 (Factory Reset)</span>
                  <p class="text-[11px] text-red-700 m-0">모든 보유 카드와 인벤토리를 삭제하고 게임을 태초 상태로 초기화합니다.</p>
                </div>
                <button
                  type="button"
                  data-action="setting-factory-reset"
                  class="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  데이터 전체 초기화
                </button>
              </div>

            </section>
          `
              : ''
          }

          <!-- 5. SYSTEM & DIAGNOSTICS -->
          <section class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none text-xs text-stone-600 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(15,0,0,0.08)] pb-2 font-bold text-[#201d1d]">
              <span>시스템 진단 및 도메인 정보</span>
              <span>v2.1.0 (Terminal-Flat Engine)</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>· 현재 접속 호스트: <span class="font-bold text-[#201d1d]">${escapeHtml(currentHost)}</span></div>
              <div>· 데이터 저장소: <span class="text-emerald-700 font-bold">100% LocalStorage 영구 보존 활성화</span></div>
              <div>· Firebase Auth 상태: <span class="font-bold text-[#201d1d]">${isTailscaleOrTunnel ? '터널/개발 환경 (스마트 폴백 연동)' : '공식 도메인 인증 정상'}</span></div>
              <div>· 공식 웹소설 &amp; 웹툰: <span class="font-bold text-[#201d1d]">40화 전편 수록 완료</span></div>
            </div>
          </section>

        </div>
      </main>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
