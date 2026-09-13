import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface, type Interface } from "node:readline";
import { randomUUID } from "node:crypto";
import type {
  ExecutionClient,
  ExecutionRequest,
  ExecutionResponse,
  JsonValue,
} from "@om-agent-os/core";

interface WireResponse {
  id: string;
  ok: boolean;
  result?: JsonValue;
  error?: { code: string; message: string };
}

interface Pending {
  resolve: (response: ExecutionResponse) => void;
  reject: (error: Error) => void;
}

export interface RustExecutionClientOptions {
  binary?: string;
  workspaceRoot: string;
}

export class RustExecutionClient implements ExecutionClient {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly lines: Interface;
  private readonly pending = new Map<string, Pending>();

  constructor(options: RustExecutionClientOptions) {
    const binary = options.binary ?? process.env.OM_EXECD ?? "om-execd";
    this.child = spawn(binary, [], {
      env: { ...process.env, OM_WORKSPACE: options.workspaceRoot },
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.lines = createInterface({ input: this.child.stdout });
    this.lines.on("line", (line) => this.onLine(line));

    this.child.stderr.on("data", (chunk: Buffer) => {
      process.stderr.write(`[om-execd] ${chunk.toString()}`);
    });

    this.child.on("error", (error) => {
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });

    this.child.on("exit", (code, signal) => {
      const error = new Error(`om-execd exited (code=${code}, signal=${signal})`);
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });
  }

  request(request: ExecutionRequest): Promise<ExecutionResponse> {
    const id = randomUUID();
    const payload = JSON.stringify({ id, method: request.method, params: request.params });

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.child.stdin.write(`${payload}\n`, (error) => {
        if (error) {
          this.pending.delete(id);
          reject(error);
        }
      });
    });
  }

  async close(): Promise<void> {
    this.lines.close();
    this.child.stdin.end();
    this.child.kill();
  }

  private onLine(line: string): void {
    let message: WireResponse;
    try {
      message = JSON.parse(line) as WireResponse;
    } catch {
      return;
    }

    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);

    const response: ExecutionResponse = message.ok
      ? { ok: true, ...(message.result === undefined ? {} : { result: message.result }) }
      : { ok: false, error: message.error ?? { code: "UNKNOWN", message: "unknown error" } };

    pending.resolve(response);
  }
}
