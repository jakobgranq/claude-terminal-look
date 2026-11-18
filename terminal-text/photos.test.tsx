import { expect, mock, test } from 'claude-code/testing'

const row = (text: string) =>
  ({
    plugin: 'terminal-text',
    component: 'UserMessage',
    surface: 'desktop',
    props: { text, origin: { kind: 'user' }, isExpanded: true },
  }) as const

test('a message sent with a photo is left to the app, so the photo shows', async ($, on) => {
  mock.store(on)
  // Stands for the app's own row (the one that draws the photo).
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine row</Text>
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))

  await $.prompt.submit({ text: 'what is in this photo?', attachments: [{ type: 'image', mediaType: 'image/png' }] })

  const withPhoto = await $.ui.mount(row('what is in this photo?'))
  expect((await withPhoto.find({ type: 'Text', text: /engine row/ }))?.text).toBe('engine row')
  await withPhoto.unmount()

  // A plain-text message still gets the monospaced drawing.
  const plain = await $.ui.mount(row('just words'))
  expect(await plain.find({ type: 'Text', text: /engine row/ })).toBeUndefined()
  expect((await plain.find({ type: 'Text', text: /just words/ }))?.text).toBe('just words')
  await plain.unmount()
})

test('a photo sent with no words is left to the app', async ($, on) => {
  mock.store(on)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine row</Text>
  })

  const ui = await $.ui.mount(row(''))
  expect((await ui.find({ type: 'Text', text: /engine row/ }))?.text).toBe('engine row')
  await ui.unmount()
})
