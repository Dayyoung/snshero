/**
 * PerformanceDiagnosticLogger.ts - SCR-12-19
 * 기기 병목 진단 리포트 생성 및 비동기 전송 파이프라인
 */

export interface DiagnosticReport {
  timestamp: number;
  userAgent: string;
  hardwareConcurrency: number;
  screenResolution: string;
  estimatedMemoryMB: number;
  canvasSupported: boolean;
  webglSupported: boolean;
}

export class PerformanceDiagnosticLogger {
  public static generateReport(): DiagnosticReport {
    const perf = typeof performance !== 'undefined' ? (performance as unknown as { memory?: { jsHeapSizeLimit: number } }) : {};
    const hasCanvas = typeof document !== 'undefined' && !!document.createElement('canvas');
    let hasWebGL = false;

    if (hasCanvas) {
      try {
        const c = document.createElement('canvas');
        hasWebGL = !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
      } catch {
        hasWebGL = false;
      }
    }

    return {
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
      screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '360x640',
      estimatedMemoryMB: perf.memory ? Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024)) : 512,
      canvasSupported: hasCanvas,
      webglSupported: hasWebGL,
    };
  }

  public static async sendReportAsync(report: DiagnosticReport): Promise<boolean> {
    try {
      localStorage.setItem('hero_last_diagnostic_report', JSON.stringify(report));
      return true;
    } catch {
      return false;
    }
  }
}
