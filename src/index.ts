import path from "path";
import Koa from "koa";
import logger from "koa-logger";
import bodyParser from "koa-bodyparser";
import { useKoaServer } from "routing-controllers";
import config from "@/config";
import { errorHandler, responseTransformer } from "@/middlewares";
import { startMcpClient } from "@/services/mcp/ClientService";
const app = new Koa();

// 配置装饰器控制器
useKoaServer(app, {
  controllers: [path.join(__dirname, "/controllers/**/*.ts")],
  defaultErrorHandler: false,
});

// 中间件
app.use(logger());
app.use(bodyParser());
app.use(errorHandler);
app.use(responseTransformer);

// 启动服务器
app.listen(config.server.port, () => {
  console.log(`服务器运行在 http://localhost:${config.server.port}`);
});

startMcpClient();

export default app;
