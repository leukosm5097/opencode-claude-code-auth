import { mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const file = path.join(os.homedir(), ".config", "opencode-claude-code-auth", "state.json")

async function read() {
  try {
    return JSON.parse(await readFile(file, "utf8")) as {
      anthropic?: {
        source?: string
      }
    }
  } catch {
    return {}
  }
}

export async function source() {
  return (await read()).anthropic?.source
}

export async function save(source: string) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify({ anthropic: { source } }, null, 2), { mode: 0o600 })
}
