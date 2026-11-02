/**
 * `dsh-init` — the global `/init` slash command.
 *
 * The command does not touch the filesystem. It turns one invocation into a
 * single ordinary user message carrying the AGENTS.md authoring prompt, hands
 * that message to the receiving agent as its next follow-up turn, and reports
 * completion in the UI. The agent then investigates the repository and writes
 * the file; the command itself stays out of model history.
 *
 * The prompt lives in `prompt.md` so it can be reviewed and changed without
 * touching the registration code. `{{cwd}}` is replaced with the session
 * working directory and `{{focus}}` with the text typed after `/init`.
 *
 * @module @illager_aris/dsh-init
 */
import { randomUUID } from 'node:crypto'
import { buildInitPrompt } from './lib/prompt.js'

/**
 * The command plane is the only Host surface this plugin needs. Declaring it
 * as an injection keeps the plugin inactive in compositions that mount no
 * command registry (headless runs and automation apps) instead of failing.
 */
export const inject = ['commands']

/** Discovered in the slash-command menu of every agent in the profile. */
const DESCRIPTION = 'Create or update AGENTS.md for this repository'

/** The free-form text after `/init` becomes the prompt's focus section. */
const INPUT_HINT = '[focus or constraints]'

/**
 * Register `/init` for the lifetime of this plugin fiber.
 * @param {import('@deepseek-ai/cordis').Context} ctx - Host context with `commands`.
 */
export function apply(ctx) {
  return ctx.effect(() =>
    ctx.commands.register({
      // Stable plugin-owned identity, independent of the display copy.
      definitionId: '@illager_aris/dsh-init',
      name: 'init',
      description: DESCRIPTION,
      input: { hint: INPUT_HINT },
      /**
       * @param {{ agent: { session: { header: { cwd?: string } }, followup: Function }, rawInput: string }} invocation
       */
      handler({ agent, rawInput }) {
        const prompt = buildInitPrompt({
          cwd: agent.session.header.cwd,
          focus: rawInput,
        })

        // The same delivery a prompt typed into the composer gets: a new
        // ordinary turn, queued behind any turn already running.
        agent.followup({
          id: randomUUID(),
          role: 'user',
          source: { kind: 'user' },
          content: [{ type: 'text', text: prompt }],
        })

        return { kind: 'success', text: 'AGENTS.md prompt sent.' }
      },
    }),
  )
}
