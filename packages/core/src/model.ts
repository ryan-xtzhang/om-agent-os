import type { JsonObject, JsonSchema } from "./json.js";
import type { AgentMessage, ToolCall } from "./message.js";

export interface ModelToolSpec {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface ModelRequest {
  messages: AgentMessage[];
  tools: ModelToolSpec[];
  metadata?: JsonObject;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  finishReason?: "stop" | "tool_calls" | "length" | "error";
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  raw?: JsonObject;
}

export interface ModelProvider {
  readonly id: string;
  generate(request: ModelRequest): Promise<ModelResponse>;
}
