import type { JsonObject, JsonSchema, JsonValue } from "./json.js";
import type { Session } from "./session.js";

export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  permission?: string;
}

export interface ToolResult {
  content: string;
  data?: JsonValue;
  isError?: boolean;
}

export interface ToolContext {
  session: Session;
  workspaceRoot: string;
  signal?: AbortSignal;
}

export interface Tool {
  readonly spec: ToolSpec;
  execute(input: JsonObject, context: ToolContext): Promise<ToolResult>;
}
