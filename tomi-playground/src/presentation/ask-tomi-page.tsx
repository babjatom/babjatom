import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AskTomiComposer } from './ask-tomi-composer'
import { AskTomiTranscript } from './ask-tomi-transcript'
import { useTomiChat, type ChatMessage } from './use-tomi-chat'

function findLastAssistantId(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'assistant') {
      return messages[index]?.id
    }
  }
  return undefined
}

export function AskTomiPage() {
  const { messages, pending, send, stop, regenerate, clear, copy } =
    useTomiChat()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [typingDoneIds, setTypingDoneIds] = useState<Record<string, boolean>>(
    {},
  )
  const listRef = useRef<HTMLDivElement>(null)

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

  const handleTypingDone = useCallback((id: string) => {
    setTypingDoneIds((current) =>
      current[id] ? current : { ...current, [id]: true },
    )
  }, [])

  const handleCopy = useCallback(
    (message: ChatMessage) => {
      void copy(message.content).then(() => setCopiedId(message.id))
    },
    [copy],
  )

  const handleRegenerate = useCallback(
    (id: string) => {
      setTypingDoneIds((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      void regenerate(id)
    },
    [regenerate],
  )

  const handleSendStarter = useCallback(
    (prompt: string) => {
      void send(prompt, { source: 'starter', starter_id: prompt })
    },
    [send],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border/70 px-3">
        <div className="min-w-0">
          <h1 className="font-display text-base font-semibold tracking-tight sm:text-lg">
            Ask Tomi
          </h1>
          <p className="truncate text-[11px] text-muted-foreground">
            Follow-ups in this chat can refer to earlier answers for about 30
            minutes.
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs"
            onClick={() => {
              clear()
              setTypingDoneIds({})
            }}
            aria-label="Clear chat"
          >
            <Eraser className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </header>

      <AskTomiTranscript
        messages={messages}
        pending={pending}
        copiedId={copiedId}
        lastAssistantId={findLastAssistantId(messages)}
        typingDoneIds={typingDoneIds}
        listRef={listRef}
        onSendStarter={handleSendStarter}
        onCopy={handleCopy}
        onRegenerate={handleRegenerate}
        onTypingProgress={scrollToBottom}
        onTypingDone={handleTypingDone}
      />

      <AskTomiComposer pending={pending} onSend={send} onStop={stop} />
    </div>
  )
}
