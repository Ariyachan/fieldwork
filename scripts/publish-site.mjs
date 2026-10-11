import { cp, mkdir, writeFile } from 'node:fs/promises'

await mkdir('docs', { recursive: true })
await cp('dist', 'docs', { recursive: true })
await writeFile('docs/.nojekyll', '')
console.log('Published build copied to docs/.')
