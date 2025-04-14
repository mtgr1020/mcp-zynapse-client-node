import { Context, Next } from "koa";
import { ResponseUtil } from "@/utils/responseUtil";

/**
 * 全局错误处理中间件
 */
export const errorHandler = async (ctx: Context, next: Next): Promise<void> => {
  try {
    await next();
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || "服务器内部错误";

    ctx.status = status;
    ctx.body = ResponseUtil.error(message, status);

    // 记录错误日志
    console.error(`[${new Date().toISOString()}] ${err.stack || err}`);
  }
};
