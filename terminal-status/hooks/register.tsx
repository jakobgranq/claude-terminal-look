import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { StatusLine } from '../types'

// The footer Claude Code draws in a terminal, as one quiet monospaced line
// above the message box: model | folder (git branch) | context used.
const line = atom({ plugin: 'terminal-status', key: 'line' } as const, null)

// "claude-opus-5-5[1m]" -> "Opus 5.5"; anything else is shown as given.
function prettyModel(id: string): string {
  const m = /claude-([a-z]+)-(\d+)-(\d+)/i.exec(id)

  const [, family = '', major = '', minor = ''] = m ?? []

  if (family === '') {
    return id
  }

  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${major}.${minor}`
}

async function refresh($: EngineInterface): Promise<void> {
  const [model, cwd, usage] = await Promise.all([$.session.model(), $.session.cwd(), $.session.usage()])
  let branch: string | null = null

  try {
    const git = await $.process.run(['git', 'branch', '--show-current'], { cwd, timeoutMs: 3000 })
    branch = git.exitCode === 0 && git.stdout.trim() !== '' ? git.stdout.trim() : null
  } catch {
    branch = null
  }
  const next: StatusLine = {
    model: prettyModel(model),
    folder: cwd.replace(/^\/Users\/[^/]+/, '~'),
    branch,
    percent: usage.context.percent ?? null,
  }
  await update($, line, () => next)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const status = await read($, line)

    if (e.props.hasSurvey || status === null) {
      return next(e)
    }
    const { Text } = $.ui.resolve(e)
    const where = status.branch === null ? status.folder : `${status.folder} (${status.branch})`
    const context = status.percent === null ? 'Context: –' : `Context: ${status.percent}% used`

    return (
      <Text mono dimColor size="footnote" tabular>
        {`${status.model}  |  ${where}  |  ${context}`}
      </Text>
    )
  })
}
