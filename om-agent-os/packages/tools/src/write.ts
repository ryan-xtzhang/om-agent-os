import type { JsonObject, Tool, ToolContext, ToolResult } from "@om-agent-os/core";
import { ExecutionToolBase } from "./execution-tool-base.js";

export class WriteTool extends ExecutionToolBase implements Tool {
  readonly spec: Tool["spec"] = {
    name: "write",
    description: "Write a UTF-8 text file inside the workspace.",
    permission: "filesystem.write",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
      },
      required: ["path", "content"],
      additionalProperties: false,
    },
  };

  async execute(input: JsonObject, _context: ToolContext): Promise<ToolResult> {
    if (typeof input.path !== "string" || typeof input.content !== "string") {
      throw new Error("path and content must be strings");
    }
    this.unwrap(await this.execution.request({
      method: "fs.write",
      params: { path: input.path, content: input.content },
    }));
    return { content: `Wrote ${input.path}` };
  }
}
