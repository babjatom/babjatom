export const JD_MAX_FILES = 3
export const JD_MAX_FILE_BYTES = 5 * 1024 * 1024
export const JD_MAX_TOTAL_BYTES = JD_MAX_FILES * JD_MAX_FILE_BYTES

export const JD_ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const

const JD_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export type JdValidationErrorCode =
  | 'unsupported_type'
  | 'too_large'
  | 'too_many'
  | 'total_too_large'
  | 'duplicate'

export type JdValidationIssue = {
  code: JdValidationErrorCode
  fileName?: string
  message: string
}

export type JdValidationResult = {
  accepted: File[]
  issues: JdValidationIssue[]
}

function extensionOf(fileName: string) {
  const match = /\.[^.]+$/.exec(fileName.trim().toLowerCase())
  return match?.[0] ?? ''
}

export function isAllowedJdExtension(fileName: string) {
  return (JD_ALLOWED_EXTENSIONS as readonly string[]).includes(
    extensionOf(fileName),
  )
}

export function isAllowedJdMimeType(mimeType: string) {
  const normalized = mimeType.trim().toLowerCase()
  if (!normalized) return true
  return JD_ALLOWED_MIME_TYPES.has(normalized)
}

export function formatJdFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateJdFiles(
  incoming: Iterable<File>,
  alreadySelected: readonly File[] = [],
): JdValidationResult {
  const accepted: File[] = [...alreadySelected]
  const issues: JdValidationIssue[] = []
  const selectedKeys = new Set(
    alreadySelected.map((file) => `${file.name}:${file.size}:${file.lastModified}`),
  )

  for (const file of incoming) {
    if (accepted.length >= JD_MAX_FILES) {
      issues.push({
        code: 'too_many',
        fileName: file.name,
        message: `You can upload up to ${JD_MAX_FILES} job descriptions.`,
      })
      break
    }

    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (selectedKeys.has(key)) {
      issues.push({
        code: 'duplicate',
        fileName: file.name,
        message: `"${file.name}" is already attached.`,
      })
      continue
    }

    if (!isAllowedJdExtension(file.name) || !isAllowedJdMimeType(file.type)) {
      issues.push({
        code: 'unsupported_type',
        fileName: file.name,
        message: `"${file.name}" is not supported. Use PDF, DOCX, or TXT.`,
      })
      continue
    }

    if (file.size > JD_MAX_FILE_BYTES) {
      issues.push({
        code: 'too_large',
        fileName: file.name,
        message: `"${file.name}" is too large. Max size is ${formatJdFileSize(JD_MAX_FILE_BYTES)} per file.`,
      })
      continue
    }

    const nextTotal = accepted.reduce((sum, entry) => sum + entry.size, 0) + file.size
    if (nextTotal > JD_MAX_TOTAL_BYTES) {
      issues.push({
        code: 'total_too_large',
        fileName: file.name,
        message: `Selected files exceed the ${formatJdFileSize(JD_MAX_TOTAL_BYTES)} total limit.`,
      })
      continue
    }

    accepted.push(file)
    selectedKeys.add(key)
  }

  return { accepted, issues }
}

export function describeJdUpload(files: readonly File[]) {
  if (files.length === 0) return 'Uploaded JD'
  if (files.length === 1) return `Uploaded JD: ${files[0]?.name ?? 'file'}`
  return `Uploaded JD:\n${files.map((file) => `• ${file.name}`).join('\n')}`
}
