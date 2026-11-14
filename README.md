# Claude terminal look

Three small add-ons ("mods") that make the Claude desktop app's Code tab look and feel more like running Claude Code in a terminal such as Ghostty. Install any or all of them; each works on its own.

| Add-on | What it does |
|---|---|
| `terminal-look` | A dark terminal color theme: a slate background (`#282c34`), white text and One Dark-style accent colors. |
| `terminal-status` | A one-line status bar above the message box, like Claude Code's terminal footer: model, folder (git branch), and how much of the context window is used. |
| `terminal-text` | Draws replies and your own messages in the app's monospaced font. Headings, lists, bold, inline code, links and tables are kept; tables become lined-up columns. Code blocks keep the app's own code view. |

The add-ons only change how the desktop and mobile apps draw a session. In a terminal, Claude Code already looks like this, so they leave it alone.

## Install

At the prompt of a Claude Code session in a terminal, run one line per add-on:

```
/plugin install terminal-look --marketplace jakobgranq/claude-terminal-look
/plugin install terminal-status --marketplace jakobgranq/claude-terminal-look
/plugin install terminal-text --marketplace jakobgranq/claude-terminal-look
```

The first time, answer `y` to add the marketplace, then press Enter to pick the user scope. Installed at the user scope, the add-ons also apply to sessions the desktop app starts on the same computer. New sessions get them right away; sessions that are already open pick them up after a restart.

From a shell instead of a Claude Code prompt:

```
claude plugin install terminal-look --marketplace jakobgranq/claude-terminal-look
```

## Turn off or remove

Switch any add-on off in the app's plugin settings, or remove it with `claude plugin uninstall <name>`.
