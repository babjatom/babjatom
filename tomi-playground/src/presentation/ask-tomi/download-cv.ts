/** Public CV PDFs served from Vite `public/` (site root). */
export const CV_VARIANTS = {
  fullstack: {
    href: '/tomi-babjak-cv.pdf',
    filename: 'tomi-babjak-cv.pdf',
  },
  frontend: {
    href: '/tomi-babjak-cv-frontend.pdf',
    filename: 'tomi-babjak-cv-frontend.pdf',
  },
  backend: {
    href: '/tomi-babjak-cv-backend.pdf',
    filename: 'tomi-babjak-cv-backend.pdf',
  },
} as const

export type CvVariant = keyof typeof CV_VARIANTS

/** Trigger a browser download of one CV PDF without navigating away. */
export function downloadCvPdf(
  variant: CvVariant,
  doc: Document = document,
): void {
  const { href, filename } = CV_VARIANTS[variant]
  const anchor = doc.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  doc.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
