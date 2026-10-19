/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIXPANEL_TOKEN?: string
  readonly VITE_TOMI_CAL_URL?: string
  readonly VITE_TOMI_CHAT_URL?: string
  readonly VITE_TOMI_TEST_CHAT_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
