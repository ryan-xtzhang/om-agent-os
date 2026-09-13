import type { Hook, HookEvent, HookEventName } from "@om-agent-os/core";

export class HookRegistry {
  private readonly hooks = new Map<HookEventName, Hook[]>();

  register(hook: Hook): void {
    const current = this.hooks.get(hook.event) ?? [];
    current.push(hook);
    this.hooks.set(hook.event, current);
  }

  async emit(event: HookEvent): Promise<void> {
    for (const hook of this.hooks.get(event.name) ?? []) {
      const result = await hook.handle(event);
      if (result?.stop) {
        throw new Error(`hook stopped execution: ${event.name}`);
      }
    }
  }
}
