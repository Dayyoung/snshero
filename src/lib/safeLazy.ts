import React, { lazy } from 'react';

/**
 * Robust wrapper around React.lazy() that handles Vite dynamic import chunk errors,
 * network hiccups, and stale cache issues with automatic retries and fail-safe recovery.
 */
export function safeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<any>,
  exportName?: string
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const m = await importFn();
        
        let resolvedComponent: T;
        if (exportName && m && m[exportName]) {
          resolvedComponent = m[exportName];
        } else if (m && m.default) {
          resolvedComponent = m.default;
        } else if (m) {
          // Fallback to first exported React component
          const exportedValues = Object.values(m);
          const found = exportedValues.find(val => typeof val === 'function' || (typeof val === 'object' && val !== null));
          resolvedComponent = (found as T) || (m as unknown as T);
        } else {
          resolvedComponent = m;
        }

        return { default: resolvedComponent };
      } catch (err: any) {
        attempt++;
        const errMsg = err?.message || String(err);
        const isModuleImportError =
          errMsg.includes('Importing a module script failed') ||
          errMsg.includes('Failed to fetch dynamically imported module') ||
          errMsg.includes('Loading chunk') ||
          errMsg.includes('error loading dynamically imported module');

        console.warn(`[safeLazy] Dynamic import attempt ${attempt} failed: ${errMsg}`);

        if (attempt <= maxRetries && isModuleImportError) {
          // Wait before retry
          await new Promise((r) => setTimeout(r, 400 * attempt));
        } else {
          // If all retries fail due to a stale bundle hash, attempt one automatic window reload
          if (typeof window !== 'undefined' && window.sessionStorage && isModuleImportError) {
            const alreadyReloaded = window.sessionStorage.getItem('hero_lazy_import_retry');
            if (!alreadyReloaded) {
              window.sessionStorage.setItem('hero_lazy_import_retry', 'true');
              console.warn('[safeLazy] Stale chunk detected after retries. Reloading page for fresh assets...');
              window.location.reload();
              return new Promise<never>(() => {});
            }
          }
          throw err;
        }
      }
    }

    throw new Error('safeLazy: Exhausted retries without resolving component');
  });
}
