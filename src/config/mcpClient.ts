import type { MCPClientConfig } from "@/types/mcp";

export const mcpClients: MCPClientConfig[] = [
  {
    name: "nba-client",
    version: "1.0.0",
    sseServerUrl: "http://localhost:9122/mcp-server/sse",
  },
];
