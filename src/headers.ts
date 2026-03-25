const TOOL_PREFIX = "mcp_"

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) return undefined
  return value
}

function betas() {
  const value = env("CLAUDE_CODE_AUTH_BETAS")
  if (!value) return ["oauth-2025-04-20", "interleaved-thinking-2025-05-14"]
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function userAgent() {
  return env("CLAUDE_CODE_AUTH_USER_AGENT") ?? "claude-cli/2.1.2 (external, cli)"
}

export function buildHeaders(input?: HeadersInit, access?: string) {
  const headers = new Headers(input)
  const incoming = headers.get("anthropic-beta")
  const merged = [...new Set([...betas(), ...(incoming ? incoming.split(",").map((item) => item.trim()) : [])])]
    .filter(Boolean)
    .join(",")
  if (access) headers.set("authorization", `Bearer ${access}`)
  headers.set("anthropic-beta", merged)
  headers.set("user-agent", userAgent())
  headers.delete("x-api-key")
  return headers
}

function renameText(value: string) {
  return value.replace(/OpenCode/g, "Claude Code").replace(/opencode/gi, "Claude")
}

export function rewriteBody(body: BodyInit | null | undefined) {
  if (!body || typeof body !== "string") return body
  try {
    const value = JSON.parse(body) as Record<string, any>
    if (typeof value.system === "string") {
      value.system = renameText(value.system)
    }
    if (Array.isArray(value.system)) {
      value.system = value.system.map((item) => {
        if (item?.type !== "text" || typeof item.text !== "string") return item
        return {
          ...item,
          text: renameText(item.text),
        }
      })
    }
    if (Array.isArray(value.tools)) {
      value.tools = value.tools.map((item) => ({
        ...item,
        name: typeof item?.name === "string" ? `${TOOL_PREFIX}${item.name}` : item?.name,
      }))
    }
    if (Array.isArray(value.messages)) {
      value.messages = value.messages.map((message) => {
        if (!Array.isArray(message?.content)) return message
        return {
          ...message,
          content: message.content.map((part: any) => {
            if (part?.type !== "tool_use" || typeof part.name !== "string") return part
            return {
              ...part,
              name: `${TOOL_PREFIX}${part.name}`,
            }
          }),
        }
      })
    }
    return JSON.stringify(value)
  } catch {
    return body
  }
}

export function rewriteUrl(input: RequestInfo | URL) {
  let url: URL
  try {
    url = input instanceof URL ? new URL(input) : new URL(input instanceof Request ? input.url : input.toString())
  } catch {
    return input
  }
  if (url.pathname === "/v1/messages" && !url.searchParams.has("beta")) {
    url.searchParams.set("beta", "true")
  }
  return url
}

export async function rewriteResponse(response: Response) {
  if (!response.body) return response
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const chunk = await reader.read()
      if (chunk.done) {
        controller.close()
        return
      }
      let text = decoder.decode(chunk.value, { stream: true })
      text = text.replace(/"name"\s*:\s*"mcp_([^"]+)"/g, '"name": "$1"')
      controller.enqueue(encoder.encode(text))
    },
  })
  return new Response(stream, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
}
