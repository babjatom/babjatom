import { render as renderGitHubButton } from 'github-buttons'
import { useEffect, useRef } from 'react'

export const GITHUB_PROFILE_URL = 'https://github.com/babjatom'

export function GitHubFollowButton() {
  const hostRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    // Replace the static fallback with the official GitHub Buttons widget.
    host.replaceChildren()

    const anchor = document.createElement('a')
    anchor.href = GITHUB_PROFILE_URL
    anchor.dataset.showCount = 'true'
    anchor.dataset.size = 'large'
    anchor.setAttribute('aria-label', 'Follow @babjatom on GitHub')
    anchor.textContent = 'Follow @babjatom'

    const holder = document.createElement('span')
    holder.appendChild(anchor)
    host.appendChild(holder)

    renderGitHubButton(anchor, (el) => {
      try {
        holder.replaceWith(el)
      } catch {
        // Ignore if the host unmounted mid-render.
      }
    })

    return () => {
      host.replaceChildren()
    }
  }, [])

  return (
    <span
      ref={hostRef}
      className="mt-1.5 inline-flex min-h-5 items-center"
      data-github-follow
    >
      <a
        className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        href={GITHUB_PROFILE_URL}
        data-show-count="true"
        data-size="large"
        aria-label="Follow @babjatom on GitHub"
        target="_blank"
        rel="noopener noreferrer"
      >
        Follow @babjatom
      </a>
    </span>
  )
}
