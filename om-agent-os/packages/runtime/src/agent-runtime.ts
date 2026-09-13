import { randomUUID } from "node:crypto";
import type {
  AgentMessage,
  ContextBuilder,
  AgentRunOptions,
  AgentRunResult,
  AgentRuntime,
  ModelProvider,
  PermissionEngine,
  Session,
  SessionStore,
} from "@om-agent-os/core";
import { DefaultContextBuilder } from "./context-builder.js";
import { HookRegistry } from "./hooks.js";
import { ToolRegistry } from "./registry.js";

export interface DefaultAgentRuntimeOptions {
  model: ModelProvider;
  tools: ToolRegistry;
  sessions: SessionStore;
  permissions: PermissionEngine;
  hooks?: HookRegistry;
  context?: ContextBuilder;
  workspaceRoot: string;
}

export class DefaultAgentRuntime implements AgentRuntime {
  private readonly hooks: HookRegistry;
  private readonly context: ContextBuilder;

  constructor(private readonly options: DefaultAgentRuntimeOptions) {
    this.hooks = options.hooks ?? new HookRegistry();
    this.context = options.context ?? new DefaultContextBuilder();
  }

  async run(input: string, runOptions: AgentRunOptions = {}): Promise<AgentRunResult> {
    const session = await this.resolveSession(runOptions.sessionId);
    const maxSteps = runOptions.maxSteps ?? 16;

    this.append(session, "user", input);
    await this.options.sessions.save(session);
    await this.emit("turn.start", session, { input });

    for (let step = 1; step <= maxSteps; step += 1) {
      await this.emit("model.before", session, { step });
      const messages = await this.context.build(session);
      const response = await this.options.model.generate({
        messages,
        tools: this.options.tools.list().map((tool) => ({
          name: tool.spec.name,
          description: tool.spec.description,
          inputSchema: tool.spec.inputSchema,
        })),
      });
      await this.emit("model.after", session, { step, finishReason: response.finishReason ?? "stop" });

      const assistant = this.append(
        session,
        "assistant",
        response.content,
        response.toolCalls ? { toolCalls: response.toolCalls } : {},
      );
      await this.options.sessions.save(session);

      if (!response.toolCalls?.length) {
        await this.emit("turn.end", session, { step });
        return { sessionId: session.id, content: response.content, steps: step };
      }

      for (const call of response.toolCalls) {
        const tool = this.options.tools.get(call.name);
        if (!tool) {
          this.append(session, "tool", `Tool not found: ${call.name}`, {
            toolCallId: call.id,
          });
          continue;
        }

        await this.emit("tool.before", session, { tool: call.name, toolCallId: call.id });
        const decision = await this.options.permissions.decide({
          tool: tool.spec,
          input: call.arguments,
          sessionId: session.id,
        });

        if (decision !== "allow") {
          this.append(session, "tool", `Permission ${decision}: ${call.name}`, {
            toolCallId: call.id,
          });
          continue;
        }

        try {
          const result = await tool.execute(call.arguments, {
            session,
            workspaceRoot: this.options.workspaceRoot,
            ...(runOptions.signal ? { signal: runOptions.signal } : {}),
          });
          this.append(session, "tool", result.content, { toolCallId: call.id });
          await this.emit("tool.after", session, { tool: call.name, toolCallId: call.id });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.append(session, "tool", `Tool error: ${message}`, { toolCallId: call.id });
          await this.emit("tool.error", session, { tool: call.name, toolCallId: call.id, message });
        }
      }

      await this.options.sessions.save(session);
      void assistant;
    }

    throw new Error(`agent exceeded maxSteps=${maxSteps}`);
  }

  private async resolveSession(id?: string): Promise<Session> {
    if (!id) return this.options.sessions.create();
    const session = await this.options.sessions.get(id);
    if (!session) throw new Error(`session not found: ${id}`);
    return session;
  }

  private append(
    session: Session,
    role: AgentMessage["role"],
    content: string,
    extra: Partial<Pick<AgentMessage, "toolCalls" | "toolCallId">> = {},
  ): AgentMessage {
    const message: AgentMessage = {
      id: randomUUID(),
      role,
      content,
      createdAt: new Date().toISOString(),
      ...(extra.toolCalls === undefined ? {} : { toolCalls: extra.toolCalls }),
      ...(extra.toolCallId === undefined ? {} : { toolCallId: extra.toolCallId }),
    };
    session.messages.push(message);
    session.updatedAt = new Date().toISOString();
    return message;
  }

  private async emit(
    name: Parameters<HookRegistry["emit"]>[0]["name"],
    session: Session,
    payload: Parameters<HookRegistry["emit"]>[0]["payload"],
  ): Promise<void> {
    await this.hooks.emit({ name, sessionId: session.id, payload });
  }
}
