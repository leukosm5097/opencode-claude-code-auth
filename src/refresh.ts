import { spawn } from "node:child_process"
import type { Creds } from "./creds.js"
import { hasClaude, readClaudeCreds } from "./creds.js"

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) return undefined
  return value
}

function timeoutMs() {
  const value = Number(process.env.CLAUDE_CODE_AUTH_REFRESH_TIMEOUT_MS)
  if (Number.isFinite(value) && value > 0) return value
  return 60_000
}

function refreshSkewMs() {
  const value = Number(process.env.CLAUDE_CODE_AUTH_REFRESH_SKEW_MS)
  if (Number.isFinite(value) && value >= 0) return value
  return 60_000
}

export function fresh(expires: number) {
  return expires > Date.now() + refreshSkewMs()
}

export function isFresh(creds: Creds) {
  return fresh(creds.expires)
}

type RefreshAttempt = {
  stdout: string
  stderr: string
  code: number | null
  timedOut: boolean
}

export async function refreshViaClaude(): Promise<RefreshAttempt> {
  if (!(await hasClaude())) throw new Error("Claude Code is not installed.")
  const model = env("CLAUDE_CODE_AUTH_REFRESH_MODEL") ?? "claude-haiku-4-5"
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", ".", "--model", model], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    })
    let stdout = ""
    let stderr = ""
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill("SIGTERM")
    }, timeoutMs())
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      resolve({
        stdout,
        stderr,
        code,
        timedOut,
      })
    })
  })
}

export async function ensureFresh(creds: Creds, force = false) {
  if (!force && isFresh(creds)) return creds
  let attempt: RefreshAttempt | undefined
  try {
    attempt = await refreshViaClaude()
  } catch (error) {
    throw new Error(error instanceof Error ? `Claude refresh failed. ${error.message}` : "Claude refresh failed.")
  }
  const next = await readClaudeCreds().catch(() => undefined)
  if (next && isFresh(next)) return next
  const details = [
    attempt.timedOut ? "refresh command timed out" : undefined,
    attempt.code !== 0 && attempt.code !== null ? `exit code ${attempt.code}` : undefined,
    attempt.stderr.trim() ? attempt.stderr.trim() : undefined,
  ]
    .filter(Boolean)
    .join(" | ")
  throw new Error(
    details
      ? `Claude session is still expired. ${details} Run \`claude auth login --claudeai\` and try again.`
      : "Claude session is still expired. Run `claude auth login --claudeai` and try again.",
  )
}
