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
 *   1. Sound (BGM / SFX on-off, live volume sliders, track selector, instant Web Audio test sfx)
 *   2. Language (12 official languages: ko, en, ja, zh-CN, zh-TW, de, es, fr, id, ru, th, vi)
 *   3. Authentication & Account (Google Sign-In, Domain Fallback, Guest mode, Logout, Rename)
 *   4. Backup & Restore (JSON Export download, JSON File Import restore, Text copy, Reset)
 *   5. System & Domain Diagnostics
 */

import { getCurrentUser, loginWithGoogle, loginAsGuest, loginWithSimulatedGoogle, logoutUser, LandingUser } from '../services/authService';
import { audioManager, AudioSettings } from '../services/audioManager';
import { t, tr, getCurrentLanguage, setCurrentLanguage, SupportedLanguage } from '../services/i18n';

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
  { id: 'title', labelKey: 'bgm_track_title', defaultLabel: '타이틀 테마 (Hero Awakening)' },
  { id: 'lobby', labelKey: 'bgm_track_lobby', defaultLabel: '영지 로비 (Sanctuary of Kadan)' },
  { id: 'battle', labelKey: 'bgm_track_battle', defaultLabel: '투기장 결투 (Colosseum Battle)' },
  { id: 'peace', labelKey: 'bgm_track_peace', defaultLabel: '바람 속삭임 (Whispering Wind)' },
] as const;

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
    return {
      success: false,
      restoredCount: 0,
      message: tr('로컬스토리지를 지원하지 않는 브라우저입니다.', 'Browser does not support LocalStorage.', 'ローカルストレージをサポートしていないブラウザです。'),
    };
  }

  try {
    const parsed = JSON.parse(jsonText);
    const dataObj = parsed.data || parsed;
    if (!dataObj || typeof dataObj !== 'object') {
      return {
        success: false,
        restoredCount: 0,
        message: tr('유효한 백업 데이터 형식이 아닙니다.', 'Invalid backup data format.', '有効なバックアップデータ形式ではありません。'),
      };
    }

    let count = 0;
    for (const [key, val] of Object.entries(dataObj)) {
      if (typeof key === 'string' && key.startsWith('hero_') && typeof val === 'string') {
        localStorage.setItem(key, val);
        count++;
      }
    }

    if (count === 0) {
      return {
        success: false,
        restoredCount: 0,
        message: tr(
          '복원 가능한 게임 데이터(hero_*)가 발견되지 않았습니다.',
          'No restorable game data (hero_*) found.',
          '復元可能なゲームデータ(hero_*)が見つかりませんでした。'
        ),
      };
    }

    // Trigger update events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snshero_auth_changed'));
      window.dispatchEvent(new Event('snshero_deck_updated'));
      window.dispatchEvent(new Event('snshero_card_nurture_updated'));
      window.dispatchEvent(new Event('snshero_language_changed'));
    }

    return {
      success: true,
      restoredCount: count,
      message: tr(
        `성공적으로 ${count}개의 게임 데이터 키를 복원하였습니다.`,
        `Successfully restored ${count} game data keys.`,
        `${count}個のゲームデータキーを正常に復元しました。`
      ),
    };
  } catch (e: any) {
    return {
      success: false,
      restoredCount: 0,
      message:
        tr('JSON 파싱 오류: ', 'JSON parse error: ', 'JSONパースエラー: ') +
        (e?.message || tr('파일이 손상되었습니다.', 'File is corrupted.', 'ファイルが破損しています。')),
    };
  }
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
    audioManager.toggleBgm();
  } else if (action === 'setting-change-bgm-volume') {
    const input = target as HTMLInputElement;
    if (input && input.value !== undefined) {
      audioManager.setBgmVolume(Number(input.value));
    }
  } else if (action === 'setting-change-bgm-track') {
    const select = target as HTMLSelectElement;
    if (select && select.value) {
      audioManager.setBgmTrack(select.value);
    }
  } else if (action === 'setting-toggle-sfx') {
    audioManager.toggleSfx();
  } else if (action === 'setting-change-sfx-volume') {
    const input = target as HTMLInputElement;
    if (input && input.value !== undefined) {
      audioManager.setSfxVolume(Number(input.value));
    }
  } else if (action === 'setting-play-test-sfx') {
    audioManager.playTestChime();
  } else if (action === 'setting-toggle-haptic') {
    audioManager.toggleHaptic();
  }
  // ── Language Action ──────────────────────────────────────────────────────
  else if (action === 'setting-select-language') {
    const lang = target?.getAttribute('data-lang');
    if (lang) {
      setCurrentLanguage(lang);
      audioManager.playClickTick();
      backupNoticeMessage = t('selected') + ': ' + lang;
    }
  }
  // ── Account / Login Actions ──────────────────────────────────────────────
  else if (action === 'setting-login-google') {
    loginWithGoogle().then((res) => {
      if (res.success) {
        backupNoticeMessage = tr(
          'Google 계정으로 성공적으로 로그인되었습니다.',
          'Successfully signed in with Google account.',
          'Googleアカウントで正常にログインしました。'
        );
      } else if (res.isDomainUnauthorized) {
        // Domain unauthorized: prompt fallback
        const ok = confirm(
          tr(
            `[Firebase 안내]\n현재 접속 도메인(${window.location.hostname})이 Firebase 승인 도메인에 미등록된 임시/터널 도메인입니다.\n\n안전한 '로컬 Google 프로필'로 즉시 연동하여 게임을 시작하시겠습니까?`,
            `[Firebase Notice]\nCurrent domain (${window.location.hostname}) is a temporary/tunnel domain not registered in Firebase Authorized Domains.\n\nWould you like to link with a safe 'Local Google Profile' immediately?`,
            `[Firebase 案内]\n現在接続中のドメイン(${window.location.hostname})はFirebase承認済みドメインに未登録の一時/トンネルドメインです。\n\n安全な「ローカルGoogleプロフィール」で即座に連携してゲームを開始しますか？`
          )
        );
        if (ok) {
          loginWithSimulatedGoogle('Google Adventurer', 'adventurer@gmail.com');
          backupNoticeMessage = tr(
            '로컬 Google 프로필로 연동되었습니다.',
            'Linked with Local Google Profile.',
            'ローカルGoogleプロフィールで連携されました。'
          );
        }
      } else if (!res.isCancelled && res.error) {
        alert(res.error);
      }
    });
  } else if (action === 'setting-login-simulated') {
    const name = prompt(
      tr(
        '사용하실 구글 프로필 이름을 입력하세요:',
        'Enter your Google profile display name:',
        '使用するGoogleプロフィール名を入力してください:'
      ),
      'Google Adventurer'
    );
    if (name) {
      loginWithSimulatedGoogle(name);
      backupNoticeMessage = tr(
        `Google 프로필 '${name}'으로 로컬 연동되었습니다.`,
        `Linked locally with Google Profile '${name}'.`,
        `Googleプロフィール「${name}」でローカル連携されました。`
      );
    }
  } else if (action === 'setting-login-guest') {
    loginAsGuest();
    backupNoticeMessage = tr(
      '게스트 모험가 계정으로 전환되었습니다.',
      'Switched to Guest Adventurer account.',
      'ゲスト冒険者アカウントに切り替えました。'
    );
  } else if (action === 'setting-change-name') {
    const current = getCurrentUser();
    const newName = prompt(
      tr('변경할 닉네임을 입력하세요:', 'Enter new nickname:', '変更するニックネームを入力してください:'),
      current.displayName
    );
    if (newName && newName.trim()) {
      loginAsGuest(newName.trim());
      backupNoticeMessage = tr(
        `닉네임이 '${newName.trim()}'(으)로 변경되었습니다.`,
        `Nickname changed to '${newName.trim()}'.`,
        `ニックネームが「${newName.trim()}」に変更されました。`
      );
    }
  } else if (action === 'setting-logout') {
    const ok = confirm(
      tr('정말 로그아웃 하시겠습니까?', 'Are you sure you want to log out?', '本当にログアウトしますか？')
    );
    if (ok) {
      logoutUser();
      backupNoticeMessage = tr(
        '로그아웃되어 기본 게스트 세션으로 전환되었습니다.',
        'Logged out and switched to default guest session.',
        'ログアウトし、デフォルトのゲストセッションに切り替えました。'
      );
    }
  }
  // ── Backup Actions ───────────────────────────────────────────────────────
  else if (action === 'setting-download-backup') {
    triggerDownloadBackupFile();
    backupNoticeMessage = tr(
      '전체 게임 데이터 백업 JSON 파일이 다운로드되었습니다.',
      'Full game data backup JSON file downloaded.',
      '全ゲームデータのバックアップJSONファイルがダウンロードされました。'
    );
  } else if (action === 'setting-copy-backup-text') {
    const { jsonString } = exportBackupData();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(jsonString).then(() => {
        alert(
          tr(
            '백업 데이터 JSON이 클립보드에 복사되었습니다.',
            'Backup JSON copied to clipboard.',
            'バックアップデータJSONがクリップボードにコピーされました。'
          )
        );
      });
    }
  } else if (action === 'setting-restore-paste') {
    const pasted = prompt(
      tr(
        '복원할 백업 JSON 텍스트를 붙여넣어 주세요:',
        'Paste your backup JSON text to restore:',
        '復元するバックアップJSONテキストを貼り付けてください:'
      )
    );
    if (pasted && pasted.trim()) {
      const res = restoreBackupJson(pasted.trim());
      alert(res.message);
      if (res.success) {
        backupNoticeMessage = res.message;
      }
    }
  } else if (action === 'setting-factory-reset') {
    const resetKeyword = tr('초기화', 'RESET', '初期化');
    const confirmText = prompt(
      tr(
        "경고: 모든 카드, 덱, 재화, 진행도가 완전히 초기화됩니다!\n정말 초기화하려면 '초기화'를 입력하세요:",
        "WARNING: All cards, decks, currency, and progress will be wiped!\nType 'RESET' to confirm:",
        '警告: すべてのカード、デッキ、通貨、進行状況が完全に初期化されます！\n本当に初期化する場合は「初期化」と入力してください:'
      )
    );
    if (confirmText === resetKeyword || confirmText === '초기화' || confirmText === 'RESET') {
      const preserveLang = localStorage.getItem('hero_language') || 'ko';
      localStorage.clear();
      localStorage.setItem('hero_language', preserveLang);
      alert(
        tr(
          '모든 로컬 게임 데이터가 초기화되었습니다. 페이지를 새로고침합니다.',
          'All local game data has been reset. Reloading page.',
          'すべてのローカルゲームデータが初期化されました。ページを再読み込みします。'
        )
      );
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }
}

export function renderSettingSection(): string {
  const sound = audioManager.getSettings();
  const currentLang = getCurrentLanguage();
  const user = getCurrentUser();

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'snshero.com';
  const isTailscaleOrTunnel =
    currentHost.includes('ts.net') ||
    currentHost.includes('ngrok') ||
    currentHost.includes('loca.lt') ||
    currentHost === 'localhost' ||
    currentHost === '127.0.0.1';

  return `
    <div id="setting-section-root" class="w-full bg-[#fdfcfc] text-[#201d1d] font-mono select-none">
      
      <!-- Setting View Header -->
      <section class="border-b border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] py-6 px-4 sm:px-6 md:px-8">
        <div class="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 bg-[#201d1d]"></span>
              <h1 class="text-xl sm:text-2xl font-black text-[#201d1d] tracking-tight m-0">
                ${t('setting_title')}
              </h1>
              <span class="text-xs px-2 py-0.5 bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] rounded-sm font-bold text-[#646262]">
                Terminal-Flat
              </span>
            </div>
            <p class="text-xs sm:text-sm text-stone-600 m-0">
              ${t('setting_desc')}
            </p>
          </div>

          <!-- Navigation Shortcuts -->
          <div class="flex items-center gap-2 self-start md:self-auto">
            <a
              href="#home"
              data-nav="home"
              class="px-3 py-2 bg-[#f8f7f7] hover:bg-[#edeaea] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center no-underline"
            >
              ← ${t('nav_home')}
            </a>
            <a
              href="#play"
              data-nav="play"
              class="px-4 py-2 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] inline-flex items-center justify-center no-underline"
            >
              ${t('btn_game_start')}
            </a>
          </div>
        </div>
      </section>

      <!-- Sub-Tab Navigation Bar -->
      <nav class="border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] sticky top-14 md:top-16 z-20 px-4 sm:px-6 md:px-8" aria-label="${tr('환경설정 하위 메뉴', 'Settings Sub-Menu', '環境設定サブメニュー')}">
        <div class="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none min-h-[48px]">
          ${[
            { key: 'all', label: t('tab_all') },
            { key: 'sound', label: t('tab_sound') },
            { key: 'language', label: t('tab_language') },
            { key: 'account', label: t('tab_account') },
            { key: 'backup', label: t('tab_backup') },
          ]
            .map((tab) => {
              const isActive = activeSettingSubTab === tab.key;
              return `
                <button
                  type="button"
                  data-action="setting-tab-${tab.key}"
                  class="px-3.5 py-1.5 text-xs font-bold rounded-sm whitespace-nowrap min-h-[44px] flex items-center justify-center transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#201d1d] text-[#fdfcfc]'
                      : 'bg-[#fdfcfc] text-[#646262] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea] hover:text-[#201d1d]'
                  }"
                >
                  ${tab.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </nav>

      <!-- Setting Main Container -->
      <main class="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <div class="space-y-8">

          <!-- Notice Banner -->
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
                    <span>${t('sound_title')}</span>
                  </h2>
                  <p class="text-xs text-stone-500 m-0 pt-0.5">${t('sound_desc')}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <!-- BGM Control Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold text-[#201d1d]">${t('bgm_label')}</span>
                      <p class="text-[11px] text-stone-500 m-0">${t('bgm_desc')}</p>
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
                      ${sound.bgmEnabled ? t('bgm_on') : t('bgm_off')}
                    </button>
                  </div>

                  <!-- Volume Slider -->
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-xs font-bold">
                      <span class="text-stone-600">${t('bgm_vol')}</span>
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
                    <label class="text-xs font-bold text-stone-600">${t('bgm_preset')}</label>
                    <select
                      data-action="setting-change-bgm-track"
                      class="w-full px-3 py-2 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer"
                    >
                      ${BGM_TRACK_OPTIONS.map(
                        (tr) => `
                        <option value="${tr.id}" ${sound.bgmTrack === tr.id ? 'selected' : ''}>
                          ${t(tr.labelKey, tr.defaultLabel)}
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
                      <span class="text-xs font-bold text-[#201d1d]">${t('sfx_label')}</span>
                      <p class="text-[11px] text-stone-500 m-0">${t('sfx_desc')}</p>
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
                      ${sound.sfxEnabled ? t('sfx_on') : t('sfx_off')}
                    </button>
                  </div>

                  <!-- SFX Slider -->
                  <div class="space-y-1.5">
                    <div class="flex justify-between text-xs font-bold">
                      <span class="text-stone-600">${t('sfx_vol')}</span>
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
                      <span>${t('sfx_test')}</span>
                    </button>
                    <button
                      type="button"
                      data-action="setting-toggle-haptic"
                      class="px-3 py-2.5 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer whitespace-nowrap"
                      title="${tr('모바일 햅틱 진동', 'Mobile Haptic Vibration', 'モバイル振動フィードバック')}"
                    >
                      ${t('haptic_label')} ${sound.hapticEnabled ? 'ON' : 'OFF'}
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
            <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 rounded-none space-y-4">
              <div class="border-b border-[rgba(15,0,0,0.12)] pb-3">
                <h2 class="text-base sm:text-lg font-bold text-[#201d1d] m-0 flex items-center gap-2">
                  <span>${t('lang_title')}</span>
                </h2>
                <p class="text-xs text-stone-500 m-0 pt-0.5">${t('lang_desc')}</p>
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
                          ? `<span class="text-[10px] px-1.5 py-0.5 bg-[#fdfcfc] text-[#201d1d] rounded-xs font-black uppercase">${t('selected')}</span>`
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
                  <span>${t('account_title')}</span>
                </h2>
                <p class="text-xs text-stone-500 m-0 pt-0.5">${t('account_desc')}</p>
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
                        ${user.providerId === 'google.com' ? t('google_badge') : t('guest_badge')}
                      </span>
                    </div>
                    <div class="text-xs text-stone-500">
                      ${
                        user.email
                          ? escapeHtml(user.email)
                          : `${tr('로컬 모험가 계정', 'Local Adventurer Account', 'ローカル冒険者アカウント')} (UID: ${user.uid.substring(0, 16)}...)`
                      }
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
                    ${t('rename_btn')}
                  </button>
                  <button
                    type="button"
                    data-action="setting-logout"
                    class="px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors"
                  >
                    ${t('logout_btn')}
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
                  <span>${t('backup_title')}</span>
                </h2>
                <p class="text-xs text-stone-500 m-0 pt-0.5">
                  ${t('backup_desc')}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Backup Export Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div class="space-y-1">
                    <span class="text-xs font-black text-[#201d1d] uppercase tracking-wider">
                      ${t('backup_export_title')}
                    </span>
                    <p class="text-xs text-stone-600 leading-relaxed m-0">
                      ${t('backup_export_desc')}
                    </p>
                  </div>

                  <div class="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      data-action="setting-download-backup"
                      class="flex-1 py-3 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800 text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <span>${t('backup_export_btn')}</span>
                    </button>
                    <button
                      type="button"
                      data-action="setting-copy-backup-text"
                      class="py-3 px-3 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors"
                      title="${tr('클립보드로 JSON 텍스트 복사', 'Copy JSON text to clipboard', 'クリップボードにJSONテキストをコピー')}"
                    >
                      ${t('backup_copy_btn')}
                    </button>
                  </div>
                </div>

                <!-- Backup Restore Box -->
                <div class="p-5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] space-y-3">
                  <div class="space-y-1">
                    <span class="text-xs font-black text-[#201d1d] uppercase tracking-wider">
                      ${t('backup_import_title')}
                    </span>
                    <p class="text-xs text-stone-600 leading-relaxed m-0">
                      ${t('backup_import_desc')}
                    </p>
                  </div>

                  <div class="pt-2 flex flex-col sm:flex-row gap-2">
                    <label class="flex-1 py-3 px-4 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
                      <span>${t('backup_file_btn')}</span>
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
                      ${t('backup_paste_btn')}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Factory Reset Danger Zone -->
              <div class="p-4 bg-red-50/70 border border-red-200 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="space-y-0.5">
                  <span class="text-xs font-bold text-red-900">${t('factory_reset_title')}</span>
                  <p class="text-[11px] text-red-700 m-0">${t('factory_reset_desc')}</p>
                </div>
                <button
                  type="button"
                  data-action="setting-factory-reset"
                  class="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-sm min-h-[44px] cursor-pointer transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  ${t('factory_reset_btn')}
                </button>
              </div>

            </section>
          `
              : ''
          }

          <!-- 5. SYSTEM & DIAGNOSTICS -->
          <section class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none text-xs text-stone-600 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(15,0,0,0.08)] pb-2 font-bold text-[#201d1d]">
              <span>${t('system_title')}</span>
              <span>${t('system_engine')}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>${t('system_host')} <span class="font-bold text-[#201d1d]">${escapeHtml(currentHost)}</span></div>
              <div>${t('system_storage')}</div>
              <div>· Firebase Auth: <span class="font-bold text-[#201d1d]">${isTailscaleOrTunnel ? t('system_auth_tunnel') : t('system_auth_ok')}</span></div>
              <div>${t('system_content')}</div>
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
