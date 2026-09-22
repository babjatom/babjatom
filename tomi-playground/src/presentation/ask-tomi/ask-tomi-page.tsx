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
  Calendar,
  Copy,
  Eraser,
  FileDown,
  LoaderCircle,
  RefreshCw,
  SendHorizontal,
  Square,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { track } from '@/infrastructure/analytics'
import { cn } from '@/lib/utils'
import { Reveal } from '@/presentation/shared/reveal'
import { downloadCvPdf } from './download-cv'
import { usePendingStatus } from './use-pending-status'
import { useTypewriter } from './use-typewriter'
import {
  STARTER_PROMPTS,
  useTomiChat,
  type ChatMessage,
} from './use-tomi-chat'

const NEAR_BOTTOM_PX = 80
const SCHEDULE_PLACEHOLDER = 'Paste their Cal.com link…'

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

  const slots = message.schedulePreview?.slots

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div className="tomi-md">
        <ReactMarkdown>{displayText}</ReactMarkdown>
        {!done && (
          <span
            className="ml-0.5 inline-block h-[1em] w-[0.08em] translate-y-[0.1em] animate-pulse bg-foreground/80"
            aria-hidden
          />
        )}
      </div>
      {slots && slots.length > 0 && message.status === 'complete' && (
        <ol
          className="m-0 list-decimal space-y-1.5 pl-5 text-sm text-foreground"
          data-testid="schedule-preview-slots"
        >
          {slots.map((slot) => (
            <li key={slot.start} className="pl-1">
              {slot.label}
            </li>
          ))}
        </ol>
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
  const [composerFocused, setComposerFocused] = useState(false)
  const [emptyNeedsScroll, setEmptyNeedsScroll] = useState(false)
  const [scheduleNudge, setScheduleNudge] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const emptyContentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottomRef = useRef(true)

  const hasMessages = messages.length > 0
  const showComposerMeta = !hasMessages || composerFocused
  const conversationScrollable = hasMessages || emptyNeedsScroll

  const scrollToBottom = useCallback(() => {
    const node = listRef.current
    if (!node || !stickToBottomRef.current) return
    node.scrollTop = node.scrollHeight
  }, [])

  const updateStickFromScroll = useCallback(() => {
    const node = listRef.current
    if (!node) return
    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight
    stickToBottomRef.current = distanceFromBottom <= NEAR_BOTTOM_PX
  }, [])

  const measureEmptyOverflow = useCallback(() => {
    if (hasMessages) {
      setEmptyNeedsScroll(false)
      return
    }
    const viewport = listRef.current
    const content = emptyContentRef.current
    if (!viewport || !content) return
    setEmptyNeedsScroll(content.scrollHeight > viewport.clientHeight + 1)
  }, [hasMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages, pending, scrollToBottom])

  useEffect(() => {
    const viewport = listRef.current
    const content = emptyContentRef.current
    const scheduleMeasure = () => {
      window.requestAnimationFrame(() => measureEmptyOverflow())
    }
    scheduleMeasure()
    if (!viewport || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', scheduleMeasure)
      return () => window.removeEventListener('resize', scheduleMeasure)
    }
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(viewport)
    if (content) observer.observe(content)
    window.addEventListener('resize', scheduleMeasure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [measureEmptyOverflow, messages.length])

  useEffect(() => {
    if (!copiedId) return
    const timer = window.setTimeout(() => setCopiedId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [copiedId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const question = draft
    setDraft('')
    stickToBottomRef.current = true
    await send(question)
    inputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!pending && draft.trim()) {
        stickToBottomRef.current = true
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
    <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-1 flex-col gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:gap-3 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:pb-[env(safe-area-inset-bottom)]">
      <header
        className={cn(
          'animate-rise relative shrink-0 rounded-2xl border border-border/70',
          hasMessages && 'border-border/40',
        )}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className={cn(
              'theme-mesh absolute inset-0',
              hasMessages ? 'opacity-50' : 'opacity-80',
            )}
          />
        </div>
        <div
          className={cn(
            'relative px-4 sm:px-6',
            hasMessages ? 'py-2.5 sm:py-3' : 'pt-5 pb-4 sm:pt-6 sm:pb-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1
                className={cn(
                  'font-display font-bold tracking-tight text-foreground',
                  hasMessages
                    ? 'text-xl leading-tight sm:text-2xl'
                    : 'text-2xl leading-tight sm:text-4xl',
                )}
              >
                Ask Tomi
              </h1>
              {!hasMessages && (
                <p className="mt-2 max-w-3xl text-xs text-foreground/80 sm:mt-3 sm:text-base">
                  Ask about Tomi’s experience, stack, or approach. Follow-ups in
                  this chat can refer to earlier answers for about 30 minutes.
                </p>
              )}
            </div>
            {hasMessages && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  clear()
                  setTypingDoneIds({})
                  setScheduleNudge(false)
                  stickToBottomRef.current = true
                }}
                aria-label="Clear chat"
              >
                <Eraser className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
        <section
          ref={listRef}
          className={cn(
            'animate-rise-delay min-h-0 flex-1 px-1 py-2 sm:px-2 sm:py-3',
            conversationScrollable
              ? 'scrollbar-overlay overflow-y-auto'
              : 'overflow-hidden',
          )}
          aria-label="Conversation"
          aria-live="polite"
          aria-relevant="additions"
          onScroll={hasMessages ? updateStickFromScroll : undefined}
        >
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            {messages.length === 0 ? (
              <div
                className={cn(
                  'flex w-full flex-col',
                  emptyNeedsScroll ? 'justify-start' : 'min-h-full justify-center',
                )}
              >
                <div
                  ref={emptyContentRef}
                  className={cn(
                    'flex flex-col gap-5 sm:gap-6',
                    emptyNeedsScroll ? 'py-2' : 'py-6 sm:py-10',
                  )}
                >
                  <Reveal
                    as="p"
                    className="hidden text-center text-sm text-muted-foreground sm:block"
                  >
                    Start with a suggested question, or type your own below.
                  </Reveal>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
                    <Reveal rootRef={listRef} delayMs={40}>
                      <Button
                        type="button"
                        variant="default"
                        className="w-full justify-start gap-2 text-left sm:w-auto"
                        disabled={pending}
                        data-testid="schedule-call-chip"
                        onClick={() => {
                          setScheduleNudge(true)
                          setDraft('')
                          setComposerFocused(true)
                          inputRef.current?.focus()
                          track('Ask Tomi Action', { action: 'schedule_nudge' })
                        }}
                      >
                        <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                        Schedule call
                      </Button>
                    </Reveal>
                    <Reveal rootRef={listRef} delayMs={50}>
                      <Button
                        type="button"
                        variant="default"
                        className="w-full justify-start gap-2 text-left sm:w-auto"
                        disabled={pending}
                        data-testid="download-cv-chip"
                        onClick={() => {
                          downloadCvPdf()
                          track('Ask Tomi Action', { action: 'download_cv' })
                        }}
                      >
                        <FileDown className="h-4 w-4 shrink-0" aria-hidden />
                        Download CV
                      </Button>
                    </Reveal>
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
                          onClick={() => {
                            setScheduleNudge(false)
                            stickToBottomRef.current = true
                            void send(prompt, {
                              source: 'starter',
                              starter_id: prompt,
                            })
                          }}
                        >
                          {prompt}
                        </Button>
                      </Reveal>
                    ))}
                  </div>
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
                                stickToBottomRef.current = true
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
          </div>
        </section>

        <form
          className={cn(
            'animate-rise-delay mx-auto w-full max-w-3xl shrink-0',
            hasMessages
              ? 'rounded-xl border border-border/40 bg-background/40 px-2.5 py-2'
              : 'rounded-xl border border-border/70 bg-card/70 p-3 backdrop-blur-sm',
          )}
          onSubmit={handleSubmit}
          onFocus={() => setComposerFocused(true)}
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null
            if (next && event.currentTarget.contains(next)) return
            setComposerFocused(false)
          }}
        >
          <LabelledComposer
            draft={draft}
            pending={pending}
            hasMessages={hasMessages}
            showMeta={showComposerMeta}
            scheduleNudge={scheduleNudge}
            inputRef={inputRef}
            onDraftChange={(value) => {
              setDraft(value)
              if (value.trim()) setScheduleNudge(false)
            }}
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
  hasMessages,
  showMeta,
  scheduleNudge,
  inputRef,
  onDraftChange,
  onKeyDown,
  onStop,
}: {
  draft: string
  pending: boolean
  hasMessages: boolean
  showMeta: boolean
  scheduleNudge: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
  onDraftChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onStop: () => void
}) {
  const maxComposerPx = hasMessages ? 160 : 120

  useEffect(() => {
    const node = inputRef.current
    if (!node) return
    node.style.height = '0px'
    const next = Math.min(Math.max(node.scrollHeight, 0), maxComposerPx)
    node.style.height = `${next}px`
    node.style.overflowY = node.scrollHeight > maxComposerPx ? 'auto' : 'hidden'
  }, [draft, hasMessages, inputRef, maxComposerPx])

  const placeholder = scheduleNudge
    ? SCHEDULE_PLACEHOLDER
    : hasMessages
      ? 'Ask a follow-up…'
      : 'Ask about Tomi’s experience, stack, or approach…'

  return (
    <div className={cn('flex flex-col', hasMessages ? 'gap-1.5' : 'gap-2')}>
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
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          'w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-snug ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          hasMessages ? 'min-h-10' : 'min-h-16',
        )}
      />
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {showMeta ? (
          <div className="min-w-0 space-y-0.5">
            <p className="text-[11px] leading-snug text-muted-foreground">
              Prototype — don’t take the results seriously.
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Don’t send secrets.{' '}
              <Link
                to="/privacy"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() =>
                  track('Nav Clicked', {
                    to: '/privacy',
                    source: 'ask_tomi_composer',
                  })
                }
              >
                Privacy
              </Link>
            </p>
            <p className="hidden text-[11px] leading-snug text-muted-foreground lg:block">
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
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
