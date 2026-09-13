import type { Hook, ModelProvider, Tool } from "@om-agent-os/core";

export interface Registrar<T> {
  register(value: T): void;
}

export interface PluginContext {
  tools: Registrar<Tool>;
  models: Registrar<ModelProvider>;
  hooks: Registrar<Hook>;
}

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  permissions?: string[];
}

export interface OmPlugin {
  readonly manifest: PluginManifest;
  activate(context: PluginContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
