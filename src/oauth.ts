import { createHash, randomBytes } from "node:crypto"
import { userAgent } from "./headers.js"

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) return undefined
  return value
}

function client() {
  return env("ANTHROPIC_CLIENT_ID") ?? "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
}

function redirect() {
  return env("ANTHROPIC_REDIRECT_URI") ?? "https://console.anthropic.com/oauth/code/callback"
}

function scope() {
  return env("ANTHROPIC_SCOPE") ?? "org:create_api_key user:profile user:inference"
}

function authUrl() {
  return env("ANTHROPIC_AUTH_URL") ?? "https://claude.ai/oauth/authorize"
}

function tokenUrl() {
  return env("ANTHROPIC_TOKEN_URL") ?? "https://console.anthropic.com/v1/oauth/token"
}

function b64(input: Buffer) {
  return input.toString("base64url")
}

function sha(input: string) {
  return createHash("sha256").update(input).digest()
}

function parse(text: string) {
  const [code, given] = text.trim().split("#")
  return {
    code,
    state: given,
  }
}

async function token(params: Record<string, string>) {
  const body = new URLSearchParams(params)
  const res = await fetch(tokenUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": userAgent(),
    },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Anthropic token request failed. HTTP ${res.status}.`)
  const json = (await res.json()) as Record<string, unknown>
  if (typeof json.access_token !== "string") throw new Error("Anthropic token response is missing access_token.")
  if (typeof json.refresh_token !== "string") throw new Error("Anthropic token response is missing refresh_token.")
  if (typeof json.expires_in !== "number") throw new Error("Anthropic token response is missing expires_in.")
  return {
    access: json.access_token,
    refresh: json.refresh_token,
    expires: Date.now() + json.expires_in * 1000,
  }
}

export function authorize() {
  const verifier = b64(randomBytes(32))
  const state = b64(randomBytes(24))
  const url = new URL(authUrl())
  url.searchParams.set("code", "true")
  url.searchParams.set("client_id", client())
  url.searchParams.set("response_type", "code")
  url.searchParams.set("redirect_uri", redirect())
  url.searchParams.set("scope", scope())
  url.searchParams.set("code_challenge", b64(sha(verifier)))
  url.searchParams.set("code_challenge_method", "S256")
  url.searchParams.set("state", state)
  return {
    state,
    verifier,
    url: url.toString(),
  }
}

export async function exchange(text: string, state: string, verifier: string) {
  const parsed = parse(text)
  if (!parsed.code) throw new Error("Authorization code required.")
  if (parsed.state && parsed.state !== state) throw new Error("Authorization state mismatch.")
  return token({
    code: parsed.code,
    state,
    grant_type: "authorization_code",
    client_id: client(),
    redirect_uri: redirect(),
    code_verifier: verifier,
  })
}

export async function refresh(refresh: string) {
  return token({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: client(),
  })
}
