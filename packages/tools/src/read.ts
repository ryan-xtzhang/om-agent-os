import type { JsonObject, Tool, ToolContext, ToolResult } from "@om-agent-os/core";
import { ExecutionToolBase } from "./execution-tool-base.js";

export class ReadTool extends ExecutionToolBase implements Tool {
  readonly spec: Tool["spec"] = {
    name: "read",
    description: "Read a UTF-8 text file inside the workspace.",
    permission: "filesystem.read",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  };

  async execute(input: JsonObject, _context: ToolContext): Promise<ToolResult> {
    const path = input.path;
    if (typeof path !== "string") throw new Error("path must be a string");
    const result = this.unwrap(await this.execution.request({ method: "fs.read", params: { path } }));
    const content = (result as { content?: unknown } | undefined)?.content;
    if (typeof content !== "string") throw new Error("invalid fs.read response");
    return { content };
  }
}
