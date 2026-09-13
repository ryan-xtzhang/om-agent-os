import type { ExecutionClient, ExecutionResponse } from "@om-agent-os/core";

export abstract class ExecutionToolBase {
  constructor(protected readonly execution: ExecutionClient) {}

  protected unwrap(response: ExecutionResponse): unknown {
    if (!response.ok) {
      throw new Error(`${response.error?.code ?? "EXECUTION_ERROR"}: ${response.error?.message ?? "unknown error"}`);
    }
    return response.result;
  }
}
