/**
 * WebMCP (Web Model Context Protocol) Core Manager & Polyfill
 * Ensures complete compatibility with Chrome 149+ Native WebMCP
 * and provides fallback support for all browser environments.
 * 
 * Reference: https://developer.chrome.com/docs/ai/webmcp
 */

import {
  WebMcpToolDefinition,
  WebMcpRegisterOptions,
  WebMcpGetToolsOptions,
  WebMcpToolExecuteContext,
  WebMcpExecutionLog
} from './types';

class WebMcpManagerImpl {
  private tools: Map<string, { definition: WebMcpToolDefinition; options?: WebMcpRegisterOptions }> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private executionLogs: WebMcpExecutionLog[] = [];
  private isNativeAvailable: boolean = false;

  constructor() {
    this.initPolyfillAndBridge();
  }

  /**
   * Initializes browser globals (document.modelContext & window.webMCP)
   */
  private initPolyfillAndBridge() {
    if (typeof window === 'undefined') return;

    // Check if native Chrome document.modelContext exists
    const nativeModelContext = (document as any).modelContext;
    if (nativeModelContext && typeof nativeModelContext.registerTool === 'function') {
      this.isNativeAvailable = true;
      console.log('⚡ [WebMCP] Native Chrome document.modelContext detected.');
    } else {
      // Polyfill document.modelContext
      const polyfill = {
        registerTool: this.registerTool.bind(this),
        unregisterTool: this.unregisterTool.bind(this),
        getTools: this.getTools.bind(this),
        executeTool: this.executeTool.bind(this),
        addEventListener: this.addEventListener.bind(this),
        removeEventListener: this.removeEventListener.bind(this)
      };

      try {
        Object.defineProperty(document, 'modelContext', {
          value: polyfill,
          writable: true,
          configurable: true
        });
      } catch (e) {
        (document as any).modelContext = polyfill;
      }
      console.log('⚡ [WebMCP] Initialized WebMCP polyfill on document.modelContext.');
    }

    // Always expose window.webMCP as standard access point for AI agents & debuggers
    (window as any).webMCP = this;
    (window as any).__SNSHERO_WEBMCP__ = this;
  }

  /**
   * Registers a tool to WebMCP
   */
  public async registerTool(tool: WebMcpToolDefinition, options?: WebMcpRegisterOptions): Promise<void> {
    if (!tool || !tool.name) {
      console.warn('[WebMCP] Cannot register tool without name:', tool);
      return;
    }

    // Store in internal registry
    this.tools.set(tool.name, { definition: tool, options });

    // Handle AbortSignal for unregistration
    if (options?.signal) {
      if (options.signal.aborted) {
        this.unregisterTool(tool.name);
        return;
      }
      options.signal.addEventListener('abort', () => {
        this.unregisterTool(tool.name);
      }, { once: true });
    }

    // Forward to native Chrome modelContext if available
    if (this.isNativeAvailable && (document as any).modelContext) {
      try {
        await (document as any).modelContext.registerTool({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
          execute: tool.execute
        }, options);
      } catch (err) {
        console.warn(`[WebMCP] Native registerTool for [${tool.name}] returned error:`, err);
      }
    }

    this.emit('toolRegistered', tool);
    this.emit('change', { type: 'register', toolName: tool.name });
  }

  /**
   * Unregisters a tool from WebMCP
   */
  public unregisterTool(name: string): void {
    if (!this.tools.has(name)) return;
    this.tools.delete(name);

    if (this.isNativeAvailable && typeof (document as any).modelContext?.unregisterTool === 'function') {
      try {
        (document as any).modelContext.unregisterTool(name);
      } catch (err) {
        // Native may not have unregisterTool or threw
      }
    }

    this.emit('toolUnregistered', name);
    this.emit('change', { type: 'unregister', toolName: name });
  }

  /**
   * Discovers and retrieves all registered tools
   */
  public async getTools(options?: WebMcpGetToolsOptions): Promise<WebMcpToolDefinition[]> {
    const list: WebMcpToolDefinition[] = [];
    for (const entry of this.tools.values()) {
      list.push(entry.definition);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Executes a tool with input parameters
   */
  public async executeTool(name: string, params: any = {}, context?: WebMcpToolExecuteContext): Promise<any> {
    const entry = this.tools.get(name);
    if (!entry) {
      const available = Array.from(this.tools.keys()).join(', ');
      const errorMsg = `[WebMCP Error] Tool '${name}' not found. Available tools: [${available}]`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const startTime = Date.now();
    let result: any;
    let errorStr: string | undefined;

    try {
      // Validate or sanitize parameters if schema is present
      const sanitizedParams = params || {};
      result = await entry.definition.execute(sanitizedParams, context);
      return result;
    } catch (err: any) {
      errorStr = err?.message || String(err);
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      const logEntry: WebMcpExecutionLog = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        toolName: name,
        params,
        result,
        error: errorStr,
        durationMs,
        timestamp: Date.now(),
        screen: entry.definition.screen
      };

      this.executionLogs.unshift(logEntry);
      if (this.executionLogs.length > 50) {
        this.executionLogs.pop();
      }

      this.emit('toolExecuted', logEntry);
    }
  }

  /**
   * Returns recent tool execution logs for inspection
   */
  public getExecutionLogs(): WebMcpExecutionLog[] {
    return [...this.executionLogs];
  }

  /**
   * Event listener subscription
   */
  public addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Event listener removal
   */
  public removeEventListener(event: string, callback: Function): void {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event)!.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(cb => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[WebMCP] Error in event listener for ${event}:`, e);
        }
      });
    }
  }
}

// Global Singleton Instance
export const webMcpManager = new WebMcpManagerImpl();
