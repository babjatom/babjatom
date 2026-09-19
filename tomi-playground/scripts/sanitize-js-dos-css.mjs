/**
 * Keep only js-dos player-scoped rules. Drop Tailwind/DaisyUI preflight,
 * theme tokens, and shared utility classes that override the app shell.
 *
 * Layout utilities js-dos applies as bare classes (w-full, h-full, absolute, …)
 * are rewritten under `.jsdos-rso` / `.dos-player-host` so fullscreen scaling
 * still works without leaking into the shell.
 */

const PLAYER_SCOPE_RE =
  /(?:^|[^\w-])(?:\.?jsdos|emulator-|nipple|notyf|hg-|pre-run-|prerun-|dhry2-|fs-tree|editor-conf|editor-fs|network-frame|network-button|premium-plan-|animate-led|select-window|contentbar|cound-down|play-button|save-buttons|rct-|window-overlay)/i

const LAYOUT_UTILITIES = new Set([
  'w-full',
  'h-full',
  'min-h-full',
  'min-w-full',
  'max-h-full',
  'max-w-full',
  'absolute',
  'relative',
  'fixed',
  'sticky',
  'inset-0',
  'left-0',
  'right-0',
  'top-0',
  'bottom-0',
  'flex',
  'flex-col',
  'flex-row',
  'flex-grow',
  'grow',
  'items-center',
  'items-stretch',
  'items-end',
  'justify-center',
  'justify-between',
  'justify-end',
  'overflow-hidden',
  'overflow-auto',
  'object-contain',
  'object-cover',
  'object-fill',
])

const ALLOWED_KEYFRAMES = new Set([
  'spin',
  'pulse',
  'progress-loading',
  'ripple',
  'notyf-fadeinup',
  'notyf-fadeinleft',
  'notyf-fadeoutright',
  'notyf-fadeoutdown',
])

export function sanitizeJsDosCss(css) {
  return filterCss(css).trim()
}

function filterCss(css) {
  let out = ''
  let i = 0

  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) {
      i += 1
    }
    if (i >= css.length) {
      break
    }

    if (css[i] === '@') {
      const brace = css.indexOf('{', i)
      if (brace < 0) {
        break
      }
      const header = css.slice(i, brace).trim()
      const { body, end } = readBlock(css, brace)

      if (/^@keyframes\b/i.test(header)) {
        const name = header.match(/^@keyframes\s+([^\s{]+)/i)?.[1]
        if (name && ALLOWED_KEYFRAMES.has(name)) {
          out += `${header}{${body}}`
        }
      } else if (/prefers-color-scheme/i.test(header)) {
        // DaisyUI color-scheme blocks — drop.
      } else if (/^@(?:media|supports|-webkit-keyframes)\b/i.test(header)) {
        const inner = filterCss(body).trim()
        if (inner) {
          out += `${header}{${inner}}`
        }
      }

      i = end + 1
      continue
    }

    const brace = css.indexOf('{', i)
    if (brace < 0) {
      break
    }
    const selector = css.slice(i, brace).trim()
    const { body, end } = readBlock(css, brace)

    if (selector && isPlayerScopedSelector(selector)) {
      out += `${selector}{${body}}`
    } else if (selector && isBareLayoutUtilitySelector(selector)) {
      out += `${scopeLayoutUtilities(selector)}{${body}}`
    }

    i = end + 1
  }

  return out
}

function readBlock(css, openBraceIndex) {
  let depth = 0
  for (let i = openBraceIndex; i < css.length; i += 1) {
    const ch = css[i]
    if (ch === '{') {
      depth += 1
    } else if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        return {
          body: css.slice(openBraceIndex + 1, i),
          end: i,
        }
      }
    }
  }
  return { body: '', end: css.length - 1 }
}

function isPlayerScopedSelector(selector) {
  return selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .every((part) => PLAYER_SCOPE_RE.test(part))
}

function isBareLayoutUtilitySelector(selector) {
  return selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .every((part) => {
      if (!/^\.[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/.test(part)) {
        return false
      }
      const classes = part.slice(1).split('.')
      return classes.length > 0 && classes.every((name) => LAYOUT_UTILITIES.has(name))
    })
}

function scopeLayoutUtilities(selector) {
  return selector
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `.jsdos-rso ${part},.dos-player-host ${part}`)
    .join(',')
}
