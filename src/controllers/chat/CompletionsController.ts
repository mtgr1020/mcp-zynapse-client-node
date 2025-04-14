import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

import "reflect-metadata";
import { Controller, Body, Post, Ctx } from "routing-controllers";
import { CompletionsService } from "@/services/chat/CompletionsService";
import { Context } from "koa";

@Controller("/chat")
export class CompletionsController {
  @Post("/completions")
  async completions(
    @Body() body: ChatCompletionCreateParamsBase,
    @Ctx() ctx: Context
  ) {
    const completionsService = new CompletionsService();

    if (body.stream === true) {
      // 设置流式输出的响应头
      ctx.set("Content-Type", "text/event-stream");
      ctx.set("Cache-Control", "no-cache");
      ctx.set("Connection", "keep-alive");
      ctx.status = 200; // 显式设置状态码为200

      // 禁用Koa的响应体缓冲，直接将数据传递给底层响应对象
      ctx.respond = false;
      const res = ctx.res;

      try {
        const stream = await completionsService.chatCompletionStream(body);

        // 使用同步处理流，而不是异步立即返回
        try {
          for await (const chunk of stream) {
            // 确保每个数据块格式正确，采用SSE格式
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            // 尝试立即发送数据
            if (typeof (res as any).flush === "function") {
              (res as any).flush();
            }
          }
          res.end();
        } catch (err) {
          console.error("流处理错误:", err);
          if (!res.headersSent) {
            res.writeHead(500);
            res.write(JSON.stringify({ error: "流式处理错误" }));
            res.end();
          }
        }

        // 由于ctx.respond=false，控制器方法需要有返回值但实际上不会被使用
        return {};
      } catch (error) {
        console.error("流式输出错误:", error);
        if (!res.headersSent) {
          ctx.status = 500;
          ctx.body = { error: "流式输出处理出错" };
          res.end();
        }
        return { error: "流式输出处理出错" };
      }
    } else {
      // 非流式响应
      return completionsService.chatCompletion(body);
    }
  }
}
