import type { AgentMessage } from "./message.js";
import type { Session } from "./session.js";

export interface ContextProvider {
  readonly id: string;
  readonly priority?: number;
  provide(session: Session): Promise<AgentMessage[]>;
}

export interface ContextBuilder {
  build(session: Session): Promise<AgentMessage[]>;
}
