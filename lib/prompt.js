/**
 * The `/init` prompt: a static template shipped as `prompt.md`, with the
 * session working directory and the user's focus text substituted in.
 *
 * The template is read once when the module loads. Substitution uses
 * replacement functions so `$&`-style sequences in the focus text stay literal.
 *
 * @module @illager_aris/dsh-init/prompt
 */
import { readFileSync } from 'node:fs'

const TEMPLATE = readFileSync(new URL('../prompt.md', import.meta.url), 'utf8')

/** Used when `/init` is invoked with no focus text. */
export const NO_FOCUS = 'None.'

/**
 * Render the prompt for one invocation.
 * @param {{ cwd?: string, focus?: string }} [options] - session working
 *   directory and the raw text typed after `/init`.
 * @returns {string} the complete user-message text.
 */
export function buildInitPrompt({ cwd, focus } = {}) {
  const target =
    typeof cwd === 'string' && cwd.length > 0 ? `\`${cwd}\`` : 'the repository root'
  const trimmedFocus = typeof focus === 'string' ? focus.trim() : ''

  return TEMPLATE
    .replaceAll('{{cwd}}', () => target)
    .replaceAll('{{focus}}', () => (trimmedFocus === '' ? NO_FOCUS : trimmedFocus))
}
