import type { JsonObject } from "./json.js";
import type { AgentMessage } from "./message.js";

export interface Session {
  id: string;
  messages: AgentMessage[];
  metadata: JsonObject;
  createdAt: string;
  updatedAt: string;
}

export interface SessionStore {
  create(metadata?: JsonObject): Promise<Session>;
  get(id: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
}
