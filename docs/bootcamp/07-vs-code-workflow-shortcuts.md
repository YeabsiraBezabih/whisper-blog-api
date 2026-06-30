# **7. VS Code Workflow & Shortcuts**

VS Code is your primary tool. Mastering it saves hours. Below are the most important features and keyboard shortcuts for backend development.

## **Essential Keyboard Shortcuts (Windows/Linux)**

| **Shortcut** | **Action** |
|---|---|
| **Ctrl + P** | Quick file open by name |
| **Ctrl + Shift + P** | Command palette — run any VS Code command |
| **Ctrl + `** | Open integrated terminal |
| **Ctrl + B** | Toggle sidebar |
| **Alt + Click** | Multi-cursor editing |
| **Ctrl + D** | Select next occurrence of current word |
| **F12** | Go to definition (essential for TS) |
| **Alt + F12** | Peek definition (inline) |
| **Shift + F12** | Find all references |
| **Ctrl + Shift + F** | Search across all files |
| **Ctrl + /** | Toggle comment |
| **Ctrl + Shift + K** | Delete line |


## **Settings to Configure Immediately**

- "editor.formatOnSave": true — Prettier formats every time you save

- "editor.defaultFormatter": "esbenp.prettier-vscode" — set Prettier as default

- "typescript.preferences.importModuleSpecifier": "relative" — consistent imports

- "terminal.integrated.defaultProfile.linux": "bash" — or zsh if you prefer

> **Pro Tip: Workspace Settings**
> Create a .vscode/settings.json in each project to keep project-specific settings (like disabling certain linting rules for tests). These settings override your global settings for that workspace only.
