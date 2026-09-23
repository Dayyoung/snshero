/**
 * WebMCP (Web Model Context Protocol) Service
 */
export function initWebMcpService(): void {
  if (typeof window === 'undefined') return;
  try {
    (window as any).__WEBMCP_INITIALIZED__ = true;
  } catch (e) {
    // Non-blocking
  }
}

export default initWebMcpService;
