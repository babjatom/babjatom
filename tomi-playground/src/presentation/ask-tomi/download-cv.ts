/** Public CV PDF served from Vite `public/` (site root). */
export const TOMI_CV_PDF_HREF = '/tomi-babjak-cv.pdf'
export const TOMI_CV_PDF_FILENAME = 'tomi-babjak-cv.pdf'

/** Trigger a browser download of the CV PDF without navigating away. */
export function downloadCvPdf(
  doc: Document = document,
  href: string = TOMI_CV_PDF_HREF,
  filename: string = TOMI_CV_PDF_FILENAME,
): void {
  const anchor = doc.createElement('a')
  anchor.href = href
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  doc.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
