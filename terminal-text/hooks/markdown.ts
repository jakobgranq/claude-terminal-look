// A small markdown reader for drawing replies in a monospaced face: just the
// pieces Claude's replies use. Anything it doesn't know stays as written.

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'link'; text: string; href: string }

export type Block =
  | { kind: 'para'; text: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'item'; indent: string; marker: string; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'code'; language: string; source: string }
  | { kind: 'table'; header: string[]; rows: string[][] }
  | { kind: 'rule' }
  | { kind: 'blank' }

const INLINE = /(\*\*[^*\n]+?\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|(?<![\w*])\*[^*\s][^*\n]*?\*(?![\w*])|(?<![\w_])_[^_\s][^_\n]*?_(?![\w_]))/

export function parseInline(source: string): Inline[] {
  const out: Inline[] = []
  let rest = source

  while (rest.length > 0) {
    const m = INLINE.exec(rest)

    if (m === null) {
      out.push({ kind: 'text', text: rest })
      break
    }
    const token = m[0]

    if (m.index > 0) {
      out.push({ kind: 'text', text: rest.slice(0, m.index) })
    }
    if (token.startsWith('**')) {
      out.push({ kind: 'bold', text: token.slice(2, -2) })
    } else if (token.startsWith('`')) {
      out.push({ kind: 'code', text: token.slice(1, -1) })
    } else if (token.startsWith('[')) {
      const split = token.indexOf('](')
      out.push({ kind: 'link', text: token.slice(1, split), href: token.slice(split + 2, -1) })
    } else {
      out.push({ kind: 'italic', text: token.slice(1, -1) })
    }
    rest = rest.slice(m.index + token.length)
  }

  return out
}

// The text an inline run shows, without its marks: for lining up table columns.
export function plainText(source: string): string {
  return parseInline(source)
    .map(part => part.text)
    .join('')
}

function splitRow(line: string): string[] {
  let body = line.trim()

  if (body.startsWith('|')) {
    body = body.slice(1)
  }
  if (body.endsWith('|')) {
    body = body.slice(0, -1)
  }

  return body.split('|').map(cell => cell.trim())
}

const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line)
const isSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)

export function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''
    const fence = /^\s*(```+|~~~+)\s*([\w+-]*)/.exec(line)

    if (fence !== null) {
      const close = fence[1] ?? '```'
      const body: string[] = []
      i += 1

      while (i < lines.length && !(lines[i] ?? '').trim().startsWith(close)) {
        body.push(lines[i] ?? '')
        i += 1
      }
      i += 1
      blocks.push({ kind: 'code', language: fence[2] ?? '', source: body.join('\n') })
      continue
    }
    if (isTableLine(line) && isSeparator(lines[i + 1] ?? '')) {
      const header = splitRow(line)
      const rows: string[][] = []
      i += 2

      while (i < lines.length && isTableLine(lines[i] ?? '')) {
        rows.push(splitRow(lines[i] ?? ''))
        i += 1
      }
      blocks.push({ kind: 'table', header, rows })
      continue
    }
    if (line.trim() === '') {
      if (blocks.length > 0 && blocks[blocks.length - 1]?.kind !== 'blank') {
        blocks.push({ kind: 'blank' })
      }
      i += 1
      continue
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    const item = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line)

    if (heading !== null) {
      blocks.push({ kind: 'heading', level: (heading[1] ?? '#').length, text: heading[2] ?? '' })
    } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ kind: 'rule' })
    } else if (item !== null) {
      const marker = /^\d/.test(item[2] ?? '') ? (item[2] ?? '') : '•'
      blocks.push({ kind: 'item', indent: item[1] ?? '', marker, text: item[3] ?? '' })
    } else if (/^\s*>/.test(line)) {
      blocks.push({ kind: 'quote', text: line.replace(/^\s*>\s?/, '') })
    } else {
      blocks.push({ kind: 'para', text: line })
    }
    i += 1
  }
  while (blocks[blocks.length - 1]?.kind === 'blank') {
    blocks.pop()
  }

  return blocks
}

// A table as lined-up monospaced rows: header, a rule, then the body.
export function tableLines(header: string[], rows: string[][]): { header: string; rule: string; body: string[] } {
  const all = [header, ...rows].map(row => row.map(plainText))
  const columns = Math.max(...all.map(row => row.length))
  const widths = Array.from({ length: columns }, (_, c) => Math.max(...all.map(row => (row[c] ?? '').length)))
  const line = (row: string[]) =>
    widths
      .map((w, c) => (row[c] ?? '').padEnd(w))
      .join('  │  ')
      .trimEnd()

  return {
    header: line(all[0] ?? []),
    rule: widths.map(w => '─'.repeat(w)).join('──┼──'),
    body: all.slice(1).map(line),
  }
}
