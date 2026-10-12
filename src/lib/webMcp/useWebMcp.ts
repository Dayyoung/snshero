/**
 * React Hooks for WebMCP (Web Model Context Protocol)
 * Provides seamless registration & lifecycle cleanup for React components.
 */

import { useEffect, useState, useRef } from 'react';
import { WebMcpToolDefinition, WebMcpExecutionLog } from './types';
import { webMcpManager } from './webMcpManager';

/**
 * Hook to register a single WebMCP tool for the lifetime of a component.
 */
export function useWebMcpTool(
  toolDefinition: WebMcpToolDefinition | null,
  deps: any[] = []
) {
  const toolRef = useRef(toolDefinition);
  toolRef.current = toolDefinition;

  useEffect(() => {
    if (!toolRef.current) return;

    const controller = new AbortController();
    const currentTool = toolRef.current;

    webMcpManager.registerTool(currentTool, { signal: controller.signal });

    return () => {
      controller.abort();
      webMcpManager.unregisterTool(currentTool.name);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to register multiple WebMCP tools for the lifetime of a component/screen.
 */
export function useWebMcpTools(
  toolDefinitions: WebMcpToolDefinition[],
  deps: any[] = []
) {
  const toolsRef = useRef(toolDefinitions);
  toolsRef.current = toolDefinitions;

  useEffect(() => {
    const tools = toolsRef.current;
    if (!tools || tools.length === 0) return;

    const controller = new AbortController();

    tools.forEach((tool) => {
      webMcpManager.registerTool(tool, { signal: controller.signal });
    });

    return () => {
      controller.abort();
      tools.forEach((tool) => {
        webMcpManager.unregisterTool(tool.name);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook to observe active WebMCP tools and execution logs.
 */
export function useWebMcpState() {
  const [tools, setTools] = useState<WebMcpToolDefinition[]>([]);
  const [logs, setLogs] = useState<WebMcpExecutionLog[]>([]);

  useEffect(() => {
    const update = async () => {
      const currentTools = await webMcpManager.getTools();
      setTools(currentTools);
      setLogs(webMcpManager.getExecutionLogs());
    };

    update();

    const handleChange = () => update();
    const handleLog = () => setLogs(webMcpManager.getExecutionLogs());

    webMcpManager.addEventListener('change', handleChange);
    webMcpManager.addEventListener('toolExecuted', handleLog);

    return () => {
      webMcpManager.removeEventListener('change', handleChange);
      webMcpManager.removeEventListener('toolExecuted', handleLog);
    };
  }, []);

  return {
    tools,
    toolCount: tools.length,
    logs,
    executeTool: webMcpManager.executeTool.bind(webMcpManager)
  };
}
