import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import type { ServerResponse, IncomingMessage } from "http";
import type { ToolCall } from "@/types/chat";
import { getSystemPrompt } from "@/config/prompt";
import OpenAI from "openai";
import { ClientManager } from "@/services/mcp/ClientService";
export class CompletionsService {
  initOpenAI() {
    return new OpenAI({
      apiKey: "sk-",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }

  async chatCompletion(body: ChatCompletionCreateParamsBase) {
    const openai = this.initOpenAI();
    const tools = await ClientManager.getInstance().listAllTools();
    const completion = await openai.chat.completions.create({
      ...body,
      tools,
    });
    return completion;
  }

  async composeChatCompletionBody(
    body: ChatCompletionCreateParamsBase
  ): Promise<ChatCompletionCreateParamsBase> {
    // 获取当前可用工具
    const tools = await ClientManager.getInstance().listAllTools();
    const resources = await ClientManager.getInstance().listAllResources();
    const systemPrompt = getSystemPrompt({ resources });
    // 不修改原始的messages，而是添加到头部
    const { messages, ...rest } = body;
    return {
      ...rest,
      stream: true,
      tools,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    };
  }

  async chatCompletionStream(
    body: ChatCompletionCreateParamsBase,
    res: ServerResponse<IncomingMessage>
  ) {
    const openai = this.initOpenAI();
    const streamBody = await this.composeChatCompletionBody(body);
    const stream = (await openai.chat.completions.create(
      streamBody
    )) as Stream<ChatCompletionChunk>;

    try {
      let lastChunk = null;
      let completedContent = "";
      let accumulatedToolCalls: ToolCall[] = [];

      for await (const chunk of stream) {
        lastChunk = chunk;

        // 累积工具调用信息
        if (chunk.choices && chunk.choices[0]?.delta?.tool_calls) {
          const deltaToolCalls = chunk.choices[0].delta.tool_calls;

          if (chunk.choices[0].delta.content) {
            completedContent += chunk.choices[0].delta.content || "";
          }

          // 处理每个工具调用
          for (const deltaTool of deltaToolCalls) {
            const toolIndex = deltaTool.index;
            // 查找或创建对应索引的工具调用
            let existingTool = accumulatedToolCalls.find(
              (t) => t.index === toolIndex
            );
            if (!existingTool) {
              existingTool = {
                index: toolIndex,
                id: deltaTool.id || "",
                type: deltaTool.type || "",
                function: { name: "", arguments: "" },
              };
              accumulatedToolCalls.push(existingTool);
            }
            // 更新工具ID和类型（如果有）
            if (deltaTool.id) existingTool.id = deltaTool.id;
            if (deltaTool.type) existingTool.type = deltaTool.type;
            // 更新函数信息（如果有）
            if (deltaTool.function) {
              if (deltaTool.function.name) {
                existingTool.function.name = deltaTool.function.name;
              }
              if (deltaTool.function.arguments) {
                existingTool.function.arguments += deltaTool.function.arguments;
              }
            }
          }
        }
        // 确保每个数据块格式正确，采用SSE格式
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        // 尝试立即发送数据
        if (typeof (res as any).flush === "function") {
          (res as any).flush();
        }
      }
      // 处理完整响应的逻辑
      if (lastChunk && lastChunk.choices && lastChunk.choices[0]) {
        const finishReason = lastChunk.choices[0].finish_reason;
        // 根据 finish_reason 判断是否需要调用工具
        if (finishReason === "tool_calls" && accumulatedToolCalls.length > 0) {
          console.log("需要调用工具，完整工具调用信息:", accumulatedToolCalls);
          const results = await this.handleToolCalls(accumulatedToolCalls);
          await this.chatCompletionStream(
            {
              ...body,
              messages: [
                ...body.messages,
                {
                  content: completedContent,
                  role: "assistant",
                  tool_calls: accumulatedToolCalls,
                },
                ...results,
              ],
            },
            res
          );
        }
      }
    } catch (err) {
      console.error("流处理错误:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.write(JSON.stringify({ error: "流式处理错误" }));
        res.end();
      }
    }
  }

  /**
   * 处理工具调用
   * @param toolCalls 工具调用信息
   * @returns 工具调用结果
   */
  async handleToolCalls(toolCalls: ToolCall[]): Promise<any> {
    const results = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const clientId = toolCall.function.name.split("&")[0];
        const toolName = toolCall.function.name.split("&")[1];

        const result = await ClientManager.getInstance().callTool(
          clientId,
          toolName,
          JSON.parse(toolCall.function.arguments)
        );
        console.log("工具调用结果:", result);
        // 返回工具调用结果,组合到messages中(Tool Message)
        return {
          content: JSON.stringify(result),
          role: "tool",
          tool_call_id: toolCall.id,
        };
      })
    );
    return results;
  }
}
