import type { JsonObject, Tool, ToolContext, ToolResult } from "@om-agent-os/core";
import { ExecutionToolBase } from "./execution-tool-base.js";

export class BashTool extends ExecutionToolBase implements Tool {
  readonly spec: Tool["spec"] = {
    name: "bash",
    description: "Run a Bash command in the workspace. High-risk: should require explicit permission.",
    permission: "process.shell",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string" },
        cwd: { type: "string" },
        timeoutMs: { type: "number" },
      },
      required: ["command"],
      additionalProperties: false,
    },
  };

  async execute(input: JsonObject, _context: ToolContext): Promise<ToolResult> {
    if (typeof input.command !== "string") throw new Error("command must be a string");
    const cwd = typeof input.cwd === "string" ? input.cwd : ".";
    const timeoutMs = typeof input.timeoutMs === "number" ? input.timeoutMs : 30_000;

    const result = this.unwrap(await this.execution.request({
      method: "process.exec",
      params: {
        program: "bash",
        args: ["-lc", input.command],
        cwd,
        timeoutMs,
      },
    })) as { exitCode?: unknown; stdout?: unknown; stderr?: unknown };

    const stdout = typeof result.stdout === "string" ? result.stdout : "";
    const stderr = typeof result.stderr === "string" ? result.stderr : "";
    const exitCode = typeof result.exitCode === "number" ? result.exitCode : -1;

    return {
      content: [`exitCode=${exitCode}`, stdout, stderr].filter(Boolean).join("\n"),
      isError: exitCode !== 0,
    };
  }
}
