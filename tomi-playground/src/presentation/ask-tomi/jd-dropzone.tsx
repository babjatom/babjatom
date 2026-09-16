import {
  type ChangeEvent,
  type DragEvent,
  useId,
  useRef,
  useState,
} from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  JD_ALLOWED_EXTENSIONS,
  JD_MAX_FILE_BYTES,
  JD_MAX_FILES,
  formatJdFileSize,
  validateJdFiles,
} from './jd-file-validation'

type JdDropzoneProps = {
  disabled?: boolean
  className?: string
  onAnalyze: (files: File[]) => void | Promise<void>
}

export function JdDropzone({
  disabled = false,
  className,
  onAnalyze,
}: JdDropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function applyIncoming(incoming: Iterable<File>) {
    if (disabled) return

    const result = validateJdFiles(incoming)
    if (result.accepted.length === 0) {
      setError(result.issues[0]?.message ?? 'Could not use that file.')
      return
    }

    setError(result.issues[0]?.message ?? null)
    void onAnalyze(result.accepted)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const list = event.target.files
    if (list && list.length > 0) {
      applyIncoming(list)
    }
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    applyIncoming(event.dataTransfer.files)
  }

  const accept = JD_ALLOWED_EXTENSIONS.join(',')

  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:min-h-0 sm:flex-1',
        className,
      )}
    >
      <div
        aria-label="Job description drop zone"
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/60 px-3 py-5 text-center outline-none transition-colors sm:min-h-0 sm:flex-1 sm:px-4 sm:py-8',
          dragging && 'border-primary bg-primary/5',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-primary/60',
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.click()
        }}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget.contains(event.relatedTarget as Node)) return
          setDragging(false)
        }}
        onDrop={handleDrop}
      >
        <FileText
          className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8"
          aria-hidden
        />
        <p className="mt-2 font-display tracking-[0.14em] text-foreground sm:mt-3 sm:tracking-[0.28em]">
          <span className="text-2xl font-bold leading-none sm:text-3xl">J</span>
          <span className="text-xs font-light uppercase leading-none sm:text-sm">
            ob
          </span>{' '}
          <span className="text-2xl font-bold leading-none sm:text-3xl">D</span>
          <span className="text-xs font-light uppercase leading-none sm:text-sm">
            escriptions
          </span>
        </p>
        <p className="mt-1.5 hidden max-w-sm text-sm text-muted-foreground sm:mt-2 sm:block">
          Tomi AI will analyze JDs and respond with relevant matches and a
          tailored CV.
        </p>
        <p className="mt-1.5 max-w-xs text-xs text-muted-foreground sm:hidden">
          Analyze JDs for matches and a tailored CV.
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-4">
          <p className="hidden text-sm font-medium tracking-wide text-foreground sm:inline">
            Drag &amp; Drop
          </p>
          <span className="hidden text-xs font-semibold tracking-[0.18em] text-muted-foreground sm:inline">
            or
          </span>
          <Button
            type="button"
            size="sm"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              if (!disabled) inputRef.current?.click()
            }}
          >
            Upload
          </Button>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground sm:mt-3 sm:text-xs">
          PDF, DOCX, or TXT · up to {JD_MAX_FILES} files ·{' '}
          {formatJdFileSize(JD_MAX_FILE_BYTES)} each
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          accept={accept}
          multiple
          disabled={disabled}
          onChange={handleInputChange}
        />
      </div>

      {error && (
        <p className="shrink-0 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
