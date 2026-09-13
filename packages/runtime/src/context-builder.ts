import type { AgentMessage, ContextBuilder, ContextProvider, Session } from "@om-agent-os/core";

export class DefaultContextBuilder implements ContextBuilder {
  private readonly providers: ContextProvider[] = [];

  register(provider: ContextProvider): void {
    this.providers.push(provider);
    this.providers.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  async build(session: Session): Promise<AgentMessage[]> {
    const contributed: AgentMessage[] = [];
    for (const provider of this.providers) {
      contributed.push(...(await provider.provide(session)));
    }
    return [...contributed, ...session.messages];
  }
}
