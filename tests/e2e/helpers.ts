import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import {
  TestResult,
  MilestoneType,
} from './types';

// Resolve project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const REPO_ROOT = path.resolve(__dirname, '../../');

/**
 * Read file relative to project root. Returns null if file does not exist.
 */
export function readProjectFile(relPath: string): string | null {
  const fullPath = path.resolve(REPO_ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Check if file or directory exists relative to project root.
 */
export function projectPathExists(relPath: string): boolean {
  const fullPath = path.resolve(REPO_ROOT, relPath);
  return fs.existsSync(fullPath);
}

/**
 * Parse HTML string into Cheerio DOM root.
 */
export function parseHtml(htmlContent: string) {
  return cheerio.load(htmlContent);
}

/**
 * In-memory Mock LocalStorage Engine conforming to Web Storage API.
 */
export class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
}

/**
 * Headless In-Memory Browser Environment Setup Helper.
 * Configures globalThis.localStorage, window, document, and CustomEvent stubs.
 */
export function setupTestEnvironment(): MockLocalStorage {
  const storage = new MockLocalStorage();
  (globalThis as any).localStorage = storage;
  if (typeof (globalThis as any).window === 'undefined') {
    (globalThis as any).window = {
      location: {
        hash: '#home',
        pathname: '/',
        origin: 'http://localhost',
        href: 'http://localhost/#home',
      },
      innerWidth: 1024,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  } else {
    (globalThis as any).window.location = {
      hash: '#home',
      pathname: '/',
      origin: 'http://localhost',
      href: 'http://localhost/#home',
    };
  }
  if (typeof (globalThis as any).document === 'undefined') {
    (globalThis as any).document = {
      addEventListener: () => {},
      removeEventListener: () => {},
      visibilityState: 'visible',
      getElementById: () => null,
      querySelectorAll: () => [],
    };
  }
  if (typeof (globalThis as any).Event === 'undefined') {
    (globalThis as any).Event = class Event {
      type: string;
      constructor(type: string) { this.type = type; }
    };
  }
  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    (globalThis as any).CustomEvent = class CustomEvent extends (globalThis as any).Event {
      detail: any;
      constructor(type: string, params?: any) {
        super(type);
        this.detail = params?.detail;
      }
    };
  }
  return storage;
}

/**
 * Execute an assertion test and format into TestResult.
 */
export async function runTestAssertion(
  testId: string,
  tier: number,
  feature: string,
  milestone: MilestoneType,
  name: string,
  testFn: () => Promise<{ pass: boolean; message: string; details?: string[] } | boolean>
): Promise<TestResult> {
  const start = performance.now();
  try {
    const res = await testFn();
    const durationMs = performance.now() - start;
    if (typeof res === 'boolean') {
      return {
        testId,
        tier,
        feature,
        milestone,
        name,
        status: res ? 'PASS' : 'FAIL',
        message: res ? 'Verification passed' : 'Assertion check failed',
        durationMs,
      };
    }
    return {
      testId,
      tier,
      feature,
      milestone,
      name,
      status: res.pass ? 'PASS' : 'FAIL',
      message: res.message,
      details: res.details,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = performance.now() - start;
    return {
      testId,
      tier,
      feature,
      milestone,
      name,
      status: 'FAIL',
      message: `Exception during test: ${err?.message || String(err)}`,
      details: err?.stack ? [err.stack] : undefined,
      durationMs,
    };
  }
}
