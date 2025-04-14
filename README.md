# MCP Client 代理服务

MCP Client 是一个基于 Node.js、TypeScript 和 Koa 框架开发的代理服务，用于与大模型 API 交互，支持流式返回。

## 特性

- 使用 TypeScript 开发，类型安全
- 使用 Koa 框架实现轻量级 RESTful API
- 支持大模型的流式返回（Server-Sent Events）
- MVC 架构设计，代码结构清晰
- 完整的错误处理和日志记录

## 安装

1. 克隆仓库

```
git clone https://github.com/yourusername/mcp-zynapse-client-node.git
cd mcp-zynapse-client-node
```

2. 安装依赖

```
npm install
```

3. 配置环境变量

```
cp .env.example .env
```

并编辑 `.env` 文件，填入必要的配置信息。

## 运行

开发环境：

```
npm run dev
```

构建：

```
npm run build
```

生产环境：

```
npm start
```

## API 接口

### 健康检查

- GET `/api/v1/health`

### 聊天完成（普通模式）

- POST `/api/v1/chat`
- 请求体示例：

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "你是一个有用的AI助手。"
    },
    {
      "role": "user",
      "content": "你好，请介绍一下自己。"
    }
  ],
  "temperature": 0.7
}
```

### 聊天完成（流式模式）

- POST `/api/v1/chat/stream`
- 请求体格式同上
- 返回格式为 Server-Sent Events (SSE)

## 项目结构

```
.
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── interfaces/     # 接口定义
│   ├── middlewares/    # 中间件
│   ├── routes/         # 路由定义
│   ├── services/       # 业务服务
│   ├── utils/          # 工具函数
│   └── index.ts        # 应用入口
├── dist/               # 编译后的代码
├── .env.example        # 环境变量示例
├── .gitignore          # Git忽略文件
├── LICENSE             # 许可证
├── package.json        # 项目配置
├── tsconfig.json       # TypeScript配置
└── README.md           # 项目说明
```

## 许可证

[ISC](LICENSE)
