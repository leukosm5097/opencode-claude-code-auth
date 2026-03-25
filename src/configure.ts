import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin, stdout } from "node:process"
import { applyEdits, modify, parse, printParseErrorCode, type ParseError } from "jsonc-parser"

export type Opts = {
  cwd: string
  file?: string
  global?: boolean
  yes?: boolean
}

const fmt = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
}

const block = {
  provider: {
    anthropic: {
      npm: "@ai-sdk/anthropic",
      name: "Anthropic",
      models: {
        "claude-sonnet-4-5": {
          name: "Claude Sonnet 4.5",
        },
        "claude-haiku-4-5": {
          name: "Claude Haiku 4.5",
        },
      },
    },
  },
  model: "anthropic/claude-sonnet-4-5",
  small_model: "anthropic/claude-haiku-4-5",
}

function home() {
  return process.env.XDG_CONFIG_HOME?.trim() || path.join(os.homedir(), ".config")
}

function data() {
  return process.env.XDG_DATA_HOME?.trim() || path.join(os.homedir(), ".local", "share")
}

async function exists(file: string) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

function fail(err: ParseError[]) {
  const first = err[0]
  return new Error(`Config parse error: ${printParseErrorCode(first.error)} at offset ${first.offset}`)
}

function load(text: string) {
  const err: ParseError[] = []
  const value = parse(text, err, {
    allowTrailingComma: true,
    disallowComments: false,
  })
  if (err.length) throw fail(err)
  return (value ?? {}) as Record<string, unknown>
}

function get(value: unknown, keys: string[]) {
  return keys.reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined
    return (acc as Record<string, unknown>)[key]
  }, value)
}

function set(text: string, keys: string[], value: unknown) {
  return applyEdits(
    text,
    modify(text, keys, value, {
      formattingOptions: fmt,
    }),
  )
}

function push(value: Record<string, unknown>, keys: string[], next: unknown) {
  let cur: Record<string, unknown> = value
  for (const key of keys.slice(0, -1)) {
    const child = cur[key]
    if (!child || typeof child !== "object") cur[key] = {}
    cur = cur[key] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]] = next as never
}

function init() {
  return `${JSON.stringify({ $schema: "https://opencode.ai/config.json" }, null, 2)}\n`
}

export async function locate(opts: Opts) {
  if (opts.file) return path.resolve(opts.cwd, opts.file)
  if (opts.global) {
    const dir = path.join(home(), "opencode")
    const json = path.join(dir, "opencode.json")
    const jsonc = path.join(dir, "opencode.jsonc")
    if (await exists(json)) return json
    if (await exists(jsonc)) return jsonc
    return json
  }
  const json = path.join(opts.cwd, "opencode.json")
  const jsonc = path.join(opts.cwd, "opencode.jsonc")
  if (await exists(json)) return json
  if (await exists(jsonc)) return jsonc
  return json
}

export async function plan(opts: Opts) {
  const file = await locate(opts)
  const text = (await exists(file)) ? await readFile(file, "utf8") : init()
  let next = text
  let cfg = load(text)
  const preview: Record<string, unknown> = {}
  const list: string[] = []
  const all: Array<[string[], unknown, string]> = [
    [["provider", "anthropic", "npm"], block.provider.anthropic.npm, "provider.anthropic.npm"],
    [["provider", "anthropic", "name"], block.provider.anthropic.name, "provider.anthropic.name"],
    [["provider", "anthropic", "models", "claude-sonnet-4-5", "name"], "Claude Sonnet 4.5", "provider.anthropic.models.claude-sonnet-4-5.name"],
    [["provider", "anthropic", "models", "claude-haiku-4-5", "name"], "Claude Haiku 4.5", "provider.anthropic.models.claude-haiku-4-5.name"],
    [["model"], block.model, "model"],
    [["small_model"], block.small_model, "small_model"],
  ]
  for (const [keys, value, label] of all) {
    if (get(cfg, keys) !== undefined) continue
    next = set(next, keys, value)
    cfg = load(next)
    push(preview, keys, value)
    list.push(label)
  }
  return {
    file,
    next,
    preview,
    list,
    changed: next !== text,
    created: !(await exists(file)),
  }
}

async function ask() {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  })
  const value = await rl.question("Apply changes? [y/N] ")
  rl.close()
  return value.trim().toLowerCase() === "y"
}

export async function apply(opts: Opts) {
  const out = await plan(opts)
  if (!out.changed) return out
  if (!opts.yes) {
    console.log(`File: ${out.file}`)
    console.log("Patch:")
    console.log(JSON.stringify(out.preview, null, 2))
    if (!(await ask())) throw new Error("Canceled.")
  }
  await mkdir(path.dirname(out.file), { recursive: true })
  await writeFile(out.file, out.next, "utf8")
  return out
}

export async function doctor(opts: Opts) {
  const file = await locate(opts)
  const has = await exists(file)
  const text = has ? await readFile(file, "utf8") : ""
  const cfg = has ? load(text) : {}
  const auth = path.join(data(), "opencode", "auth.json")
  const live = (await exists(auth)) ? load(await readFile(auth, "utf8")) : {}
  return {
    file,
    has,
    provider: get(cfg, ["provider", "anthropic"]) !== undefined,
    sonnet: get(cfg, ["provider", "anthropic", "models", "claude-sonnet-4-5"]) !== undefined,
    haiku: get(cfg, ["provider", "anthropic", "models", "claude-haiku-4-5"]) !== undefined,
    model: get(cfg, ["model"]),
    small: get(cfg, ["small_model"]),
    auth: get(live, ["anthropic", "type"]),
  }
}

export async function ready(opts: Opts) {
  const out = await doctor(opts)
  return out.provider && out.sonnet && out.haiku && typeof out.model === "string" && typeof out.small === "string"
}
