import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// Ghostty's default terminal colors: a dark slate page (#282c34), white text,
// and One Dark-style accents. Dark only, like the terminal.
const { theme, problems } = makeColors({
  label: 'Terminal',
  only: 'dark',
  roles: { accent: '#82aaff', danger: '#ef7f87', success: '#a6d189', warning: '#e5c07b', pro: '#d291e8' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#282c34',
        'surface-1': '#2a2e36',
        'surface-2': '#2c3038',
        'surface-3': '#2e323a',
        'text-primary': '#ffffff',
        'text-secondary': '#d0d4dc',
        'text-muted': '#a3aab6',
      },
    },
    git: { added: '#a6d189', removed: '#ef7f87', modified: '#e5c07b' },
  },
})

const LOOK: ThemeSetArgs = { colors: theme, backdrop: { color: 'surface-0' } }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })
}
