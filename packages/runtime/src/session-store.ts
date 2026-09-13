import { randomUUID } from "node:crypto";
import type { JsonObject, Session, SessionStore } from "@om-agent-os/core";

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();

  async create(metadata: JsonObject = {}): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      id: randomUUID(),
      messages: [],
      metadata,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return structuredClone(session);
  }

  async get(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    return session ? structuredClone(session) : undefined;
  }

  async save(session: Session): Promise<void> {
    session.updatedAt = new Date().toISOString();
    this.sessions.set(session.id, structuredClone(session));
  }
}
