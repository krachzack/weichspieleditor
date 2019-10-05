import https from 'https'
import fs from 'fs'

export function getJson ({ hostname, path, headers }) {
  if (!headers) {
    headers = {}
  }
  if (!headers.accept) {
    headers.accept = 'application/json'
  }

  return getUtf8({ hostname, path, headers })
    .then(({ statusCode, contentType, body }) => {
      if (contentType !== 'application/json' && contentType !== 'application/json; charset=utf-8') {
        // stop if unexpected content type
        return Promise.reject(
          new Error(`Response with status ${statusCode} has unexpected Content-Type ${contentType}, response body:\n${body}`)
        )
      }

      // otherwise parse and succeed
      return {
        statusCode,
        json: JSON.parse(body)
      }
    })
}

function getUtf8 ({ hostname, path, headers }) {
  if (!hostname) {
    return Promise.reject(new Error(`Hostname is empty`))
  }

  if (!path) {
    return Promise.reject(new Error(`Path is empty`))
  }

  return new Promise((resolve, reject) => {
    const opts = { hostname, path, headers }
    https.get(opts, res => {
      res.setEncoding('utf8')
      let body = ''
      res.on('data', data => {
        body += data
      })
      res.on('end', () => {
        const contentType = res.headers['content-type']
        resolve({
          statusCode: res.statusCode,
          contentType: contentType.toLowerCase(),
          body
        })
      })
    }).on('error', ({ message }) => {
      reject(new Error(`HTTP request failed: ${message}`))
    })
  })
}

export function download ({ url, hostname, path, headers }, toFile) {
  return new Promise((resolve, reject) => {
    if (url) {
      const parsed = new URL(url)
      hostname = parsed.hostname
      path = parsed.pathname + parsed.search
    }

    if (!headers.Accept) {
      headers.Accept = 'application/octet-stream'
    }

    https.request(
      {
        hostname,
        path,
        method: 'GET',
        headers
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          // redirect
          resolve(
            download(
              {
                url: res.headers.location || res.headers.Location,
                headers
              },
              toFile
            )
          )
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          // success
          const file = fs.createWriteStream(toFile)
          res.pipe(file)
          file.on('finish', () => {
            file.close()
          })
          file.on('error', err => {
            reject(new Error(err))
          })
          res.on('end', () => {
            file.close()
            resolve(toFile)
          })
        } else {
          reject(new Error(`HTTP request failed, status: ${res.statusCode}`))
        }
      }
    ).on('error', ({ message }) => {
      reject(new Error(`HTTP request failed: ${message}`))
    }).end()
  })
}
