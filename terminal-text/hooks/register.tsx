import type { Register } from 'claude-code'

import { parseBlocks, parseInline, tableLines } from './markdown'
import type { Block, Inline } from './markdown'

// Draws the conversation's own words (replies and your messages) in the
// desktop app's monospaced face, the way a terminal shows them. Code blocks
// keep the app's own code view. The terminal is already monospaced: left alone.
const CODE_COLOR = '#82aaff'

// A message's photos and files are drawn by the app's own row, which this
// mod's text-only drawing would replace. So the prompts sent with an
// attachment are remembered (as typed) and their rows left to the app.
const WITH_MEDIA = 'promptsWithMedia'
const MAX_REMEMBERED = 300

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    if (e.attachments !== undefined && e.attachments.length > 0) {
      const key = e.text.trim()
      await $.store
        .get(WITH_MEDIA)
        .then(seen => {
          const list = Array.isArray(seen) ? seen.filter((t): t is string => typeof t === 'string') : []

          return $.store.set(WITH_MEDIA, [...list.filter(t => t !== key), key].slice(-MAX_REMEMBERED))
        })
        .catch(() => undefined)
    }

    return next(e)
  })

  on('ui.render', { component: ['AssistantMessage', 'UserMessage'] }, async ($, e, next) => {
    if (e.surface !== 'desktop') {
      return next(e)
    }
    if (e.component === 'UserMessage') {
      if (!e.props.isExpanded || e.props.text.trim() === '') {
        return next(e)
      }
      const seen = await $.store.get(WITH_MEDIA)
      if (Array.isArray(seen) && seen.includes(e.props.text.trim())) {
        return next(e)
      }
    }
    const { Box, Text, Link, Code } = $.ui.resolve(e)

    const inline = (parts: Inline[]) =>
      parts.map(part => {
        switch (part.kind) {
          case 'bold':
            return <Text bold>{part.text}</Text>
          case 'italic':
            return <Text italic>{part.text}</Text>
          case 'code':
            return <Text color={CODE_COLOR}>{part.text}</Text>
          case 'link':
            return /^https?:\/\//.test(part.href) ? <Link href={part.href}>{part.text}</Link> : <Text underline>{part.text}</Text>
          default:
            return part.text
        }
      })

    const block = (b: Block) => {
      switch (b.kind) {
        case 'heading':
          return (
            <Text mono bold>
              {inline(parseInline(b.text))}
            </Text>
          )
        case 'item':
          return (
            <Text mono>
              {`${b.indent}${b.marker} `}
              {inline(parseInline(b.text))}
            </Text>
          )
        case 'quote':
          return (
            <Text mono dimColor>
              {'│ '}
              {inline(parseInline(b.text))}
            </Text>
          )
        case 'code':
          return b.language === '' ? <Code source={b.source} /> : <Code source={b.source} language={b.language} />
        case 'table': {
          const t = tableLines(b.header, b.rows)

          return (
            <Box flexDirection="column">
              <Text mono bold>
                {t.header}
              </Text>
              <Text mono dimColor>
                {t.rule}
              </Text>
              {t.body.map(row => (
                <Text mono>{row}</Text>
              ))}
            </Box>
          )
        }
        case 'rule':
          return (
            <Text mono dimColor>
              {'────────────────'}
            </Text>
          )
        case 'blank':
          return <Text mono> </Text>
        default:
          return <Text mono>{inline(parseInline(b.text))}</Text>
      }
    }

    return <Box flexDirection="column">{parseBlocks(e.props.text).map(block)}</Box>
  })
}
