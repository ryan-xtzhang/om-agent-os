use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

#[derive(Debug, Clone)]
pub struct WorkspaceGuard {
    root: PathBuf,
}

impl WorkspaceGuard {
    pub fn new(root: impl AsRef<Path>) -> Result<Self> {
        let root = std::fs::canonicalize(root.as_ref())
            .with_context(|| format!("cannot resolve workspace: {}", root.as_ref().display()))?;
        Ok(Self { root })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn resolve_existing(&self, input: impl AsRef<Path>) -> Result<PathBuf> {
        let candidate = self.join(input.as_ref());
        let canonical = std::fs::canonicalize(&candidate)
            .with_context(|| format!("cannot resolve path: {}", candidate.display()))?;
        self.ensure_inside(&canonical)?;
        Ok(canonical)
    }

    pub fn resolve_for_write(&self, input: impl AsRef<Path>) -> Result<PathBuf> {
        let candidate = self.join(input.as_ref());

        if candidate.exists() {
            let canonical = std::fs::canonicalize(&candidate)
                .with_context(|| format!("cannot resolve path: {}", candidate.display()))?;
            self.ensure_inside(&canonical)?;
            return Ok(canonical);
        }

        let parent = candidate.parent().ok_or_else(|| anyhow!("path has no parent"))?;
        std::fs::create_dir_all(parent)?;
        let canonical_parent = std::fs::canonicalize(parent)
            .with_context(|| format!("cannot resolve parent: {}", parent.display()))?;
        self.ensure_inside(&canonical_parent)?;
        let file_name = candidate
            .file_name()
            .ok_or_else(|| anyhow!("path has no file name"))?;
        Ok(canonical_parent.join(file_name))
    }

    fn join(&self, input: &Path) -> PathBuf {
        if input.is_absolute() {
            input.to_path_buf()
        } else {
            self.root.join(input)
        }
    }

    fn ensure_inside(&self, path: &Path) -> Result<()> {
        if path == self.root || path.starts_with(&self.root) {
            Ok(())
        } else {
            Err(anyhow!("path escapes workspace: {}", path.display()))
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsReadParams {
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct FsReadResult {
    pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsWriteParams {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FsReplaceParams {
    pub path: String,
    pub old_text: String,
    pub new_text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessExecParams {
    pub program: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default = "default_cwd")]
    pub cwd: String,
    #[serde(default = "default_timeout_ms")]
    pub timeout_ms: u64,
}

fn default_cwd() -> String {
    ".".to_owned()
}

fn default_timeout_ms() -> u64 {
    30_000
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessExecResult {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[derive(Debug, Clone)]
pub struct Executor {
    workspace: WorkspaceGuard,
}

impl Executor {
    pub fn new(workspace: WorkspaceGuard) -> Self {
        Self { workspace }
    }

    pub async fn fs_read(&self, params: FsReadParams) -> Result<FsReadResult> {
        let path = self.workspace.resolve_existing(params.path)?;
        let content = tokio::fs::read_to_string(path).await?;
        Ok(FsReadResult { content })
    }

    pub async fn fs_write(&self, params: FsWriteParams) -> Result<()> {
        let path = self.workspace.resolve_for_write(params.path)?;
        tokio::fs::write(path, params.content).await?;
        Ok(())
    }

    pub async fn fs_replace(&self, params: FsReplaceParams) -> Result<()> {
        let path = self.workspace.resolve_existing(params.path)?;
        let content = tokio::fs::read_to_string(&path).await?;
        let count = content.matches(&params.old_text).count();
        if count != 1 {
            return Err(anyhow!(
                "oldText must occur exactly once, found {count} occurrence(s)"
            ));
        }
        let updated = content.replacen(&params.old_text, &params.new_text, 1);
        tokio::fs::write(path, updated).await?;
        Ok(())
    }

    pub async fn process_exec(&self, params: ProcessExecParams) -> Result<ProcessExecResult> {
        if params.program.trim().is_empty() {
            return Err(anyhow!("program must not be empty"));
        }

        let cwd = self.workspace.resolve_existing(params.cwd)?;
        if !cwd.is_dir() {
            return Err(anyhow!("cwd is not a directory: {}", cwd.display()));
        }

        let mut command = Command::new(&params.program);
        command
            .args(&params.args)
            .current_dir(cwd)
            .kill_on_drop(true);

        let output = timeout(Duration::from_millis(params.timeout_ms), command.output())
            .await
            .map_err(|_| anyhow!("process timed out after {}ms", params.timeout_ms))??;

        Ok(ProcessExecResult {
            exit_code: output.status.code().unwrap_or(-1),
            stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
            stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        })
    }
}
