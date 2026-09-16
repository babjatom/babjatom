import { describe, expect, it } from 'vitest'
import {
  JD_MAX_FILE_BYTES,
  JD_MAX_FILES,
  describeJdUpload,
  validateJdFiles,
} from '@/presentation/ask-tomi/jd-file-validation'

function makeFile(
  name: string,
  options?: { type?: string; size?: number },
) {
  const size = options?.size ?? 12
  const contents = new Uint8Array(size)
  return new File([contents], name, {
    type: options?.type ?? 'application/pdf',
  })
}

describe('validateJdFiles', () => {
  it('accepts pdf, docx, and txt files', () => {
    const result = validateJdFiles([
      makeFile('role.pdf', { type: 'application/pdf' }),
      makeFile('role.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
      makeFile('role.txt', { type: 'text/plain' }),
    ])

    expect(result.issues).toEqual([])
    expect(result.accepted.map((file) => file.name)).toEqual([
      'role.pdf',
      'role.docx',
      'role.txt',
    ])
  })

  it('rejects unsupported extensions', () => {
    const result = validateJdFiles([
      makeFile('photo.png', { type: 'image/png' }),
    ])

    expect(result.accepted).toEqual([])
    expect(result.issues[0]?.code).toBe('unsupported_type')
    expect(result.issues[0]?.message).toMatch(/pdf, docx, or txt/i)
  })

  it('rejects files over the size limit', () => {
    const result = validateJdFiles([
      makeFile('huge.pdf', { size: JD_MAX_FILE_BYTES + 1 }),
    ])

    expect(result.accepted).toEqual([])
    expect(result.issues[0]?.code).toBe('too_large')
  })

  it('rejects more than the max number of files', () => {
    const existing = Array.from({ length: JD_MAX_FILES }, (_, index) =>
      makeFile(`role-${index}.pdf`),
    )
    const result = validateJdFiles([makeFile('extra.pdf')], existing)

    expect(result.accepted).toHaveLength(JD_MAX_FILES)
    expect(result.issues[0]?.code).toBe('too_many')
  })

  it('allows empty mime types when the extension is valid', () => {
    const result = validateJdFiles([makeFile('role.pdf', { type: '' })])

    expect(result.issues).toEqual([])
    expect(result.accepted).toHaveLength(1)
  })
})

describe('describeJdUpload', () => {
  it('summarizes one or many files for the chat bubble', () => {
    expect(describeJdUpload([makeFile('role.pdf')])).toBe(
      'Uploaded JD: role.pdf',
    )
    expect(
      describeJdUpload([makeFile('a.pdf'), makeFile('b.txt', { type: 'text/plain' })]),
    ).toBe('Uploaded JD:\n• a.pdf\n• b.txt')
  })
})
