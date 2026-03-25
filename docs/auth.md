# Auth Methods

[README](../README.md) · [Setup](./setup.md) · [Troubleshooting](./troubleshooting.md) · [Architecture](./architecture.md)

---

## Overview

| Method | Best for | Needs Claude Code | Auto refresh | Refresh mechanism |
|--------|----------|-------------------|--------------|-------------------|
| Claude Code session | Claude Code users | ✅ Yes | ✅ Best path | Triggers `claude` CLI |
| Browser sign-in | No Claude Code install | ❌ No | ✅ Yes | Anthropic OAuth refresh tokens |
| API key | Simple static auth | ❌ No | ❌ No | N/A |

---

## Claude Code Session

**Best for:** users who already use Claude Code.

### Requirements

- `claude` CLI installed ([claude.ai/download](https://claude.ai/download))
- A valid Claude Code session (`claude auth login --claudeai`)

### How It Works

1. Plugin reads local Claude credentials (macOS Keychain first, then `~/.claude/.credentials.json`)
2. If credentials are stale, triggers refresh via `claude -p . --model claude-haiku-4-5`
3. Re-reads credentials after the refresh attempt
4. Stores OAuth tokens in OpenCode auth storage

### Credential Source Priority

| Priority | Source | Platform |
|----------|--------|----------|
| 1 | macOS Keychain (`Claude Code-credentials`) | macOS only |
| 2 | `~/.claude/.credentials.json` | All platforms |

> **Note**: Override with `CLAUDE_CODE_AUTH_CREDENTIALS_PATH` or `CLAUDE_CODE_AUTH_KEYCHAIN_SERVICE` env vars.

### Refresh Behavior

- Refresh triggers when credentials expire (with 60s skew by default)
- On 401/403 responses, a forced refresh is attempted
- If refresh fails, you'll see: `Claude session is still expired. Run \`claude auth login --claudeai\` and try again.`

---

## Browser Sign-in

**Best for:** users who do not want Claude Code installed.

### How It Works

1. Plugin generates PKCE values and an Anthropic OAuth authorization URL
2. You open the URL in your browser and sign in
3. Paste the returned authorization code back into OpenCode
4. Plugin exchanges the code for access + refresh tokens
5. Tokens are stored in OpenCode auth storage

### Browser Flow

```
opencode auth login -p anthropic → Browser sign-in → Open URL → Sign in → Paste code
```

> **Tip**: If you receive a `code#state` value, paste the whole thing.

### Refresh Behavior

- Refresh tokens are used to obtain new access tokens automatically
- On 401/403 responses, a forced token refresh is attempted
- If the refresh token itself is invalid, you'll need to re-login

---

## API Key

**Best for:** users who want the simplest path.

### How It Works

- Uses standard Anthropic API key authentication
- No plugin-managed OAuth, no refresh logic
- OpenCode handles this path directly

---

## Which One Should I Use?

| Your situation | Recommended method |
|----------------|--------------------|
| Already use Claude Code | **Claude Code session** |
| Don't want to install Claude Code | **Browser sign-in** |
| Have an Anthropic API key | **API key** |
| Want the best auto-refresh | **Claude Code session** |
| Using a headless/CI environment | **API key** |

---

## See Also

- [Setup](./setup.md)
- [Troubleshooting](./troubleshooting.md)
- [Architecture](./architecture.md)
