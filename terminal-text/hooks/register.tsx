import type { Register } from 'claude-code'

import { parseBlocks, parseInline, tableLines } from './markdown'
import type { Block, Inline } from './markdown'

// Draws the conversation's own words (replies and your messages) in the
// desktop app's monospaced face, the way a terminal shows them. Code blocks
// keep the app's own code view. The terminal is already monospaced: left alone.
const CODE_COLOR = '#82aaff'

export const register: Register = on => {
  on('ui.render', { component: ['AssistantMessage', 'UserMessage'] }, ($, e, next) => {
    if (e.surface !== 'desktop') {
      return next(e)
    }
    if (e.component === 'UserMessage' && !e.props.isExpanded) {
      return next(e)
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
