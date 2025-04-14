import axios, { AxiosInstance, AxiosResponse } from "axios";
import config from "../config";

// 错误接口
export interface McpError {
  status: number;
  message: string;
  details?: any;
}

// 数据回调函数类型
export type DataCallback = (data: any) => void;

class McpService {
  private apiUrl: string | undefined;
  private apiKey: string | undefined;
  private client: AxiosInstance;

  constructor() {
    this.apiUrl = config.mcp.apiUrl;
    this.apiKey = config.mcp.apiKey;

    // 创建axios实例
    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: config.mcp.timeout,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * 处理常规请求
   * @param {string} endpoint - API端点
   * @param {object} data - 请求数据
   * @returns {Promise<object>} - 响应结果
   */
  async request(endpoint: string, data: any): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * 处理流式请求
   * @param {string} endpoint - API端点
   * @param {object} data - 请求数据
   * @param {function} onData - 数据流回调函数
   * @returns {Promise<void>}
   */
  async streamRequest(
    endpoint: string,
    data: any,
    onData: DataCallback
  ): Promise<void> {
    try {
      const response = await this.client({
        method: "post",
        url: endpoint,
        data: data,
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
      });

      // 处理流式响应
      response.data.on("data", (chunk: Buffer) => {
        try {
          const text = chunk.toString("utf-8");
          // 处理SSE格式的数据
          const lines = text.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const jsonStr = line.slice(5).trim();
              // 对于非[DONE]的数据，解析JSON并传递给回调
              if (jsonStr !== "[DONE]") {
                try {
                  const data = JSON.parse(jsonStr);
                  onData(data);
                } catch (e) {
                  console.error("解析流数据失败:", e);
                }
              } else {
                // 流结束
                onData({ done: true });
              }
            }
          }
        } catch (err) {
          console.error("处理数据块失败:", err);
        }
      });

      // 处理错误
      response.data.on("error", (err: Error) => {
        console.error("流错误:", err);
        throw err;
      });
    } catch (error) {
      throw this._handleError(error);
    }
  }

  /**
   * 聊天完成接口 - 流式
   * @param {object} params - 聊天参数
   * @param {function} onData - 数据流回调函数
   */
  async chatCompletionStream(params: any, onData: DataCallback): Promise<void> {
    return this.streamRequest("/chat/completions", params, onData);
  }

  /**
   * 聊天完成接口 - 普通
   * @param {object} params - 聊天参数
   * @returns {Promise<object>} - 响应结果
   */
  async chatCompletion(params: any): Promise<any> {
    return this.request("/chat/completions", params);
  }

  /**
   * 错误处理
   * @private
   */
  private _handleError(error: any): McpError {
    if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status;
      const data = error.response.data;

      return {
        status,
        message: data.error?.message || "服务器错误",
        details: data,
      };
    } else if (error.request) {
      // 请求发送但没有收到响应
      return {
        status: 500,
        message: "无法连接到MCP服务",
        details: error.message,
      };
    } else {
      // 请求设置时出错
      return {
        status: 500,
        message: "请求配置错误",
        details: error.message,
      };
    }
  }
}

export default new McpService();
