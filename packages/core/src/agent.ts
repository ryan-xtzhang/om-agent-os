export interface AgentRunOptions {
  sessionId?: string;
  maxSteps?: number;
  signal?: AbortSignal;
}

export interface AgentRunResult {
  sessionId: string;
  content: string;
  steps: number;
}

export interface AgentRuntime {
  run(input: string, options?: AgentRunOptions): Promise<AgentRunResult>;
}
