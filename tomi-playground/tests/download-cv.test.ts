import { describe, expect, it, vi } from 'vitest'
import {
  CV_VARIANTS,
  downloadCvPdf,
  type CvVariant,
} from '@/presentation/ask-tomi/download-cv'

describe('downloadCvPdf', () => {
  it.each(Object.keys(CV_VARIANTS) as CvVariant[])(
    'downloads the %s CV and removes the temporary anchor',
    (variant) => {
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

      downloadCvPdf(variant, doc)

      expect(createElement).toHaveBeenCalledWith('a')
      expect(anchor.href).toBe(CV_VARIANTS[variant].href)
      expect(anchor.download).toBe(CV_VARIANTS[variant].filename)
      expect(anchor.rel).toBe('noopener')
      expect(appendChild).toHaveBeenCalledWith(anchor)
      expect(click).toHaveBeenCalledTimes(1)
      expect(remove).toHaveBeenCalledTimes(1)
    },
  )
})
