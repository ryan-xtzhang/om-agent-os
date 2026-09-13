import type { ModelProvider, ModelRequest, ModelResponse } from "@om-agent-os/core";

export class MockModelProvider implements ModelProvider {
  readonly id = "mock";

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const last = [...request.messages].reverse().find((message) => message.role === "user");
    return {
      content: `mock: ${last?.content ?? ""}`,
      finishReason: "stop",
    };
  }
}
