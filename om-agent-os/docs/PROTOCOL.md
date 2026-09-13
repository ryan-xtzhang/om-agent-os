# TS ↔ Rust Protocol

v0.1 uses one JSON object per line over stdin/stdout.

## Request

```json
{
  "id": "1",
  "method": "fs.read",
  "params": {
    "path": "README.md"
  }
}
```

## Response

Success:

```json
{
  "id": "1",
  "ok": true,
  "result": {
    "content": "..."
  }
}
```

Failure:

```json
{
  "id": "1",
  "ok": false,
  "error": {
    "code": "WORKSPACE_VIOLATION",
    "message": "path escapes workspace"
  }
}
```

## v0.1 methods

### `system.ping`

No parameters.

### `fs.read`

```json
{ "path": "relative/or/absolute/in/workspace" }
```

### `fs.write`

```json
{ "path": "src/a.ts", "content": "..." }
```

### `fs.replace`

```json
{
  "path": "src/a.ts",
  "oldText": "before",
  "newText": "after"
}
```

The operation fails when `oldText` does not occur exactly once.

### `process.exec`

```json
{
  "program": "git",
  "args": ["status", "--short"],
  "cwd": ".",
  "timeoutMs": 30000
}
```

Returns:

```json
{
  "exitCode": 0,
  "stdout": "...",
  "stderr": "..."
}
```

## Security notes

- Paths are canonicalized against `OM_WORKSPACE`.
- Parent directory traversal outside the workspace is rejected.
- Process `cwd` must remain within the workspace.
- v0.1 does **not** yet provide syscall, network or container sandboxing.
- Shell execution is intentionally a separate higher-risk tool adapter.
