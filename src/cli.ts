#!/usr/bin/env node

import { apply, doctor } from "./configure.js"

function help() {
  console.log(`opencode-claude-code-auth

Commands:
  configure   Add Anthropic config to opencode.json
  doctor      Check Anthropic auth and config
  help        Show this message

Options:
  --file <path>   Use a specific opencode.json/jsonc file
  --global        Use global OpenCode config
  -y, --yes       Skip confirmation
`)
}

function args(list: string[]) {
  const out: {
    file?: string
    global?: boolean
    yes?: boolean
  } = {}
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    if (item === "--file") out.file = list[++i]
    if (item === "--global") out.global = true
    if (item === "-y" || item === "--yes") out.yes = true
  }
  return out
}

async function main() {
  const [cmd = "help", ...rest] = process.argv.slice(2)
  const opts = {
    cwd: process.cwd(),
    ...args(rest),
  }
  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    help()
    return
  }
  if (cmd === "configure") {
    const out = await apply(opts)
    if (!out.changed) {
      console.log(`Anthropic config already exists: ${out.file}`)
      return
    }
    console.log(`Updated: ${out.file}`)
    console.log(`Added: ${out.list.join(", ")}`)
    return
  }
  if (cmd === "doctor" || cmd === "status") {
    const out = await doctor(opts)
    console.log(JSON.stringify(out, null, 2))
    return
  }
  help()
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
