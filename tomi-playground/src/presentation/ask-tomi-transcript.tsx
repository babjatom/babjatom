import { memo, useEffect, type RefObject } from 'react'
import ReactMarkdown from 'react-markdown'
import { Copy, LoaderCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { usePendingStatus } from './use-pending-status'
import { useTypewriter } from './use-typewriter'
import {
  STARTER_PROMPTS,
  type ChatMessage,
} from './use-tomi-chat'

type AskTomiTranscriptProps = {
  messages: ChatMessage[]
  pending: boolean
  copiedId: string | null
  lastAssistantId: string | undefined
  typingDoneIds: Record<string, boolean>
  listRef: RefObject<HTMLDivElement | null>
  onSendStarter: (prompt: string) => void
  onCopy: (message: ChatMessage) => void
  onRegenerate: (id: string) => void
  onTypingProgress: () => void
  onTypingDone: (id: string) => void
}

const AssistantBody = memo(function AssistantBody({
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
})

const ChatBubble = memo(function ChatBubble({
  message,
  isLatestAssistant,
  typingComplete,
  copiedId,
  pending,
  onCopy,
  onRegenerate,
  onTypingProgress,
  onTypingDone,
}: {
  message: ChatMessage
  isLatestAssistant: boolean
  typingComplete: boolean
  copiedId: string | null
  pending: boolean
  onCopy: (message: ChatMessage) => void
  onRegenerate: (id: string) => void
  onTypingProgress: () => void
  onTypingDone: (id: string) => void
}) {
  const isUser = message.role === 'user'
  const showActions =
    !isUser &&
    message.status !== 'pending' &&
    isLatestAssistant &&
    typingComplete

  return (
    <li className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[min(92%,36rem)] space-y-1.5')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2',
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
                isLatestAssistant && message.status === 'complete'
              }
              onTypingProgress={onTypingProgress}
              onTypingDone={() => onTypingDone(message.id)}
            />
          )}
        </div>
        {showActions && (
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!message.content.trim()}
              onClick={() => onCopy(message)}
              aria-label="Copy answer"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedId === message.id ? 'Copied' : 'Copy'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={pending}
              onClick={() => onRegenerate(message.id)}
              aria-label="Regenerate answer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </li>
  )
})

export function AskTomiTranscript({
  messages,
  pending,
  copiedId,
  lastAssistantId,
  typingDoneIds,
  listRef,
  onSendStarter,
  onCopy,
  onRegenerate,
  onTypingProgress,
  onTypingDone,
}: AskTomiTranscriptProps) {
  return (
    <section
      ref={listRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [overflow-anchor:none]"
      aria-live="polite"
      aria-relevant="additions"
    >
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col">
        {messages.length === 0 ? (
          <div className="mt-auto flex flex-col justify-end gap-3">
            <p className="text-sm text-muted-foreground">
              Start with a suggested question, or type your own below.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-auto max-w-full justify-start whitespace-normal px-2.5 py-1.5 text-left text-xs font-medium"
                  disabled={pending}
                  onClick={() => onSendStarter(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((message) => {
              const isLatestAssistant = message.id === lastAssistantId
              const typingComplete =
                !isLatestAssistant ||
                message.status !== 'complete' ||
                Boolean(typingDoneIds[message.id])

              return (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isLatestAssistant={isLatestAssistant}
                  typingComplete={typingComplete}
                  copiedId={copiedId}
                  pending={pending}
                  onCopy={onCopy}
                  onRegenerate={onRegenerate}
                  onTypingProgress={onTypingProgress}
                  onTypingDone={onTypingDone}
                />
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
