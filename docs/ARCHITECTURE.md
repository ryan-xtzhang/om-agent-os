# Architecture

## 1. Positioning

`om-agent-os` is an **Agent Harness**, not a workflow framework and not a monolithic coding agent.

Its job is to make agents run predictably while keeping intelligence capabilities replaceable.

```text
Application / CLI / IDE / Server
              │
              ▼
      TypeScript Harness
              │
              ▼
       Extension Points
              │
              ▼
      Rust Execution Plane
              │
              ▼
              OS
```

## 2. Two-plane architecture

### TypeScript: control plane

Owns:

- Agent loop
- canonical messages
- model providers
- context assembly
- sessions
- tool registration
- plugin host
- hooks/events
- policy decisions
- CLI/SDK surfaces

It optimizes for ecosystem velocity and composition.

### Rust: execution plane

Owns:

- workspace path enforcement
- file mutation
- process spawning
- stdout/stderr capture
- timeout/cancellation foundation
- future PTY/job control
- future OS/container sandboxing
- future resource/network policy enforcement

It optimizes for trusted execution and systems control.

## 3. Stable kernel contracts

`@om-agent-os/core` must not depend on:

- a concrete LLM vendor
- MCP
- Git
- browser automation
- vector databases
- a particular CLI
- Node child process APIs
- Rust implementation details

The stable contracts are:

```text
Message
ModelProvider
Tool
ToolContext
Hook
Event
PermissionEngine
Session
SessionStore
Workspace
ExecutionClient
```

## 4. Runtime flow

```text
User input
   │
   ▼
Session append
   │
   ▼
Context build
   │
   ▼
BeforeModel hooks
   │
   ▼
ModelProvider.generate()
   │
   ├──── text only ───────────────► finish turn
   │
   └──── tool calls
            │
            ▼
      BeforeTool hooks
            │
            ▼
      PermissionEngine
       ┌────┼────┐
       │    │    │
     allow ask deny
       │
       ▼
      Tool.execute()
       │
       ├── pure/plugin tool ───────────────┐
       │                                   │
       └── sensitive system operation     │
                    │                      │
                    ▼                      │
             Rust execution plane         │
                    │                      │
                    └──────────┬───────────┘
                               ▼
                        Tool result
                               │
                               ▼
                         next model step
```

## 5. Plugin model

A plugin is a **packaging and registration mechanism**, not a feature type.

A plugin may contribute:

- tools
- hooks
- model providers
- context providers
- commands
- skills (future)
- events/subscriptions

Plugins receive a restricted `PluginContext`; they do not receive arbitrary mutable access to runtime internals.

## 6. Permission model

The core decision is intentionally tiny:

```text
ALLOW
ASK
DENY
```

The TypeScript permission engine makes the user/policy decision. The Rust runtime remains the final execution boundary for sensitive operations.

Future hardening must avoid trusting a third-party in-process plugin merely because it declared permissions. Strong plugin isolation may require subprocess/WASM execution.

## 7. Why JSONL over stdio first

v0.1 uses newline-delimited JSON because it is:

- language independent
- inspectable
- easy to test
- cross-platform enough for a first protocol
- compatible with a process boundary

The protocol can later move to Unix sockets, named pipes or another transport without changing core Agent/Tool contracts.

## 8. Dependency rules

Allowed:

```text
cli ───────► runtime ───────► core
sdk ───────► runtime ───────► core
tools ─────► core
runtime ───► core
plugin-sdk ► core
providers ─► core
Rust om-execd ► om-executor ► om-protocol
```

Forbidden:

```text
core ► CLI
core ► OpenAI/Anthropic SDK
core ► plugin implementations
core ► MCP
core ► Rust FFI
```

## 9. v0.1 non-goals

Do not put these into core:

- planner
- todo manager
- MCP client
- long-term memory
- RAG
- browser
- Git
- sub-agent scheduler
- cron/scheduler
- workflow DSL

They should prove the extension model instead.
