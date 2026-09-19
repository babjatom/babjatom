import { ThemeService } from '@/application/theme-service'
import { createLocalStoragePersistence } from '@/infrastructure/local-storage-persistence'
import { applyTheme } from '@/presentation/theme/apply-theme'

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

function reapplyStoredTheme() {
  const service = new ThemeService(createLocalStoragePersistence())
  applyTheme(service.loadSession().activeTheme)
}

function ensureJsDosStylesheet(cssHref: string): Promise<void> {
  const existing = document.querySelector<HTMLLinkElement>(
    `link[href="${cssHref}"]`,
  )
  if (existing) {
    reapplyStoredTheme()
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssHref
    link.onload = () => {
      reapplyStoredTheme()
      resolve()
    }
    link.onerror = () => {
      // Player may still run without chrome styles; do not block Dos().
      reapplyStoredTheme()
      resolve()
    }
    document.head.appendChild(link)
  })
}

let loadPromise: Promise<DosFn> | null = null

export function loadDosPlayer(): Promise<DosFn> {
  if (window.Dos) {
    return Promise.resolve(window.Dos)
  }
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = (async () => {
    const cssHref = publicUrl('js-dos/js-dos.css')
    await ensureJsDosStylesheet(cssHref)

    if (window.Dos) {
      return window.Dos
    }

    return new Promise<DosFn>((resolve, reject) => {
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
  })().catch((error) => {
    loadPromise = null
    throw error
  })

  return loadPromise
}

export function dosAssetUrl(relativePath: string): string {
  return publicUrl(relativePath)
}

export function dosEmulatorsPathPrefix(): string {
  return publicUrl('js-dos/emulators/')
}
