import type { JsonObject, Tool, ToolContext, ToolResult } from "@om-agent-os/core";
import { ExecutionToolBase } from "./execution-tool-base.js";

export class EditTool extends ExecutionToolBase implements Tool {
  readonly spec: Tool["spec"] = {
    name: "edit",
    description: "Replace exactly one text occurrence in a workspace file.",
    permission: "filesystem.write",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        oldText: { type: "string" },
        newText: { type: "string" },
      },
      required: ["path", "oldText", "newText"],
      additionalProperties: false,
    },
  };

  async execute(input: JsonObject, _context: ToolContext): Promise<ToolResult> {
    if (
      typeof input.path !== "string" ||
      typeof input.oldText !== "string" ||
      typeof input.newText !== "string"
    ) {
      throw new Error("path, oldText and newText must be strings");
    }
    this.unwrap(await this.execution.request({
      method: "fs.replace",
      params: { path: input.path, oldText: input.oldText, newText: input.newText },
    }));
    return { content: `Edited ${input.path}` };
  }
}
