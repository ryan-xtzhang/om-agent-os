#!/usr/bin/env node
import process from "node:process";
import { MockModelProvider } from "@om-agent-os/provider-mock";
import {
  DefaultAgentRuntime,
  InMemorySessionStore,
  RustExecutionClient,
  StaticPermissionEngine,
  ToolRegistry,
} from "@om-agent-os/runtime";
import { BashTool, EditTool, ReadTool, WriteTool } from "@om-agent-os/tools";

const input = process.argv.slice(2).join(" ").trim() || "hello";
const workspaceRoot = process.cwd();

const execution = new RustExecutionClient({ workspaceRoot });
const tools = new ToolRegistry();
tools.register(new ReadTool(execution));
tools.register(new WriteTool(execution));
tools.register(new EditTool(execution));
tools.register(new BashTool(execution));

const agent = new DefaultAgentRuntime({
  model: new MockModelProvider(),
  tools,
  sessions: new InMemorySessionStore(),
  permissions: new StaticPermissionEngine({
    defaultDecision: "deny",
    rules: {
      "filesystem.read": "allow",
      "filesystem.write": "ask",
      "process.shell": "ask",
    },
  }),
  workspaceRoot,
});

try {
  const result = await agent.run(input);
  process.stdout.write(`${result.content}\n`);
} finally {
  await execution.close();
}
