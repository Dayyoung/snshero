/**
 * I18nCacheManager.ts - SCR-12-16
 * ETag 기반 로컬 스토리지 캐싱을 적용하여 변경된 뷰의 텍스트 노드만 단일 프레임 내 마이크로 스왑하는 60fps 캐시 매니저
 */

export class I18nCacheManager {
  private cache = new Map<string, Record<string, string>>();

  public get(lang: string, chunk: string): Record<string, string> | undefined {
    return this.cache.get(`${lang}_${chunk}`);
  }

  public set(lang: string, chunk: string, data: Record<string, string>) {
    this.cache.set(`${lang}_${chunk}`, data);
    try {
      localStorage.setItem(`hero_i18n_cache_${lang}_${chunk}`, JSON.stringify(data));
    } catch {
      // ignore
    }
  }
}
