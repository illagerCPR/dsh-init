import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply, inject } from '../index.js'
import { NO_FOCUS, buildInitPrompt } from '../lib/prompt.js'

/**
 * Mount the plugin against a recording command registry and hand back the one
 * registered definition plus a fake agent that records follow-up messages.
 */
function mount(options = {}) {
  const cwd = Object.hasOwn(options, 'cwd') ? options.cwd : '/workspace/acme'
  const definitions = []
  const dispose = apply({
    effect: (factory) => factory(),
    commands: {
      register(definition) {
        definitions.push(definition)
        return () => {}
      },
    },
  })

  assert.equal(typeof dispose, 'function', 'apply returns the registration disposer')
  assert.equal(definitions.length, 1, 'exactly one command is registered')

  const [definition] = definitions
  const sent = []
  const agent = {
    session: { header: cwd === undefined ? {} : { cwd } },
    followup(message) {
      sent.push(message)
    },
  }

  return { definition, agent, sent }
}

test('the plugin injects only the command plane', () => {
  assert.deepEqual(inject, ['commands'])
})

test('the registration advertises /init with its optional focus input', () => {
  const { definition } = mount()

  assert.equal(definition.name, 'init')
  assert.equal(definition.definitionId, '@illager_aris/dsh-init')
  assert.equal(definition.description, 'Create or update AGENTS.md for this repository')
  assert.deepEqual(definition.input, { hint: '[focus or constraints]' })
  assert.equal(typeof definition.handler, 'function')
})

test('/init sends exactly one ordinary user message built from the prompt', () => {
  const { definition, agent, sent } = mount()

  const result = definition.handler({ agent, rawInput: '' })

  assert.deepEqual(result, { kind: 'success', text: 'AGENTS.md prompt sent.' })
  assert.equal(sent.length, 1)

  const [message] = sent
  assert.equal(message.role, 'user')
  assert.deepEqual(message.source, { kind: 'user' })
  assert.equal(typeof message.id, 'string')
  assert.ok(message.id.length > 0)
  assert.equal(message.content.length, 1)
  assert.equal(message.content[0].type, 'text')
  assert.match(message.content[0].text, /^Create or update `AGENTS\.md` for this repository\./)
  assert.ok(message.content[0].text.includes(`in \`/workspace/acme\``))
  assert.ok(message.content[0].text.includes(NO_FOCUS))
  assert.ok(!message.content[0].text.includes('{{'))
})

test('text typed after /init becomes the focus section', () => {
  const { definition, agent, sent } = mount()

  definition.handler({ agent, rawInput: '  focus on the release workflow  ' })

  const text = sent[0].content[0].text
  assert.ok(text.includes('focus on the release workflow'))
  assert.ok(!text.includes(NO_FOCUS))
})

test('$ sequences in the focus text are inserted literally', () => {
  const { definition, agent, sent } = mount()

  definition.handler({ agent, rawInput: 'keep `$&` and $1 literal' })

  assert.ok(sent[0].content[0].text.includes('keep `$&` and $1 literal'))
})

test('a session without a working directory falls back to the repository root', () => {
  const { definition, agent, sent } = mount({ cwd: undefined })

  definition.handler({ agent, rawInput: '' })

  assert.ok(sent[0].content[0].text.includes('in the repository root'))
})

test('each invocation mints a fresh message identity', () => {
  const { definition, agent, sent } = mount()

  definition.handler({ agent, rawInput: '' })
  definition.handler({ agent, rawInput: '' })

  assert.equal(sent.length, 2)
  assert.notEqual(sent[0].id, sent[1].id)
})

test('the prompt is fully resolved by buildInitPrompt', () => {
  const text = buildInitPrompt({ cwd: '/tmp/repo', focus: '' })

  assert.ok(text.includes('in `/tmp/repo`'))
  assert.ok(text.includes(NO_FOCUS))
  assert.ok(!text.includes('{{'))
  assert.ok(text.includes('`ask_user_question`'))
  assert.ok(!text.includes('OpenCode'))
  assert.ok(!text.includes('opencode.json'))
})
