export type DosProps = {
  stop: () => Promise<void>
  save: () => Promise<boolean>
  setAutoSave: (value: boolean) => void
  setSoftFullscreen: (value: boolean) => void
  setFullScreen: (value: boolean) => void
  setKiosk: (value: boolean) => void
  setScaleControls: (value: number) => void
}

export type DosOptions = {
  url: string
  pathPrefix: string
  autoStart?: boolean
  autoSave?: boolean
  softFullscreen?: boolean
  fullScreen?: boolean
  kiosk?: boolean
  scaleControls?: number
  theme?: string
  lang?: 'en' | 'ru'
  mouseCapture?: boolean
  onEvent?: (event: string, arg?: unknown) => void
}

export type DosFn = (element: HTMLDivElement, options: Partial<DosOptions>) => DosProps

declare global {
  interface Window {
    Dos?: DosFn
  }
}

function publicUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${relativePath.replace(/^\//, '')}`
}

let loadPromise: Promise<DosFn> | null = null

export function loadDosPlayer(): Promise<DosFn> {
  if (window.Dos) {
    return Promise.resolve(window.Dos)
  }
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise((resolve, reject) => {
    const cssHref = publicUrl('js-dos/js-dos.css')
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssHref
      document.head.appendChild(link)
    }

    const script = document.createElement('script')
    script.src = publicUrl('js-dos/js-dos.js')
    script.async = true
    script.onload = () => {
      if (!window.Dos) {
        reject(new Error('js-dos loaded but window.Dos is missing'))
        loadPromise = null
        return
      }
      resolve(window.Dos)
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load js-dos'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

export function dosAssetUrl(relativePath: string): string {
  return publicUrl(relativePath)
}

export function dosEmulatorsPathPrefix(): string {
  return publicUrl('js-dos/emulators/')
}
