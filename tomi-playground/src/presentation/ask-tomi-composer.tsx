import {
  type FormEvent,
  type KeyboardEvent,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { SendHorizontal, Square } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const TEXTAREA_MAX_PX = 128

export function AskTomiComposer({
  pending,
  onSend,
  onStop,
}: {
  pending: boolean
  onSend: (question: string) => Promise<void>
  onStop: () => void
}) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const node = inputRef.current
    if (!node) return
    node.style.height = '0px'
    node.style.height = `${Math.min(node.scrollHeight, TEXTAREA_MAX_PX)}px`
  }, [draft])

  async function submitDraft() {
    const question = draft.trim()
    if (!question || pending) return
    setDraft('')
    await onSend(question)
    inputRef.current?.focus()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitDraft()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitDraft()
    }
  }

  return (
    <form
      className="shrink-0 border-t border-border/70 bg-background px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
      onSubmit={handleSubmit}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-1.5">
        <div className="flex items-end gap-2">
          <label htmlFor="ask-tomi-question" className="sr-only">
            Question
          </label>
          <textarea
            ref={inputRef}
            id="ask-tomi-question"
            name="question"
            rows={1}
            value={draft}
            disabled={pending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Tomi’s experience, stack, or approach…"
            autoComplete="off"
            className="max-h-32 min-h-10 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          {pending ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-10 shrink-0"
              onClick={onStop}
            >
              <Square className="h-3.5 w-3.5" />
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              size="sm"
              className="h-10 shrink-0"
              disabled={!draft.trim()}
            >
              <SendHorizontal className="h-4 w-4" />
              Ask
            </Button>
          )}
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Prototype — don’t take the results seriously. Messages go to a
          Cloudflare Worker to generate a reply. Don’t send secrets.{' '}
          <Link
            to="/privacy"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Privacy
          </Link>
          <span className="hidden sm:inline">
            {' '}
            · Enter to send · Shift+Enter for a new line
          </span>
        </p>
      </div>
    </form>
  )
}
