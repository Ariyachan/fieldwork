import { cp, rm, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const docsRoot = resolve(projectRoot, 'docs')
if (!docsRoot.startsWith(`${projectRoot}${sep}`))
  throw new Error('Publish directory must stay inside the project')
await rm(docsRoot, { recursive: true, force: true })
await cp(resolve(projectRoot, 'dist'), docsRoot, { recursive: true })
await writeFile(resolve(docsRoot, '.nojekyll'), '')
console.log('Published build copied to docs/.')
