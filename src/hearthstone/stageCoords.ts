/**
 * Coordinate helper for the Responsive Scaled Stage (`#hs-stage-canvas`)
 * Ensures VFX particles, spell projectiles, and targeting arrows align with 0px offset
 * even when Mobile Landscape / Compact Viewport uniform scaling (`transform: scale(...)`)
 * or Letterboxing is active.
 */

export function getStageSize(): { width: number; height: number } {
  if (typeof document === 'undefined') {
    return { width: 1280, height: 840 };
  }
  const stage = document.getElementById('hs-stage-canvas');
  if (stage && stage.clientWidth > 0 && stage.clientHeight > 0) {
    return { width: stage.clientWidth, height: stage.clientHeight };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

export function clientToStagePoint(
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  if (typeof document === 'undefined') {
    return { x: clientX, y: clientY };
  }
  const stage = document.getElementById('hs-stage-canvas');
  if (!stage) {
    return { x: clientX, y: clientY };
  }
  const rect = stage.getBoundingClientRect();
  const stageW = stage.clientWidth || rect.width || window.innerWidth;
  const stageH = stage.clientHeight || rect.height || window.innerHeight;
  const scaleX = rect.width > 0 ? stageW / rect.width : 1;
  const scaleY = rect.height > 0 ? stageH / rect.height : 1;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

export function elementCenterInStage(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return clientToStagePoint(r.left + r.width / 2, r.top + r.height / 2);
}
