# om-agent-os

> TypeScript orchestrates intelligence. Rust enforces execution.

## 开源介绍

om-agent-os 是一个面向 AI Agent 的开源运行底座与 Harness，目标是提供小而稳定、可插拔的运行环境。TypeScript 负责 Agent Loop、会话、上下文、模型适配、工具、Hook 与插件体系，Rust 负责文件、进程、命令执行、权限校验和未来的沙箱隔离。核心只保留运行必需机制，read、write、edit、bash 为基础能力，MCP、Memory、RAG、Browser、Git、Skills、SubAgent 等均通过插件扩展。项目支持多 LLM Provider、CLI 与 SDK，让开发者统一组合模型、工具和插件，构建 Coding、DevOps、Research 等自定义 Agent。

## Architecture

```text
                         om-agent-os
                              │
              ┌───────────────┴────────────────┐
              │      TypeScript Harness       │
              │                                │
              │ Agent Loop / Session / Context│
              │ Model / Tool / Hook / Plugin  │
              │ CLI / SDK / Provider adapters │
              └───────────────┬────────────────┘
                              │ JSONL over stdio
                              ▼
              ┌────────────────────────────────┐
              │      Rust Execution Runtime    │
              │                                │
              │ FS / Process / Permission      │
              │ Timeout / Resource / Sandbox*  │
              └───────────────┬────────────────┘
                              │
                              ▼
                              OS

* sandbox/resource isolation are roadmap items.
```

## Design principles

1. **Kernel knows mechanisms, not features.** Core only defines stable runtime mechanisms and contracts.
2. **Everything optional is an extension.** MCP, memory, browser, Git, skills and sub-agents stay outside the kernel.
3. **Sensitive execution crosses one boundary.** File and process operations are routed through the Rust execution runtime.
4. **Agent messages are provider-neutral.** OpenAI/Anthropic/Gemini details do not leak into `@om-agent-os/core`.
5. **CLI is a surface, not the runtime.** CLI, SDK, server and IDE integrations reuse the same harness.

## Repository layout

```text
om-agent-os/
├── packages/                 # TypeScript control plane
│   ├── core/                 # Stable Agent/Model/Tool/Hook contracts
│   ├── runtime/              # Agent loop, registries, sessions, IPC client
│   ├── tools/                # read/write/edit/bash built-ins
│   ├── plugin-sdk/           # Public plugin contract
│   ├── sdk/                  # Embedding facade
│   ├── cli/                  # CLI surface
│   └── provider-mock/        # Deterministic provider for development/tests
├── crates/                   # Rust trusted execution plane
│   ├── om-protocol/          # JSONL protocol types
│   ├── om-executor/          # Workspace-safe FS/process execution
│   └── om-execd/             # Runtime daemon over stdin/stdout
├── plugins/
│   └── example-plugin/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROTOCOL.md
│   └── ROADMAP.md
├── Cargo.toml
├── package.json
└── pnpm-workspace.yaml
```

## v0.1 scope

Included now:

- provider-neutral message and model contracts
- tool registry and default agent loop
- in-memory session store
- hook and permission contracts
- plugin SDK and example plugin
- `read`, `write`, `edit`, `bash` tool adapters
- Rust workspace boundary enforcement
- Rust file read/write/replace and process execution
- JSONL stdio bridge between Node.js and Rust
- mock model provider and CLI skeleton

Explicitly **not** in core:

- MCP
- long-term memory
- RAG
- browser/web search
- Git/GitHub
- skills
- sub-agents
- scheduler/workflow engine

Those belong to plugins or later runtime packages.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Rust stable + Cargo

## Getting started

```bash
pnpm install
pnpm build
cargo build --workspace
```

Run the Rust execution daemon manually:

```bash
OM_WORKSPACE="$PWD" cargo run -p om-execd
```

Run the TypeScript CLI with the mock provider:

```bash
pnpm --filter @om-agent-os/cli start -- "hello om-agent-os"
```

For development, point the harness at the built Rust binary:

```bash
export OM_EXECD="$PWD/target/debug/om-execd"
```

## Status

This is a **v0.1 architecture scaffold**, not a production sandbox yet. The current Rust runtime enforces workspace path boundaries and process timeouts, but OS-level sandboxing, syscall/network policies and hardened plugin isolation remain roadmap work.

## License

MIT
