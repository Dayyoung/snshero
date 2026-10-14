/**
 * challengeCanvasGenerator.ts
 * 1200x630 HTML5 Canvas Tactical Dossier Generator (Zero-Emoji Compliance)
 */

export interface ChallengePayload {
  deckCode: string;
  commanderName: string;
  totalPwr: number;
  winRate: number;
  leadHeroName: string;
  leadHeroPwr: number;
  leadHeroClass: string;
  cardsCount?: number;
}

export function generateTacticalChallengeCanvas(payload: ChallengePayload): HTMLCanvasElement {
  const width = 1200;
  const height = 630;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Deep Space Tactical Dark Canvas Background (#090d16)
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // 2. Tactical Grid Lines Drawing
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Cybernetic Radial Ambience Glow
  const radialGlow = ctx.createRadialGradient(900, 315, 50, 900, 315, 450);
  radialGlow.addColorStop(0, 'rgba(6, 182, 212, 0.15)'); // Cyan core
  radialGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)'); // Emerald ring
  radialGlow.addColorStop(1, 'rgba(9, 13, 22, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 4. Outer Tactical Border (1px hairline + corner brackets)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // Corner bracket accents
  const bracketLen = 28;
  ctx.strokeStyle = '#06b6d4'; // Cyan
  ctx.lineWidth = 4;
  // Top-Left
  ctx.beginPath();
  ctx.moveTo(30, 30 + bracketLen);
  ctx.lineTo(30, 30);
  ctx.lineTo(30 + bracketLen, 30);
  ctx.stroke();
  // Top-Right
  ctx.beginPath();
  ctx.moveTo(width - 30 - bracketLen, 30);
  ctx.lineTo(width - 30, 30);
  ctx.lineTo(width - 30, 30 + bracketLen);
  ctx.stroke();
  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(30, height - 30 - bracketLen);
  ctx.lineTo(30, height - 30);
  ctx.lineTo(30 + bracketLen, height - 30);
  ctx.stroke();
  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(width - 30 - bracketLen, height - 30);
  ctx.lineTo(width - 30, height - 30);
  ctx.lineTo(width - 30, height - 30 - bracketLen);
  ctx.stroke();

  // 5. Header Section: Title & Classification
  ctx.fillStyle = '#06b6d4';
  ctx.font = '700 15px "Courier New", monospace';
  ctx.fillText('// SNSHERO TACTICAL DOSSIER // CLASSIFIED COMBAT CHALLENGE', 65, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 46px "Courier New", monospace';
  ctx.fillText('TACTICAL DECK CHALLENGE', 65, 136);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '400 16px "Courier New", monospace';
  ctx.fillText('INSTANT 1-CLICK WEB COMBAT SIMULATION // NO INSTALL REQUIRED', 65, 168);

  // Divider Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(65, 195);
  ctx.lineTo(width - 65, 195);
  ctx.stroke();

  // 6. Left Column: Deck & Commander Metrics
  // Commander Box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.fillRect(65, 225, 480, 110);
  ctx.strokeRect(65, 225, 480, 110);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Courier New", monospace';
  ctx.fillText('CHALLENGER COMMANDER', 85, 255);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 28px "Courier New", monospace';
  ctx.fillText(payload.commanderName.toUpperCase(), 85, 292);

  ctx.fillStyle = '#10b981'; // Emerald
  ctx.font = '700 13px "Courier New", monospace';
  ctx.fillText(`STATUS: ONLINE // DECK READY (${payload.cardsCount || 5} UNITS)`, 85, 318);

  // Deck Stats Box (PWR & Winrate)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(65, 355, 480, 120);
  ctx.strokeRect(65, 355, 480, 120);

  // Total Combat PWR
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Courier New", monospace';
  ctx.fillText('TOTAL COMBAT PWR', 85, 385);

  ctx.fillStyle = '#f59e0b'; // Amber Gold
  ctx.font = '900 36px "Courier New", monospace';
  ctx.fillText(payload.totalPwr.toLocaleString(), 85, 428);

  // Winrate
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Courier New", monospace';
  ctx.fillText('RECORDED WINRATE', 320, 385);

  ctx.fillStyle = '#06b6d4'; // Cyan
  ctx.font = '900 36px "Courier New", monospace';
  ctx.fillText(`${payload.winRate}%`, 320, 428);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '400 11px "Courier New", monospace';
  ctx.fillText('SIMULATION TESTED ACROSS ALL COMBAT LEAGUES', 85, 458);

  // 7. Right Column: Lead Hero Silhouette & Hologram Blueprint
  const rightX = 580;
  const rightW = width - 65 - rightX;
  ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
  ctx.lineWidth = 1;
  ctx.fillRect(rightX, 225, rightW, 250);
  ctx.strokeRect(rightX, 225, rightW, 250);

  // Header of Lead Hero
  ctx.fillStyle = '#06b6d4';
  ctx.font = '700 13px "Courier New", monospace';
  ctx.fillText('FLAGSHIP UNIT PROFILE // BLUEPRINT', rightX + 24, 255);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px "Courier New", monospace';
  ctx.fillText(payload.leadHeroName.toUpperCase(), rightX + 24, 295);

  // Lead Unit Stats
  ctx.fillStyle = '#f59e0b';
  ctx.font = '800 20px "Courier New", monospace';
  ctx.fillText(`PWR ${payload.leadHeroPwr.toLocaleString()}`, rightX + 24, 330);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px "Courier New", monospace';
  ctx.fillText(`CLASS: ${payload.leadHeroClass.toUpperCase()}`, rightX + 24, 360);
  ctx.fillText('SPECIAL: QUANTUM COUNTER-STRIKE', rightX + 24, 385);

  // Target Crosshair Graphic (Pure Canvas Vectors)
  const crosshairCenterX = rightX + rightW - 100;
  const crosshairCenterY = 350;
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(crosshairCenterX, crosshairCenterY, 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(crosshairCenterX, crosshairCenterY, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red center dot
  ctx.beginPath();
  ctx.arc(crosshairCenterX, crosshairCenterY, 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.beginPath();
  ctx.moveTo(crosshairCenterX - 65, crosshairCenterY);
  ctx.lineTo(crosshairCenterX + 65, crosshairCenterY);
  ctx.moveTo(crosshairCenterX, crosshairCenterY - 65);
  ctx.lineTo(crosshairCenterX, crosshairCenterY + 65);
  ctx.stroke();

  ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
  ctx.font = '600 10px "Courier New", monospace';
  ctx.fillText('TARGET LOCK', crosshairCenterX - 35, crosshairCenterY + 70);

  // 8. Bottom Deck Code Terminal Banner
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.fillRect(65, 495, width - 130, 80);
  ctx.strokeRect(65, 495, width - 130, 80);

  ctx.fillStyle = '#10b981';
  ctx.font = '700 13px "Courier New", monospace';
  ctx.fillText('> AUTHENTICATED DECK ENCRYPTION KEY:', 85, 525);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 24px "Courier New", monospace';
  ctx.fillText(payload.deckCode, 85, 558);

  // Watermark URL on bottom right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '700 14px "Courier New", monospace';
  const urlText = 'https://snshero.com';
  const textWidth = ctx.measureText(urlText).width;
  ctx.fillText(urlText, width - 85 - textWidth, 545);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.font = '400 11px "Courier New", monospace';
  const subText = 'TACTICAL PVP ARENA';
  const subWidth = ctx.measureText(subText).width;
  ctx.fillText(subText, width - 85 - subWidth, 563);

  return canvas;
}

export async function generateTacticalChallengeDataUrl(payload: ChallengePayload): Promise<string> {
  const canvas = generateTacticalChallengeCanvas(payload);
  return canvas.toDataURL('image/png');
}

export async function downloadTacticalChallengeImage(payload: ChallengePayload, filename = 'snshero-tactical-challenge.png'): Promise<void> {
  const dataUrl = await generateTacticalChallengeDataUrl(payload);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function copyChallengeToClipboard(payload: ChallengePayload): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.clipboard) return false;

  const challengeUrl = `https://snshero.com/?challenge=${encodeURIComponent(payload.deckCode)}`;
  const shareText = `[SNSHero Tactical Challenge]\nCommander ${payload.commanderName} has issued a combat challenge with Deck [${payload.deckCode}] (PWR: ${payload.totalPwr.toLocaleString()} / WinRate: ${payload.winRate}%).\nClick to engage 1-click instant simulation:\n${challengeUrl}`;

  try {
    await navigator.clipboard.writeText(shareText);
    return true;
  } catch {
    return false;
  }
}

export async function shareChallengeViaWebShare(payload: ChallengePayload): Promise<boolean> {
  const challengeUrl = `https://snshero.com/?challenge=${encodeURIComponent(payload.deckCode)}`;
  const shareTitle = `SNSHero Tactical Deck Challenge: ${payload.commanderName}`;
  const shareText = `[SNSHero Tactical Challenge] Commander ${payload.commanderName} has issued a combat challenge with Deck [${payload.deckCode}] (PWR: ${payload.totalPwr.toLocaleString()})! Click to engage 1-click instant simulation: ${challengeUrl}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: challengeUrl,
      });
      return true;
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === 'AbortError') {
        return true;
      }
    }
  }
  return copyChallengeToClipboard(payload);
}

