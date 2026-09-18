import {
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Copy,
  Eraser,
  LoaderCircle,
  RefreshCw,
  SendHorizontal,
  Square,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Reveal } from '@/presentation/shared/reveal'
import { usePendingStatus } from './use-pending-status'
import { useTypewriter } from './use-typewriter'
import {
  STARTER_PROMPTS,
  useTomiChat,
  type ChatMessage,
} from './use-tomi-chat'

function AssistantBody({
  message,
  animateTyping,
  onTypingProgress,
  onTypingDone,
}: {
  message: ChatMessage
  animateTyping: boolean
  onTypingProgress?: () => void
  onTypingDone?: () => void
}) {
  const { displayText, done } = useTypewriter(message.content, {
    enabled: animateTyping && message.status === 'complete',
    onProgress: onTypingProgress,
  })
  const pendingStatus = usePendingStatus(message.status === 'pending')

  useEffect(() => {
    if (message.status === 'complete' && done) {
      onTypingDone?.()
    }
  }, [done, message.status, onTypingDone])

  if (message.status === 'pending') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
        <span aria-hidden>{pendingStatus}</span>
        <span className="sr-only">Tomi is thinking</span>
      </p>
    )
  }

  if (message.status === 'cancelled' || message.status === 'error') {
    return (
      <p
        className={cn(
          'text-sm',
          message.status === 'error'
            ? 'text-destructive'
            : 'text-muted-foreground',
        )}
      >
        {message.content}
      </p>
    )
  }

  return (
    <div className="tomi-md text-sm leading-relaxed">
      <ReactMarkdown>{displayText}</ReactMarkdown>
      {!done && (
        <span
          className="ml-0.5 inline-block h-[1em] w-[0.08em] translate-y-[0.1em] animate-pulse bg-foreground/80"
          aria-hidden
        />
      )}
    </div>
  )
}

export function AskTomiPage() {
  const { messages, pending, send, stop, regenerate, clear, copy } =
    useTomiChat()
  const [draft, setDraft] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [typingDoneIds, setTypingDoneIds] = useState<Record<string, boolean>>(
    {},
  )
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    const node = listRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, pending, scrollToBottom])

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [copiedId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = draft
    setDraft('')
    await send(question)
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!pending && draft.trim()) {
        void send(draft).then(() => {
          setDraft('')
          inputRef.current?.focus()
        })
      }
    }
  }

  const lastAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')?.id

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:gap-4 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-[env(safe-area-inset-bottom)]">
      <header className="animate-rise relative shrink-0 overflow-hidden rounded-2xl border border-border/70">
        <div className="theme-mesh absolute inset-0 opacity-80" />
        <div className="relative px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ask Tomi
              </h1>
              <p className="mt-1 max-w-3xl text-xs text-foreground/80 sm:mt-2 sm:text-base">
                Ask about Tomi’s experience, stack, or approach. Follow-ups in
                this chat can refer to earlier answers for about 30 minutes.
              </p>
            </div>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clear()
                  setTypingDoneIds({})
                }}
                aria-label="Clear chat"
              >
                <Eraser className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <section
          ref={listRef}
          className="animate-rise-delay min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/70 bg-background/65 px-3 py-4 backdrop-blur-[2px] sm:px-4"
          aria-label="Conversation"
          aria-live="polite"
          aria-relevant="additions"
        >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center gap-4">
                <Reveal as="p" className="text-sm text-muted-foreground">
                  Start with a suggested question, or type your own below.
                </Reveal>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {STARTER_PROMPTS.map((prompt, index) => (
                    <Reveal
                      key={prompt}
                      rootRef={listRef}
                      delayMs={60 + index * 70}
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full justify-start text-left sm:w-auto"
                        disabled={pending}
                        onClick={() =>
                          void send(prompt, {
                            source: 'starter',
                            starter_id: prompt,
                          })
                        }
                      >
                        {prompt}
                      </Button>
                    </Reveal>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {messages.map((message) => {
                  const isUser = message.role === 'user'
                  const isLatestAssistant = message.id === lastAssistantId
                  const typingComplete =
                    !isLatestAssistant ||
                    message.status !== 'complete' ||
                    Boolean(typingDoneIds[message.id])
                  const showActions =
                    !isUser &&
                    message.status !== 'pending' &&
                    isLatestAssistant &&
                    typingComplete

                  return (
                    <Reveal
                      key={message.id}
                      as="li"
                      rootRef={listRef}
                      className={cn(
                        'flex',
                        isUser ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[92%] space-y-2 sm:max-w-[85%]',
                          isUser ? 'items-end' : 'items-start',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2.5',
                            isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground',
                          )}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </p>
                          ) : (
                            <AssistantBody
                              message={message}
                              animateTyping={
                                isLatestAssistant &&
                                message.status === 'complete'
                              }
                              onTypingProgress={scrollToBottom}
                              onTypingDone={() => {
                                setTypingDoneIds((current) =>
                                  current[message.id]
                                    ? current
                                    : { ...current, [message.id]: true },
                                )
                              }}
                            />
                          )}
                        </div>
                        {showActions && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={!message.content.trim()}
                              onClick={() => {
                                void copy(message.content).then(() =>
                                  setCopiedId(message.id),
                                )
                              }}
                              aria-label="Copy answer"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {copiedId === message.id ? 'Copied' : 'Copy'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={pending}
                              onClick={() => {
                                setTypingDoneIds((current) => {
                                  const next = { ...current }
                                  delete next[message.id]
                                  return next
                                })
                                void regenerate(message.id)
                              }}
                              aria-label="Regenerate answer"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Regenerate
                            </Button>
                          </div>
                        )}
                      </div>
                    </Reveal>
                  )
                })}
              </ul>
            )}
        </section>

        <form
          className="animate-rise-delay shrink-0 rounded-xl border border-border/70 bg-card/70 p-3 backdrop-blur-sm"
          onSubmit={handleSubmit}
        >
          <LabelledComposer
            draft={draft}
            pending={pending}
            inputRef={inputRef}
            onDraftChange={setDraft}
            onKeyDown={handleKeyDown}
            onStop={stop}
          />
        </form>
      </div>
    </div>
  )
}

function LabelledComposer({
  draft,
  pending,
  inputRef,
  onDraftChange,
  onKeyDown,
  onStop,
}: {
  draft: string
  pending: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  onDraftChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onStop: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="ask-tomi-question" className="sr-only">
        Question
      </label>
      <textarea
        ref={inputRef}
        id="ask-tomi-question"
        name="question"
        rows={2}
        value={draft}
        disabled={pending}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask about Tomi’s experience, stack, or approach…"
        autoComplete="off"
        className="min-h-[2.75rem] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[11px] leading-snug text-muted-foreground">
            Prototype — don’t take the results seriously.
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Don’t send secrets.{' '}
            <Link
              to="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy
            </Link>
          </p>
          <p className="hidden text-[11px] leading-snug text-muted-foreground lg:block">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
        {pending ? (
          <Button type="button" variant="secondary" onClick={onStop}>
            <Square className="h-3.5 w-3.5" />
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!draft.trim()}>
            <SendHorizontal className="h-4 w-4" />
            Ask
          </Button>
        )}
      </div>
    </div>
  )
}
