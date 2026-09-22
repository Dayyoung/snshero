/**
 * WebMCP (Web Model Context Protocol) service for AI agent interaction
 */
export function initWebMcpService(): void {
  if (typeof window === 'undefined') return;
  (window as any).__WEBMCP_INITIALIZED__ = true;
}

export default {
  initWebMcpService
};
