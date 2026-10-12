/**
 * WebMCP (Web Model Context Protocol) Type Definitions
 * Based on Google Chrome WebMCP Specification (Chrome 149+)
 * Reference: https://developer.chrome.com/docs/ai/webmcp
 */

export interface WebMcpPropertySchema {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: (string | number)[];
  default?: any;
  items?: WebMcpPropertySchema;
  properties?: Record<string, WebMcpPropertySchema>;
  required?: string[];
}

export interface WebMcpJsonSchema {
  type: 'object';
  properties: Record<string, WebMcpPropertySchema>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface WebMcpToolAnnotations {
  /**
   * Indicates whether the tool only reads state without any side effects.
   * Default: false
   */
  readOnlyHint?: boolean;

  /**
   * Indicates whether the tool modifies important/consequential state
   * (e.g. spending currency, deleting data, starting irreversible actions).
   * Default: false
   */
  consequentialHint?: boolean;

  /**
   * Indicates whether the output may contain untrusted user content.
   * Default: false
   */
  untrustedContentHint?: boolean;

  /**
   * Indicates whether the tool is strictly for developer debugging/inspection.
   * Default: false
   */
  debugging?: boolean;
}

export interface WebMcpToolExecuteContext {
  signal?: AbortSignal;
}

export interface WebMcpToolDefinition<TParams = any, TResult = any> {
  name: string;
  description: string;
  inputSchema: WebMcpJsonSchema;
  annotations?: WebMcpToolAnnotations;
  execute: (params: TParams, context?: WebMcpToolExecuteContext) => Promise<TResult> | TResult;
  
  // Extended metadata
  category?: string;
  screen?: string;
}

export interface WebMcpRegisterOptions {
  signal?: AbortSignal;
  exposedTo?: string[];
}

export interface WebMcpGetToolsOptions {
  fromOrigins?: string[];
}

export interface WebMcpContext {
  registerTool: (tool: WebMcpToolDefinition, options?: WebMcpRegisterOptions) => Promise<void>;
  unregisterTool: (name: string) => void;
  getTools: (options?: WebMcpGetToolsOptions) => Promise<WebMcpToolDefinition[]>;
  executeTool: (name: string, params?: any, context?: WebMcpToolExecuteContext) => Promise<any>;
  addEventListener: (event: string, callback: (...args: any[]) => void) => void;
  removeEventListener: (event: string, callback: (...args: any[]) => void) => void;
}

export interface WebMcpExecutionLog {
  id: string;
  toolName: string;
  params: any;
  result: any;
  error?: string;
  durationMs: number;
  timestamp: number;
  screen?: string;
}
