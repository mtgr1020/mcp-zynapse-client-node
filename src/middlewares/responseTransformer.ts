import { Context, Next } from "koa";
import { ResponseUtil } from "@/utils/responseUtil";

export async function responseTransformer(ctx: Context, next: Next) {
  await next();

  // 如果响应不是标准格式，则转换为标准格式
  if (
    ctx.body &&
    typeof ctx.body === "object" &&
    !("code" in ctx.body) &&
    !("message" in ctx.body)
  ) {
    ctx.body = ResponseUtil.success(ctx.body);
  } else if (ctx.body && typeof ctx.body !== "object") {
    ctx.body = ResponseUtil.success(ctx.body);
  }
}
