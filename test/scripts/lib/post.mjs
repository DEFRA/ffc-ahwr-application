import { inspect } from 'node:util'

const post = async (path, data) => {
  const res = await fetch(`http://localhost:3001/api/${path}`, {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data)
  })

  console.log(res.status, res.statusText)
  console.log(inspect(await res.json(), { depth: Infinity }))
}

export { post }
