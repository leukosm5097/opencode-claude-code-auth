# Architecture

[README](../README.md) · [Setup](./setup.md) · [Auth Methods](./auth.md) · [Troubleshooting](./troubleshooting.md)

---

## Overview

The plugin has four main responsibilities:

1. **Auth method registration** — adds Claude Code session, browser sign-in, and API key methods to the Anthropic provider
2. **Credential loading and refresh** — reads and refreshes tokens for both auth paths
3. **Config patching** — adds Anthropic provider/model config to `opencode.json` on demand
4. **Request rewriting** — transforms headers, body, and responses for Anthropic OAuth compatibility

---

## Module Map

| File | Purpose |
|------|---------|
| `src/index.ts` | Plugin entrypoint. Registers auth methods, auth loader, config prompt. |
| `src/creds.ts` | Reads Claude credentials from macOS Keychain or `~/.claude/.credentials.json`. |
| `src/refresh.ts` | Refreshes Claude Code session by invoking `claude -p . --model claude-haiku-4-5`. |
| `src/oauth.ts` | Browser OAuth: PKCE generation, code exchange, token refresh. |
| `src/headers.ts` | Rewrites request headers, body, URLs, and response streams. |
| `src/configure.ts` | `configure` and `doctor` CLI helpers for `opencode.json` patching. |
| `src/cli.ts` | CLI entrypoint for `configure` / `doctor` commands. |
| `src/state.ts` | Persists the last active auth source (`claude-code-session` or `browser-oauth`). |

---

## Auth Flow

### Claude Code Session

```
User selects "Claude Code session"
  → hasClaude()? → readClaudeCreds() → ensureFresh()
    → isFresh? return creds
    → stale? → spawn claude CLI → re-read creds → return if fresh
  → sync to OpenCode auth storage
  → save source = "claude-code-session"
```

### Browser Sign-in

```
User selects "Browser sign-in"
  → authorize() → generate PKCE + state → return URL
  → user pastes code
  → exchange() → POST to Anthropic token endpoint → get access + refresh tokens
  → sync to OpenCode auth storage
  → save source = "browser-oauth"
```

### Request-time Refresh

```
Auth loader reads stored auth
  → source = "claude-code-session"? → readClaudeCreds() → ensureFresh()
  → source = "browser-oauth"? → check token expiry → refresh via OAuth if stale
  → build headers → rewrite body → fetch → rewrite response
  → on 401/403 → force refresh → retry once
```

---

## Config Flow

```
Plugin loads → ready()? → if false, show config prompt
  → user selects "Update this project"
  → apply({ cwd, yes: true })
    → locate opencode.json
    → plan() → diff only missing keys
    → write patched config

CLI: npx opencode-claude-code-auth configure
  → same apply() logic with interactive confirmation
```

**Keys added (only if missing):**

| Key | Value |
|-----|-------|
| `provider.anthropic.npm` | `@ai-sdk/anthropic` |
| `provider.anthropic.name` | `Anthropic` |
| `provider.anthropic.models.*` | Default model entries |
| `model` | `anthropic/claude-sonnet-4-5` |
| `small_model` | `anthropic/claude-haiku-4-5` |

---

## Request Rewriting

The auth loader wraps `fetch` to transform Anthropic requests:

| What | How |
|------|-----|
| Auth header | `Authorization: Bearer <access_token>` |
| Beta header | `anthropic-beta: oauth-2025-04-20,interleaved-thinking-2025-05-14` |
| User-Agent | `claude-cli/2.1.2 (external, cli)` |
| `x-api-key` | Removed (not used with OAuth) |
| System prompt | Prepends Claude Code identity prefix |
| Tool names | Prefixed with `mcp_` on outgoing, stripped on incoming |
| URL | Adds `?beta=true` to `/v1/messages` if missing |

---

## Stored State

| File | Purpose |
|------|---------|
| `~/.config/opencode-claude-code-auth/state.json` | Last active auth source (`claude-code-session` or `browser-oauth`) |
| `~/.local/share/opencode/auth.json` | OpenCode's auth storage (managed by OpenCode, written by plugin via `client.auth.set`) |

---

## Design Constraints

- **No silent config mutation** — config is only patched with explicit user consent (CLI prompt or `configure` command)
- **Claude Code dependency** — session auth requires `claude` to be installed and logged in; the plugin cannot fix a broken local Claude session
- **Web/TUI limitations** — plugin prompt metadata (install, config) is not available in all OpenCode surfaces; CLI gives the fullest experience
- **OAuth behavior** — browser auth depends on Anthropic's current OAuth endpoints and may need updates if they change

---

## See Also

- [Setup](./setup.md)
- [Auth Methods](./auth.md)
- [Troubleshooting](./troubleshooting.md)
