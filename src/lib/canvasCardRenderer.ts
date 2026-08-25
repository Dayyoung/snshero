import { getCardSpriteCoords, getAssetUrl } from './utils';

// Image element cache to avoid re-instantiating Images on every 60fps frame
const imageCache: Record<string, HTMLImageElement> = {};

/**
 * Preloads or retrieves an image element from cache.
 */
export function getOrLoadSpriteImage(url: string = '/cards1.png'): HTMLImageElement {
  const assetUrl = getAssetUrl(url);
  if (!imageCache[assetUrl]) {
    const img = new Image();
    img.src = assetUrl;
    imageCache[assetUrl] = img;
  }
  return imageCache[assetUrl];
}

// Preload standard sprite sheets in browser environments
if (typeof window !== 'undefined') {
  getOrLoadSpriteImage('/cards1.png');
  getOrLoadSpriteImage('/cards2.png');
  getOrLoadSpriteImage('/card100.png');
}

export interface DrawCardSpriteOptions {
  customSource?: string | null;
  flipH?: boolean;
  rotation?: number; // radians
  alpha?: number;
  shadowBlur?: number;
  shadowColor?: string;
  circleClip?: boolean;
  roundedRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

/**
 * Draws a card character sprite from cards1.png (IDs 1-100) or cards2.png (IDs 101-200)
 * directly onto any HTML Canvas 2D context.
 *
 * @param ctx Target CanvasRenderingContext2D
 * @param cardId ID of the card character (1 ~ 200)
 * @param dx Destination X on canvas
 * @param dy Destination Y on canvas
 * @param dWidth Destination Width
 * @param dHeight Destination Height
 * @param options Styling options (circleClip, shadowBlur, flipH, rotation, etc.)
 */
export function drawCardSprite(
  ctx: CanvasRenderingContext2D,
  cardId: number = 1,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  options?: DrawCardSpriteOptions
): boolean {
  const id = Number(cardId) || 1;
  const coords = getCardSpriteCoords(id, options?.customSource);
  const img = getOrLoadSpriteImage(coords.source);

  if (!img || !img.complete || img.naturalWidth === 0) {
    // If image is still loading, draw fallback styled badge
    ctx.save();
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    if (options?.circleClip) {
      ctx.arc(dx + dWidth / 2, dy + dHeight / 2, Math.min(dWidth, dHeight) / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(dx, dy, dWidth, dHeight);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(10, Math.floor(dHeight * 0.4))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`C${id}`, dx + dWidth / 2, dy + dHeight / 2);
    ctx.restore();
    return false;
  }

  const sWidth = img.naturalWidth / coords.cols;
  const sHeight = img.naturalHeight / coords.rows;
  const sx = coords.col * sWidth;
  const sy = coords.row * sHeight;

  ctx.save();

  if (options?.alpha !== undefined) {
    ctx.globalAlpha = Math.max(0, Math.min(1, options.alpha));
  }

  if (options?.shadowBlur) {
    ctx.shadowBlur = options.shadowBlur;
    ctx.shadowColor = options.shadowColor || 'rgba(0, 0, 0, 0.6)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  }

  const centerX = dx + dWidth / 2;
  const centerY = dy + dHeight / 2;

  ctx.translate(centerX, centerY);

  if (options?.rotation) {
    ctx.rotate(options.rotation);
  }

  if (options?.flipH) {
    ctx.scale(-1, 1);
  }

  const drawX = -dWidth / 2;
  const drawY = -dHeight / 2;

  if (options?.circleClip) {
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(dWidth, dHeight) / 2, 0, Math.PI * 2);
    ctx.clip();
  } else if (options?.roundedRadius) {
    const r = options.roundedRadius;
    ctx.beginPath();
    ctx.moveTo(drawX + r, drawY);
    ctx.lineTo(drawX + dWidth - r, drawY);
    ctx.quadraticCurveTo(drawX + dWidth, drawY, drawX + dWidth, drawY + r);
    ctx.lineTo(drawX + dWidth, drawY + dHeight - r);
    ctx.quadraticCurveTo(drawX + dWidth, drawY + dHeight, drawX + dWidth - r, drawY + dHeight);
    ctx.lineTo(drawX + r, drawY + dHeight);
    ctx.quadraticCurveTo(drawX, drawY + dHeight, drawX, drawY + dHeight - r);
    ctx.lineTo(drawX, drawY + r);
    ctx.quadraticCurveTo(drawX, drawY, drawX + r, drawY);
    ctx.closePath();
    ctx.clip();
  }

  // Draw the sliced sprite sub-image
  ctx.drawImage(img, sx, sy, sWidth, sHeight, drawX, drawY, dWidth, dHeight);

  // Optional Border
  if (options?.borderWidth && options?.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.stroke();
  }

  ctx.restore();
  return true;
}
