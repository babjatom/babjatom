/**
 * Strip global Tailwind/DaisyUI rules from js-dos.css that leak into the app shell.
 * Keeps player-scoped rules (e.g. .jsdos-*) intact.
 */
export function sanitizeJsDosCss(css) {
  let next = css

  // Empty leftover from nested :root removals inside prefers-color-scheme.
  next = next.replace(
    /@media\s*\(prefers-color-scheme:\s*dark\)\{\s*\}/g,
    '',
  )

  // Flat rules only (no nested `{` in the declaration body).
  next = next.replace(/([^{}@]+)\{([^{}]*)\}/g, (rule, rawSelector, body) => {
    const selector = rawSelector.trim()
    if (shouldDropGlobalRule(selector, body)) {
      return ''
    }
    return rule
  })

  next = next.replace(
    /@media\s*\(prefers-color-scheme:\s*dark\)\{\s*\}/g,
    '',
  )

  return next
}

function shouldDropGlobalRule(selector, body) {
  if (selector === '.hidden') {
    return true
  }

  if (
    selector === ':root' ||
    selector.startsWith(':root,') ||
    selector.includes('[data-theme]')
  ) {
    return true
  }

  // Preflight that clears every button background (breaks shell controls).
  if (
    /^button\b/.test(selector) &&
    /background-color\s*:\s*transparent/.test(body)
  ) {
    return true
  }

  return false
}
