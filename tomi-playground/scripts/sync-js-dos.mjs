import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const playgroundRoot = path.resolve(scriptDir, '..')
const sourceDist = path.join(playgroundRoot, 'node_modules/js-dos/dist')
const targetDir = path.join(playgroundRoot, 'public/js-dos')

if (!existsSync(sourceDist)) {
  console.error('js-dos is not installed. Run pnpm install first.')
  process.exit(1)
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })

for (const file of ['js-dos.js', 'js-dos.css', 'js-dos.js.map']) {
  copyFileSync(path.join(sourceDist, file), path.join(targetDir, file))
}

cpSync(path.join(sourceDist, 'emulators'), path.join(targetDir, 'emulators'), {
  recursive: true,
})

console.log('Synced js-dos assets to public/js-dos/')
