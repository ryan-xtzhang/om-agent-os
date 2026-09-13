import type { ModelProvider, Tool } from "@om-agent-os/core";

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): void {
    if (this.tools.has(tool.spec.name)) {
      throw new Error(`tool already registered: ${tool.spec.name}`);
    }
    this.tools.set(tool.spec.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }
}

export class ModelRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(`model provider already registered: ${provider.id}`);
    }
    this.providers.set(provider.id, provider);
  }

  get(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }
}
