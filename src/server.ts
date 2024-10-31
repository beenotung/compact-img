import express from 'express'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import open from 'open'
import { join } from 'path'
import { findPort } from '@beenotung/tslib/net'
import { File } from './type'

let app = express()

app.use(express.static(join(__dirname, '..', 'public')))
app.use(express.json({ limit: '100mb' }))

app.post('/', async (req, res, next) => {
  try {
    let dir: string = req.body.dir
    let file: File = req.body.file
    let filename = file.originalname
    console.log('POST:', filename)
    if (dir) {
      mkdirSync(dir, { recursive: true })
    }
    let filepath = join(dir, filename)
    let buffer = Buffer.alloc(file.size, file.content, file.encoding)
    writeFileSync(filepath, buffer)
    res.end('saved')
  } catch (error) {
    console.error(error)
    res.status(500)
    res.json({ error: String(error) })
  }
})

app.post('/open', (req, res) => {
  let dir = req.body.dir || '.'
  console.log('OPEN:', dir)
  if (!existsSync(dir)) {
    console.log('NOT EXIST:', dir)
    res.status(400)
    res.json({ error: 'dir not exists' })
  } else {
    open(dir)
    res.end('ok')
  }
})

app.post('/close', (req, res) => {
  console.log('CLOSE')
  res.end('ok')
  setTimeout(() => {
    process.exit(0)
  }, 500)
})

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ error: String(error) })
})

async function main() {
  let port = await findPort({ initialPort: 8100, step: 100 })
  await new Promise<void>((resolve, reject) =>
    app.listen(port, resolve).on('error', reject),
  )
  let url = `http://127.0.0.1:${port}`
  console.log(`listening on ${url}`)
  await open(url)
}

main()
