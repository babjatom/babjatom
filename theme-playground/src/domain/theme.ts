export type ThemeTokens = {
  background: string
  foreground: string
  card: string
  'card-foreground': string
  primary: string
  'primary-foreground': string
  secondary: string
  'secondary-foreground': string
  muted: string
  'muted-foreground': string
  accent: string
  'accent-foreground': string
  destructive: string
  'destructive-foreground': string
  border: string
  input: string
  ring: string
  radius: string
}

export type Theme = {
  id: string
  name: string
  tokens: ThemeTokens
  generated?: boolean
}

export const THEME_TOKEN_KEYS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'radius',
] as const satisfies ReadonlyArray<keyof ThemeTokens>

export function createTheme(
  id: string,
  name: string,
  tokens: ThemeTokens,
  generated = false,
): Theme {
  return { id, name, tokens, generated }
}
