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
    <div className={cn('flex min-h-0 flex-1 flex-col gap-2', className)}>
      <div
        aria-label="Job description drop zone"
        className={cn(
          'flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/60 px-4 py-8 text-center outline-none transition-colors',
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
          className="h-8 w-8 text-muted-foreground"
          aria-hidden
        />
        <p className="mt-3 font-display tracking-[0.28em] text-foreground">
          <span className="text-3xl font-bold leading-none">J</span>
          <span className="text-sm font-light uppercase leading-none">ob</span>{' '}
          <span className="text-3xl font-bold leading-none">D</span>
          <span className="text-sm font-light uppercase leading-none">
            escriptions
          </span>
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Tomi AI will analyze JDs and respond with relevant matches and a
          tailored CV.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <p className="text-sm font-medium tracking-wide text-foreground">
            Drag &amp; Drop
          </p>
          <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
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
        <p className="mt-3 text-xs text-muted-foreground">
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
