import { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * MCP客户端配置接口
 */
export interface MCPClientConfig {
  name: string;
  version: string;
  sseServerUrl?: string;
  stdioServerParameters?: StdioServerParameters;
  onClose?: () => void;
  onError?: (error: any) => void;
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}
