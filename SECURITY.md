# Security

`om-agent-os` v0.1 is an architecture scaffold and **not yet a hardened sandbox**.

The Rust execution runtime currently provides a workspace path boundary for direct file APIs and validates process working directories. It does not yet isolate syscalls, network access, child processes, shell commands, credentials, or the host filesystem from commands executed inside the workspace.

Do not run untrusted prompts, plugins or shell commands on sensitive hosts until sandbox backends and plugin isolation are implemented.

Please report security issues privately to the maintainers rather than opening a public exploit report.
