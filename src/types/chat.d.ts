export interface ChatRequestMessage {
  role: string;
  content: string;
}

export interface ChatRequestTool {
  /**
   * tools的类型，当前仅支持function。
   */
  type: string;
  function: {
    /**
     * 工具函数的名称，必须是字母、数字，可以包含下划线和短划线，最大长度为64。
     */
    name: string;
    /**
     * 工具函数的描述，供模型选择何时以及如何调用工具函数。
     */
    description: string;
    /**
     * 工具的参数描述，需要是一个合法的JSON Schema。
     * 如果parameters参数为空，表示function没有入参。
     */
    parameters: any;
  };
}
export interface ChatCompletionRequest {
  model: string;
  messages: ChatRequestMessage[];
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  response_format?: any;
  max_tokens?: number;
  n?: number;
  tools?: ChatRequestTool[];
  /**
   * 默认值为 "auto"
   */
  tool_choice?: string;
  search_options?: any;
}

export interface ChatResponseToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
  index: number;
}

export interface ChatResponseMessage {
  role: string;
  content: string;
  tool_calls: ChatResponseToolCall[];
}

export interface ChatCompletionChoice {
  message: ChatResponseMessage;
  index: number;
  /**
   * 有三种情况：
   * 因触发输入参数中的stop条件，或自然停止输出时为stop；
   * 因生成长度过长而结束为length；
   * 因需要调用工具而结束为tool_calls
   */
  finish_reason: string;
}

export interface ChatCompletionResponse {
  /**
   * 本次调用的唯一标识符。
   */
  id: string;
  /**
   * 始终为chat.completion
   */
  object: string;
  /**
   * 本次chat请求被创建时的时间戳。
   */
  created: number;
  /**
   * 本次chat请求使用的模型名称。
   */
  model: string;
  /**
   * 模型生成内容的数组，可以包含一个或多个choices对象。
   */
  choices: ChatCompletionChoice[];
}
