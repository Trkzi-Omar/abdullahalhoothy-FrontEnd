import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const lintableExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])
const readFromStdin = process.argv.includes('--stdin')

const stdin = readFromStdin
  ? await new Promise(resolveStdin => {
      let data = ''
      process.stdin.setEncoding('utf8')
      process.stdin.on('data', chunk => {
        data += chunk
      })
      process.stdin.on('end', () => {
        resolveStdin(data)
      })
      process.stdin.resume()
    })
  : ''

const rawFiles = [
  ...process.argv.slice(2).filter(argument => argument !== '--stdin'),
  ...stdin.split(/\r?\n/),
]

const files = [...new Set(rawFiles)]
  .map(file => file.trim())
  .filter(Boolean)
  .filter(file => lintableExtensions.has(extname(file)))
  .filter(file => existsSync(file))

if (files.length === 0) {
  console.log('No lintable files to check.')
  process.exit(0)
}

const eslintBinary = resolve(
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'eslint.cmd' : 'eslint',
)

if (!existsSync(eslintBinary)) {
  console.error('Local ESLint binary not found. Run `npm install` first.')
  process.exit(1)
}

const result = spawnSync(
  eslintBinary,
  ['--max-warnings', '0', '--no-warn-ignored', ...files],
  { encoding: 'utf8' },
)

if (result.stdout) {
  process.stdout.write(result.stdout)
}

if (result.stderr) {
  process.stderr.write(result.stderr)
}

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
