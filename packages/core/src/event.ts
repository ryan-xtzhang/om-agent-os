import type { JsonObject } from "./json.js";

export interface RuntimeEvent {
  type: string;
  timestamp: string;
  payload: JsonObject;
}

export type EventHandler = (event: RuntimeEvent) => void | Promise<void>;

export interface EventBus {
  publish(event: RuntimeEvent): Promise<void>;
  subscribe(type: string, handler: EventHandler): () => void;
}
