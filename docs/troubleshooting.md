# Troubleshooting

[README](../README.md) · [Setup](./setup.md) · [Auth Methods](./auth.md) · [Architecture](./architecture.md)

---

> **Quick Reset**: Most issues can be resolved by running `npx opencode-claude-code-auth configure` and `opencode auth login -p anthropic` again.

---

## Configuration Paths

| File | Path |
|------|------|
| Project config | `./opencode.json` or `./opencode.jsonc` |
| Global config | `~/.config/opencode/opencode.json` |
| Plugin state | `~/.config/opencode-claude-code-auth/state.json` |
| OpenCode auth | `~/.local/share/opencode/auth.json` |
| Claude credentials | `~/.claude/.credentials.json` |

> **Note**: `~` resolves to your user home directory on all platforms.

---

## Anthropic Models Not Found

**Error:**
```
opencode models anthropic returns empty or missing models
```

**Cause:** Anthropic provider is not configured in `opencode.json`.

**Fix:**
1. Run:
   ```bash
   npx opencode-claude-code-auth doctor
   ```
2. If provider/models are missing:
   ```bash
   npx opencode-claude-code-auth configure
   ```
3. Or re-login and select `Update this project`:
   ```bash
   opencode auth login -p anthropic
   ```

---

## Claude Code Not Installed

**Error:**
```
Claude Code is not installed. Install it from https://claude.ai/download, then try again. Or use Browser sign-in.
```

**Cause:** `claude` is not on your `PATH`.

**Fix:**
1. Install Claude Code: [claude.ai/download](https://claude.ai/download)
2. Retry login
3. Or use `Browser sign-in` instead

---

## Claude Session Missing

**Error:**
```
Claude Code is installed, but no session was found. Run `claude auth login --claudeai` and try again.
```

**Cause:** Claude Code is installed but has no active session.

**Fix:**
```bash
claude auth login --claudeai
```
Then retry `opencode auth login -p anthropic`.

---

## Claude Session Expired

**Error:**
```
Claude session is still expired. Run `claude auth login --claudeai` and try again.
```

**Cause:** Claude Code refresh did not produce fresh credentials. This can happen if your Claude session is too old or the refresh token is invalid.

**Fix:**
```bash
claude auth login --claudeai
```
Then retry `opencode auth login -p anthropic`.

---

## Browser Sign-in Fails

**Error:** Browser sign-in does not complete, or pasted code is rejected.

**Cause:** Invalid code, expired OAuth state, or bad callback data.

**Fix:**
1. Start a fresh login:
   ```bash
   opencode auth login -p anthropic
   ```
2. Select `Browser sign-in`
3. Use the new URL and new code
4. If the returned value looks like `code#state`, paste all of it

---

## Configure Command Did Nothing

**Error:**
```
Anthropic config already exists: ./opencode.json
```

**Cause:** All required keys are already present.

**Fix:**
- Run `npx opencode-claude-code-auth doctor` to confirm the target file
- Use `--file <path>` or `--global` to target a different config file

---

## Config Parse Error

**Error:**
```
Config parse error: ... at offset ...
```

**Cause:** Your `opencode.json` or `opencode.jsonc` has invalid syntax.

**Fix:**
1. Fix the JSON/JSONC syntax in the file
2. Rerun:
   ```bash
   npx opencode-claude-code-auth configure
   ```

---

## Configuration Key Typo

The correct key is `plugin` (singular):

```json
// ✅ CORRECT
{ "plugin": ["opencode-claude-code-auth"] }
```

```json
// ❌ WRONG — will cause "Unrecognized key" error
{ "plugins": ["opencode-claude-code-auth"] }
```

---

## Useful Commands

```bash
npx opencode-claude-code-auth doctor      # Check status
npx opencode-claude-code-auth configure   # Add Anthropic config
opencode auth login -p anthropic          # Login
opencode models anthropic                 # Check models
opencode providers list                   # Check providers
```

---

Still stuck? [Open an issue](https://github.com/ragingstar2063/opencode-claude-code-auth/issues).

---

## See Also

- [Setup](./setup.md)
- [Auth Methods](./auth.md)
- [Architecture](./architecture.md)
