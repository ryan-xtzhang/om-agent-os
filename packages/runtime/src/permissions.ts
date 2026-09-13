import type {
  PermissionDecision,
  PermissionEngine,
  PermissionRequest,
} from "@om-agent-os/core";

export interface StaticPermissionOptions {
  defaultDecision?: PermissionDecision;
  rules?: Record<string, PermissionDecision>;
}

export class StaticPermissionEngine implements PermissionEngine {
  constructor(private readonly options: StaticPermissionOptions = {}) {}

  async decide(request: PermissionRequest): Promise<PermissionDecision> {
    return (
      this.options.rules?.[request.tool.name] ??
      this.options.rules?.[request.tool.permission ?? ""] ??
      this.options.defaultDecision ??
      "ask"
    );
  }
}
