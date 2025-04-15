import type { MCPClientConfig, MCPResource } from "@/types/mcp";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { FunctionParameters } from "openai/resources/shared";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mcpClients } from "@/config/mcpClient";
/**
 * MCP客户端管理器
 * 支持多个客户端的统一管理和动态扩展
 */
export class ClientManager {
  private static instance: ClientManager;
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport | SSEClientTransport> =
    new Map();

  /**
   * 获取单例实例
   */
  public static getInstance(): ClientManager {
    if (!ClientManager.instance) {
      ClientManager.instance = new ClientManager();
    }
    return ClientManager.instance;
  }

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {}

  /**
   * 添加并初始化一个新的客户端
   * @param clientId 客户端唯一标识
   * @param config 客户端配置
   * @returns 创建的客户端实例
   */
  public async addClient(config: MCPClientConfig): Promise<Client> {
    const clientId = config.name + "_" + config.version;
    if (this.clients.has(clientId)) {
      throw new Error(`客户端 ${clientId} 已存在`);
    }

    const client = new Client({
      name: config.name,
      version: config.version,
    });
    let transport: StdioClientTransport | SSEClientTransport;
    if (config.sseServerUrl) {
      transport = new SSEClientTransport(new URL(config.sseServerUrl));
    } else if (config.stdioServerParameters) {
      transport = new StdioClientTransport(config.stdioServerParameters);
    } else {
      throw new Error("addClient 配置错误");
    }
    // 连接服务器
    await client.connect(transport);

    // 设置事件处理
    transport.onclose = () => {
      config.onClose?.();
      console.log(`客户端 ${clientId} 连接已关闭`);
    };

    transport.onerror = (error) => {
      config.onError?.(error);
      console.log(`客户端 ${clientId} 连接错误:`, error);
    };

    // 存储客户端和传输实例
    this.clients.set(clientId, client);
    this.transports.set(clientId, transport);

    return client;
  }

  public async addClients(configs: MCPClientConfig[]): Promise<void> {
    for (const config of configs) {
      await this.addClient(config);
    }
  }

  /**
   * 获取指定的客户端实例
   * @param clientId 客户端唯一标识
   * @returns 客户端实例
   */
  public getClient(clientId: string): Client | undefined {
    return this.clients.get(clientId);
  }

  /**
   * 获取所有客户端ID列表
   * @returns 客户端ID数组
   */
  public getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * 获取所有客户端实例
   * @returns 客户端实例数组
   */
  public getAllClients(): Client[] {
    return Array.from(this.clients.values());
  }

  /**
   * 移除并断开客户端连接
   * @param clientId 客户端唯一标识
   * @returns 移除是否成功
   */
  public async removeClient(clientId: string): Promise<boolean> {
    const client = this.clients.get(clientId);
    const transport = this.transports.get(clientId);

    if (!client || !transport) {
      return false;
    }

    try {
      // 关闭传输层连接，Client类没有disconnect方法
      // 从管理器中移除
      this.clients.delete(clientId);
      this.transports.delete(clientId);

      return true;
    } catch (error) {
      console.error(`移除客户端 ${clientId} 失败:`, error);
      return false;
    }
  }

  async readResource(clientId: string, uri: string): Promise<string> {
    const resource = await this.getClient(clientId)!.readResource({
      uri,
    });
    console.log("-----", resource);
    return JSON.stringify(resource.contents);
  }

  /**
   * 调用指定客户端的工具
   * @param clientId 客户端唯一标识
   * @param toolName 工具名称
   * @param args 工具参数
   * @returns 工具调用结果
   */
  public async callTool(
    clientId: string,
    toolName: string,
    args: any
  ): Promise<any> {
    if (toolName === "access_mcp_resource") {
      return await this.readResource(clientId, args.uri);
    }

    const client = this.getClient(clientId);

    if (!client) {
      throw new Error(`客户端 ${clientId} 不存在`);
    }

    return await client.callTool({
      name: toolName,
      arguments: args,
    });
  }

  /**
   * 获取指定客户端的资源列表
   * @param clientIds 客户端唯一标识
   * @returns 资源列表
   */
  public async listResources(clientIds: string[]): Promise<MCPResource[]> {
    const allResources: MCPResource[] = [];
    for (const clientId of clientIds) {
      const client = this.getClient(clientId);
      if (!client) {
        throw new Error(`客户端 ${clientId} 不存在`);
      }
      const result = await client.listResources();
      if (result && result.resources && Array.isArray(result.resources)) {
        allResources.push(
          ...result.resources.map((resource) => ({
            uri: resource.uri,
            name: resource.name,
            description: resource.description || "",
            mimeType: resource.mimeType || "",
          }))
        );
      }
    }
    return allResources;
  }

  /**
   * 获取所有客户端的资源列表
   */
  public async listAllResources(): Promise<MCPResource[]> {
    const clientIds = this.getClientIds();
    return await this.listResources(clientIds);
  }

  /**
   * 获取指定客户端的工具列表
   * @param clientIds 客户端唯一标识数组
   * @returns 工具列表
   */
  public async listTools(clientIds: string[]): Promise<ChatCompletionTool[]> {
    const allTools: ChatCompletionTool[] = [];
    for (const clientId of clientIds) {
      const client = this.getClient(clientId);
      if (!client) {
        throw new Error(`客户端 ${clientId} 不存在`);
      }
      const result = await client.listTools();
      if (result && result.tools && Array.isArray(result.tools)) {
        const formattedTools = result.tools.map((tool) => ({
          type: "function" as const,
          function: {
            name: clientId + "&" + tool.name,
            description: tool.description || "",
            parameters: (tool.parameters ||
              tool.inputSchema) as FunctionParameters,
          },
        }));
        allTools.push(...formattedTools);
      }
    }
    // 添加一个工具，用于访问所有资源
    allTools.push({
      type: "function" as const,
      function: {
        name: "nba-client_1.0.0&access_mcp_resource",
        description: "Access a resource provided by a connected MCP server.",
        parameters: {
          type: "object",
          properties: {
            uri: {
              type: "string",
              description: "The uri of the resource to access",
            },
          },
        },
      },
    });

    return allTools;
  }

  /**
   * 获取所有客户端的工具列表
   */
  public async listAllTools(): Promise<ChatCompletionTool[]> {
    const clientIds = this.getClientIds();
    return await this.listTools(clientIds);
  }
}

export const startMcpClient = async () => {
  const clientManager = ClientManager.getInstance();
  await clientManager.addClients(mcpClients);

  // 获取所有工具
  // const tools = await clientManager.listAllTools();
  // console.log(JSON.stringify(tools, null, 2));
};
