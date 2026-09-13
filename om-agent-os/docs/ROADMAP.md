# Roadmap

## v0.1 — Harness foundation

- [x] provider-neutral core contracts
- [x] basic agent loop
- [x] tool/model registries
- [x] session store
- [x] hook and permission contracts
- [x] plugin SDK
- [x] Rust JSONL execution daemon
- [x] workspace-safe file operations
- [x] process timeout
- [x] read/write/edit/bash adapters
- [ ] real LLM provider package
- [ ] interactive ASK permission UI
- [ ] end-to-end integration tests

## v0.2 — Developer experience

- [ ] streaming model output
- [ ] streaming process output
- [ ] cancellation tokens
- [ ] structured logging/tracing
- [ ] config scopes: default/user/project/runtime
- [ ] plugin discovery and manifest validation
- [ ] hot-reload for local plugins
- [ ] deterministic transcript fixtures

## v0.3 — Execution hardening

- [ ] PTY/job manager
- [ ] CPU/memory/time limits
- [ ] process-tree termination
- [ ] network policy abstraction
- [ ] Linux sandbox backend
- [ ] container executor backend
- [ ] audit log

## Later — ecosystem plugins

- MCP
- Git/GitHub
- Skills
- Memory
- Browser
- RAG
- Sub-agent orchestration
- IDE integration
