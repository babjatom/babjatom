import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  detectJdFileKind,
  JdParseError,
  MAX_JD_CHARS,
  parseJdFile,
} from '@/infrastructure/parse-jd-file'

const getDocument = vi.fn()
const extractRawText = vi.fn()

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: (...args: unknown[]) => getDocument(...args),
}))

vi.mock('mammoth', () => ({
  extractRawText: (...args: unknown[]) => extractRawText(...args),
}))

function pdfFile(name = 'role.pdf') {
  return new File(['%PDF-fake'], name, { type: 'application/pdf' })
}

describe('parseJdFile', () => {
  beforeEach(() => {
    getDocument.mockReset()
    extractRawText.mockReset()
  })

  it('detects pdf and docx names', () => {
    expect(detectJdFileKind(pdfFile())).toBe('pdf')
    expect(
      detectJdFileKind(
        new File(['x'], 'job.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      ),
    ).toBe('docx')
    expect(
      detectJdFileKind(new File(['x'], 'notes.txt', { type: 'text/plain' })),
    ).toBeNull()
  })

  it('extracts pdf text', async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({
            items: [{ str: 'React' }, { str: 'TypeScript' }],
          }),
        }),
      }),
    })
    await expect(parseJdFile(pdfFile())).resolves.toBe('React TypeScript')
  })

  it('extracts docx text', async () => {
    extractRawText.mockResolvedValue({ value: '  Backend  Go  ' })
    const file = new File(['pk'], 'job.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    await expect(parseJdFile(file)).resolves.toBe('Backend Go')
  })

  it('rejects an unsupported type', async () => {
    await expect(
      parseJdFile(new File(['x'], 'notes.txt', { type: 'text/plain' })),
    ).rejects.toBeInstanceOf(JdParseError)
  })

  it('rejects empty extracted text', async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({ items: [{ str: '   ' }] }),
        }),
      }),
    })
    await expect(parseJdFile(pdfFile())).rejects.toThrow(/no readable text/i)
  })

  it('rejects oversized extracted text', async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: async () => ({
          getTextContent: async () => ({
            items: [{ str: 'a'.repeat(MAX_JD_CHARS + 1) }],
          }),
        }),
      }),
    })
    await expect(parseJdFile(pdfFile())).rejects.toThrow(/8000/)
  })
})
