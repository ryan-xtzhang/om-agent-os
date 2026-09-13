import type { OmPlugin } from "@om-agent-os/plugin-sdk";
import { HookRegistry } from "./hooks.js";
import { ModelRegistry, ToolRegistry } from "./registry.js";

export class PluginHost {
  private readonly active = new Map<string, OmPlugin>();

  constructor(
    private readonly tools: ToolRegistry,
    private readonly models: ModelRegistry,
    private readonly hooks: HookRegistry,
  ) {}

  async activate(plugin: OmPlugin): Promise<void> {
    if (this.active.has(plugin.manifest.name)) {
      throw new Error(`plugin already active: ${plugin.manifest.name}`);
    }
    await plugin.activate({
      tools: this.tools,
      models: this.models,
      hooks: this.hooks,
    });
    this.active.set(plugin.manifest.name, plugin);
  }

  async deactivate(name: string): Promise<void> {
    const plugin = this.active.get(name);
    if (!plugin) return;
    await plugin.deactivate?.();
    this.active.delete(name);
  }

  list(): OmPlugin[] {
    return [...this.active.values()];
  }
}
