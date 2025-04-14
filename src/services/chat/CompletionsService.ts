import type { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

import OpenAI from "openai";

export class CompletionsService {
  initOpenAI() {
    return new OpenAI({
      apiKey: "sk-bbabe5e7479e4cefb7487522b74d628c",
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }

  async chatCompletion(body: ChatCompletionCreateParamsBase) {
    const openai = this.initOpenAI();
    const completion = await openai.chat.completions.create(body);
    return completion;
  }

  async chatCompletionStream(body: ChatCompletionCreateParamsBase) {
    const openai = this.initOpenAI();
    // 确保stream参数为true
    const streamBody = { ...body, stream: true };
    const stream = await openai.chat.completions.create(streamBody);

    // OpenAI SDK 使用的是自定义的Stream类型
    return stream as Stream<ChatCompletionChunk>;
  }
}
