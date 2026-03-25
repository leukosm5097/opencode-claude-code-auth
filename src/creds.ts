import { access, readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const exec = promisify(execFile)

const DEFAULT_KEYCHAIN_SERVICE = "Claude Code-credentials"

export type Creds = {
  access: string
  refresh: string
  expires: number
  subscriptionType?: string
  rateLimitTier?: string
  source: string
}

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) return undefined
  return value
}

async function exists(file: string) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

function parse(raw: string, source: string): Creds | undefined {
  const value = JSON.parse(raw) as Record<string, unknown>
  const oauth = (value.claudeAiOauth as Record<string, unknown> | undefined) ?? value
  if (typeof oauth.accessToken !== "string") return
  if (typeof oauth.refreshToken !== "string") return
  if (typeof oauth.expiresAt !== "number") return
  return {
    access: oauth.accessToken,
    refresh: oauth.refreshToken,
    expires: oauth.expiresAt,
    subscriptionType: typeof oauth.subscriptionType === "string" ? oauth.subscriptionType : undefined,
    rateLimitTier: typeof oauth.rateLimitTier === "string" ? oauth.rateLimitTier : undefined,
    source,
  }
}

export function credsPath() {
  const custom = env("CLAUDE_CODE_AUTH_CREDENTIALS_PATH")
  if (custom) return custom
  return path.join(os.homedir(), ".claude", ".credentials.json")
}

export async function hasClaude() {
  try {
    await exec("sh", ["-lc", "command -v claude"], {
      timeout: 5_000,
      maxBuffer: 1024 * 1024,
    })
    return true
  } catch {
    return false
  }
}

export async function readFileCreds(file = credsPath()) {
  if (!(await exists(file))) return
  return parse(await readFile(file, "utf8"), file)
}

export async function readKeychainCreds() {
  if (process.platform !== "darwin") return
  const service = env("CLAUDE_CODE_AUTH_KEYCHAIN_SERVICE") ?? DEFAULT_KEYCHAIN_SERVICE
  try {
    const result = await exec("security", ["find-generic-password", "-s", service, "-w"], {
      timeout: 5_000,
      maxBuffer: 1024 * 1024,
    })
    return parse(result.stdout, `keychain:${service}`)
  } catch {
    return
  }
}

export async function readClaudeCreds() {
  const keychain = await readKeychainCreds()
  if (keychain) return keychain
  const file = await readFileCreds()
  if (file) return file
  throw new Error("Claude Code is installed, but no session was found. Run `claude auth login --claudeai` and try again.")
}

export async function hasClaudeCreds() {
  try {
    await readClaudeCreds()
    return true
  } catch {
    return false
  }
}

export function installText() {
  return "Claude Code is not installed. Install it from https://claude.ai/download, then try again. Or use Browser sign-in."
}
