/**
 * BgmCrossfadeManager.ts - SCR-01-19
 * 씬 전환 시 이퀄 파워 볼륨 크로스페이드를 적용하는 무중단 60fps 오디오 매니저
 */

export class BgmCrossfadeManager {
  private currentAudio: HTMLAudioElement | null = null;
  private fadeInterval: number | null = null;

  public crossfadeTo(newAudioSrc: string, durationMs = 1000) {
    if (this.fadeInterval) clearInterval(this.fadeInterval);

    const nextAudio = new Audio(newAudioSrc);
    nextAudio.volume = 0;
    nextAudio.loop = true;
    nextAudio.play().catch(() => {});

    const steps = 20;
    const stepTime = durationMs / steps;
    let step = 0;

    this.fadeInterval = window.setInterval(() => {
      step++;
      const progress = step / steps;
      // Equal power curve
      const outVol = Math.cos(progress * 0.5 * Math.PI);
      const inVol = Math.sin(progress * 0.5 * Math.PI);

      if (this.currentAudio) {
        this.currentAudio.volume = Math.max(0, outVol);
      }
      nextAudio.volume = Math.min(1, inVol);

      if (step >= steps) {
        clearInterval(this.fadeInterval!);
        if (this.currentAudio) {
          this.currentAudio.pause();
        }
        this.currentAudio = nextAudio;
      }
    }, stepTime);
  }

  public stop() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}
