import type { JsonObject } from "./json.js";

export type HookEventName =
  | "session.start"
  | "turn.start"
  | "context.beforeBuild"
  | "model.before"
  | "model.after"
  | "tool.before"
  | "tool.after"
  | "tool.error"
  | "turn.end"
  | "session.end";

export interface HookEvent {
  name: HookEventName;
  sessionId: string;
  payload: JsonObject;
}

export interface HookResult {
  stop?: boolean;
  payload?: JsonObject;
}

export interface Hook {
  readonly event: HookEventName;
  handle(event: HookEvent): Promise<HookResult | void>;
}
