import { describe, expect, it, vi } from 'vitest'
import {
  TOMI_CV_PDF_FILENAME,
  TOMI_CV_PDF_HREF,
  downloadCvPdf,
} from '@/presentation/ask-tomi/download-cv'

describe('downloadCvPdf', () => {
  it('appends a temporary anchor, clicks it, and removes it', () => {
    const click = vi.fn()
    const remove = vi.fn()
    const appendChild = vi.fn()
    const anchor = {
      href: '',
      download: '',
      rel: '',
      style: { display: '' },
      click,
      remove,
    }
    const createElement = vi.fn(() => anchor)
    const doc = {
      createElement,
      body: { appendChild },
    } as unknown as Document

    downloadCvPdf(doc)

    expect(createElement).toHaveBeenCalledWith('a')
    expect(anchor.href).toBe(TOMI_CV_PDF_HREF)
    expect(anchor.download).toBe(TOMI_CV_PDF_FILENAME)
    expect(anchor.rel).toBe('noopener')
    expect(appendChild).toHaveBeenCalledWith(anchor)
    expect(click).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
