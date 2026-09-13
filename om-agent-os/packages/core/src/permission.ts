import type { JsonObject } from "./json.js";
import type { ToolSpec } from "./tool.js";

export type PermissionDecision = "allow" | "ask" | "deny";

export interface PermissionRequest {
  tool: ToolSpec;
  input: JsonObject;
  sessionId: string;
}

export interface PermissionEngine {
  decide(request: PermissionRequest): Promise<PermissionDecision>;
}
