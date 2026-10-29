export const MAX_JD_CHARS = 8000
export const MAX_JD_FILE_BYTES = 8 * 1024 * 1024

export const JD_FILE_ACCEPT =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const DOCX_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export class JdParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'JdParseError'
  }
}

export type JdFileKind = 'pdf' | 'docx'

export function detectJdFileKind(file: File): JdFileKind | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
  if (name.endsWith('.docx') || file.type === DOCX_TYPE) return 'docx'
  return null
}

function cleanExtractedText(raw: string): string {
  let withoutNull = ''
  for (const ch of raw) {
    if (ch !== '\0') withoutNull += ch
  }
  return withoutNull.replace(/\s+/g, ' ').trim()
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const line = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    pages.push(line)
  }
  return pages.join('\n')
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  })
  return result.value
}

export async function parseJdFile(file: File): Promise<string> {
  if (file.size > MAX_JD_FILE_BYTES) {
    throw new JdParseError(
      'That file is too large. Choose a PDF or DOCX under 8 MB.',
    )
  }
  const kind = detectJdFileKind(file)
  if (!kind) {
    throw new JdParseError('Choose a PDF or DOCX file.')
  }
  let raw = ''
  try {
    raw = kind === 'pdf' ? await extractPdfText(file) : await extractDocxText(file)
  } catch (error) {
    if (error instanceof JdParseError) throw error
    throw new JdParseError(
      'That file had no readable text. Use a text PDF or a DOCX file.',
    )
  }
  const cleaned = cleanExtractedText(raw)
  if (!cleaned) {
    throw new JdParseError(
      'That file had no readable text. Use a text PDF or a DOCX file.',
    )
  }
  if (cleaned.length > MAX_JD_CHARS) {
    throw new JdParseError(
      `Job description must be ${MAX_JD_CHARS} characters or fewer.`,
    )
  }
  return cleaned
}
