import type { Plugin } from "@opencode-ai/plugin"
import { apply, ready } from "./configure.js"
import { type Creds, hasClaude, installText, readClaudeCreds } from "./creds.js"
import { buildHeaders, rewriteBody, rewriteResponse, rewriteUrl } from "./headers.js"
import { authorize, exchange, refresh as renew } from "./oauth.js"
import { ensureFresh, fresh } from "./refresh.js"
import { save, source } from "./state.js"

const PREFIX = "You are Claude Code, Anthropic's official CLI for Claude."
const CLAUDE = "claude-code-session"
const BROWSER = "browser-oauth"

async function sync(client: Parameters<Plugin>[0]["client"], creds: Creds, source: string) {
  await client.auth.set({
    path: { id: "anthropic" },
    body: {
      type: "oauth",
      access: creds.access,
      refresh: creds.refresh,
      expires: creds.expires,
    },
  })
  await save(source)
  return creds
}

function info(source: string) {
  if (source === CLAUDE) {
    return {
      label: "Claude Code session",
      text: "Use your Claude Code session. Best refresh behavior.",
    }
  }
  return {
    label: "Browser sign-in",
    text: "Sign in in the browser. No Claude Code install required.",
  }
}

async function browser(client: Parameters<Plugin>[0]["client"], auth: { refresh: string; access: string; expires: number }, force = false) {
  if (!force && fresh(auth.expires)) {
    return {
      access: auth.access,
      refresh: auth.refresh,
      expires: auth.expires,
      source: BROWSER,
    } satisfies Creds
  }
  return sync(client, { ...(await renew(auth.refresh)), source: BROWSER }, BROWSER)
}

async function claude(client: Parameters<Plugin>[0]["client"]) {
  return sync(client, await ensureFresh(await readClaudeCreds()), CLAUDE)
}

async function setup() {
  if (!(await hasClaude())) {
    throw new Error(installText())
  }
  return readClaudeCreds()
}

async function flow() {
  const creds = await setup()
  return ensureFresh(creds)
}

async function config(dir: string, inputs?: Record<string, string>) {
  if (inputs?.config !== "configure") return
  await apply({
    cwd: dir,
    yes: true,
  })
}

export const ClaudeCodeAuthPlugin: Plugin = async ({ client, directory }) => {
  const needs = !(await ready({ cwd: directory }))
  const prompt = needs
    ? [
        {
          type: "select" as const,
          key: "config",
          message: "Anthropic models are not configured. Update opencode.json after login?",
          options: [
            {
              label: "Update this project",
              value: "configure",
              hint: "Add the Anthropic provider and default models.",
            },
            {
              label: "Skip for now",
              value: "guide",
              hint: "Run `npx opencode-claude-code-auth configure` later.",
            },
          ],
        },
      ]
    : []
  const note = needs ? " This login can also update this project's opencode.json." : ""
  return {
    "experimental.chat.system.transform": async (input, output) => {
      if (input.model.providerID !== "anthropic") return
      output.system.unshift(PREFIX)
      if (output.system[1]) output.system[1] = `${PREFIX}\n\n${output.system[1]}`
    },
    auth: {
      provider: "anthropic",
      async loader(getAuth, provider) {
        const auth = await getAuth()
        if (auth.type !== "oauth") return {}
        const kind = (await source()) ?? CLAUDE

        for (const model of Object.values(provider.models)) {
          model.cost = {
            input: 0,
            output: 0,
            cache: {
              read: 0,
              write: 0,
            },
          }
        }

        return {
          apiKey: "",
          async fetch(input: RequestInfo | URL, init?: RequestInit) {
            let creds = kind === BROWSER ? await browser(client, auth) : await claude(client)

            const request = rewriteUrl(input)
            const headers = buildHeaders(init?.headers, creds.access)
            const body = rewriteBody(init?.body)

            let response = await fetch(request, {
              ...init,
              headers,
              body,
            })

            if (response.status === 401 || response.status === 403) {
              creds = kind === BROWSER ? await browser(client, auth, true) : await sync(client, await ensureFresh(creds, true), CLAUDE)
              response = await fetch(request, {
                ...init,
                headers: buildHeaders(init?.headers, creds.access),
                body,
              })
            }

            return rewriteResponse(response)
          },
        }
      },
      methods: [
        {
          label: info(CLAUDE).label,
          type: "oauth",
          prompts: prompt,
          authorize: async (inputs) => {
            const creds = await flow()
            return {
              url: "",
              instructions: info(CLAUDE).text + note,
              method: "auto" as const,
              callback: async () => {
                const next = await sync(client, creds, CLAUDE)
                await config(directory, inputs)
                return {
                  type: "success" as const,
                  access: next.access,
                  refresh: next.refresh,
                  expires: next.expires,
                }
              },
            }
          },
        },
        {
          label: info(BROWSER).label,
          type: "oauth",
          prompts: prompt,
          authorize: async (inputs) => {
            const oauth = authorize()
            return {
              url: oauth.url,
              instructions:
                info(BROWSER).text +
                note +
                " Open the link. Sign in. Paste the full code here. If you get `code#state`, paste all of it.",
              method: "code" as const,
              callback: async (code) => {
                const creds = await sync(client, { ...(await exchange(code, oauth.state, oauth.verifier)), source: BROWSER }, BROWSER)
                await config(directory, inputs)
                return {
                  type: "success" as const,
                  access: creds.access,
                  refresh: creds.refresh,
                  expires: creds.expires,
                }
              },
            }
          },
        },
        {
          label: "API key",
          type: "api",
        },
      ],
    },
  }
}

export default ClaudeCodeAuthPlugin
