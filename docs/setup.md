# Setup

[README](../README.md) · [Auth Methods](./auth.md) · [Troubleshooting](./troubleshooting.md) · [Architecture](./architecture.md)

---

## Quick Start

1. **Add the plugin** to `opencode.json`:

   ```json
   {
     "plugin": ["opencode-claude-code-auth"]
   }
   ```

2. **Configure models:**

   ```bash
   npx opencode-claude-code-auth configure
   ```

3. **Login:**

   ```bash
   opencode auth login -p anthropic
   ```

4. **Verify:**

   ```bash
   opencode run "Hello" -m anthropic/claude-haiku-4-5
   ```

---

## Setup Paths

### Path A — Login first (auto-configure)

```bash
opencode auth login -p anthropic
```

If Anthropic models are not configured, the CLI prompts:

| Option | What it does |
|--------|--------------|
| `Update this project` | Adds Anthropic provider + default models to `opencode.json` |
| `Skip for now` | Skips config. Run `npx opencode-claude-code-auth configure` later. |

### Path B — Configure first

```bash
npx opencode-claude-code-auth configure
opencode auth login -p anthropic
```

---

## Configure Command

| Flag | What it does |
|------|--------------|
| *(no flags)* | Finds project `opencode.json` / `opencode.jsonc`, previews patch, asks for confirmation |
| `--global` | Uses global config at `~/.config/opencode/opencode.json` |
| `--file <path>` | Uses a specific file |
| `-y` / `--yes` | Skips confirmation |

**What it adds (only missing keys):**

| Key | Value |
|-----|-------|
| `provider.anthropic.npm` | `@ai-sdk/anthropic` |
| `provider.anthropic.name` | `Anthropic` |
| `provider.anthropic.models.claude-sonnet-4-5` | Claude Sonnet 4.5 |
| `provider.anthropic.models.claude-haiku-4-5` | Claude Haiku 4.5 |
| `model` | `anthropic/claude-sonnet-4-5` |
| `small_model` | `anthropic/claude-haiku-4-5` |

> **Note**: The command is idempotent. Running it again when config already exists does nothing.

---

## Doctor Command

```bash
npx opencode-claude-code-auth doctor
```

| Field | What it checks |
|-------|---------------|
| `file` | Target config file path |
| `has` | Whether the file exists |
| `provider` | Whether `provider.anthropic` exists |
| `sonnet` | Whether `claude-sonnet-4-5` model exists |
| `haiku` | Whether `claude-haiku-4-5` model exists |
| `model` | Value of `model` field |
| `small` | Value of `small_model` field |
| `auth` | Anthropic auth type in OpenCode storage |

---

## Manual Config

<details>
<summary><b>Full configuration (copy-paste ready)</b></summary>

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-claude-code-auth"],
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "provider": {
    "anthropic": {
      "npm": "@ai-sdk/anthropic",
      "name": "Anthropic",
      "models": {
        "claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5"
        },
        "claude-haiku-4-5": {
          "name": "Claude Haiku 4.5"
        }
      }
    }
  }
}
```

</details>

---

## Local Development

Build from source:

```bash
npm install
npm run typecheck
npm run build
npm run smoke
```

Load locally:

```json
{
  "plugin": [
    "file:///absolute/path/to/opencode-claude-code-auth/dist/index.js"
  ]
}
```

---

## See Also

- [Auth Methods](./auth.md)
- [Troubleshooting](./troubleshooting.md)
- [Architecture](./architecture.md)
