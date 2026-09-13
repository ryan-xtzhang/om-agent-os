import type { JsonObject, Tool, ToolContext, ToolResult } from "@om-agent-os/core";
import type { OmPlugin } from "@om-agent-os/plugin-sdk";

class HelloTool implements Tool {
  readonly spec: Tool["spec"] = {
    name: "hello",
    description: "Return a greeting from an example plugin.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      additionalProperties: false,
    },
  };

  async execute(input: JsonObject, _context: ToolContext): Promise<ToolResult> {
    const name = typeof input.name === "string" ? input.name : "world";
    return { content: `Hello, ${name}!` };
  }
}

const plugin: OmPlugin = {
  manifest: {
    name: "example-plugin",
    version: "0.1.0",
    description: "Minimal plugin example",
  },
  activate(context) {
    context.tools.register(new HelloTool());
  },
};

export default plugin;
