use anyhow::{Context, Result};
use om_executor::{
    Executor, FsReadParams, FsReplaceParams, FsWriteParams, ProcessExecParams, WorkspaceGuard,
};
use om_protocol::{Request, Response};
use serde_json::{json, Value};
use std::env;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[tokio::main]
async fn main() -> Result<()> {
    let workspace = env::var("OM_WORKSPACE").unwrap_or_else(|_| ".".to_owned());
    let guard = WorkspaceGuard::new(&workspace)
        .with_context(|| format!("failed to initialize workspace: {workspace}"))?;
    let executor = Executor::new(guard);

    let stdin = tokio::io::stdin();
    let mut lines = BufReader::new(stdin).lines();
    let mut stdout = tokio::io::stdout();

    while let Some(line) = lines.next_line().await? {
        if line.trim().is_empty() {
            continue;
        }

        let response = match serde_json::from_str::<Request>(&line) {
            Ok(request) => handle(&executor, request).await,
            Err(error) => Response::failure("unknown", "INVALID_REQUEST", error.to_string()),
        };

        let encoded = serde_json::to_string(&response)?;
        stdout.write_all(encoded.as_bytes()).await?;
        stdout.write_all(b"\n").await?;
        stdout.flush().await?;
    }

    Ok(())
}

async fn handle(executor: &Executor, request: Request) -> Response {
    let id = request.id.clone();
    let result: Result<Value, anyhow::Error> = async {
        match request.method.as_str() {
            "system.ping" => Ok(json!({ "status": "ok" })),
            "fs.read" => {
                let params: FsReadParams = serde_json::from_value(request.params)?;
                Ok(serde_json::to_value(executor.fs_read(params).await?)?)
            }
            "fs.write" => {
                let params: FsWriteParams = serde_json::from_value(request.params)?;
                executor.fs_write(params).await?;
                Ok(json!({ "written": true }))
            }
            "fs.replace" => {
                let params: FsReplaceParams = serde_json::from_value(request.params)?;
                executor.fs_replace(params).await?;
                Ok(json!({ "edited": true }))
            }
            "process.exec" => {
                let params: ProcessExecParams = serde_json::from_value(request.params)?;
                Ok(serde_json::to_value(executor.process_exec(params).await?)?)
            }
            method => Err(anyhow::anyhow!("unsupported method: {method}")),
        }
    }
    .await;

    match result {
        Ok(value) => Response::success(id, value),
        Err(error) => {
            let message = error.to_string();
            let code = if message.contains("escapes workspace") {
                "WORKSPACE_VIOLATION"
            } else if message.contains("timed out") {
                "TIMEOUT"
            } else if message.contains("unsupported method") {
                "METHOD_NOT_FOUND"
            } else {
                "EXECUTION_ERROR"
            };
            Response::failure(id, code, message)
        }
    }
}
