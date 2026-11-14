export type StatusLine = {
  model: string
  folder: string
  branch: string | null
  percent: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'terminal-status': { line: StatusLine | null }
  }
}
