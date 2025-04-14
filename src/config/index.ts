import type { AppConfig } from "@/types/config";

import dotenv from "dotenv";
// 加载环境变量
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });
/**
 * 应用配置文件
 */
const config: AppConfig = {
  server: {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
    basePath: process.env.BASE_PATH || "/api",
  },

  mcp: {
    apiUrl: process.env.MCP_API_URL,
    apiKey: process.env.MCP_API_KEY,
    timeout: 30000, // 请求超时时间
  },
};

export default config;
