import https from 'https'
import fs from 'fs'
import { basename } from 'path'
import { reportDownload } from './progress.js'

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

/**
 * Download a URL or hostname/path combination to a file.
 * 
 * The `Accept` header is specified as `application/octet-stream`.
 * 
 * @param {*} opts url and optional headers 
 * @param {string} toFile path to download to
 * @param {import('./progress.js').ProgressCallback} [progress] called when starting sub-task or making progress (optional)
 * @returns {Promise<String>} promise that resolves to the target path when completed
 */
export function download ({ url, hostname, path, headers }, toFile, progress) {
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
              toFile,
              progress
            )
          )
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          // success
          const length = Math.max(1, res.headers['content-length']|0) // prevent division by zero
          const file = fs.createWriteStream(toFile)
          res.pipe(file)

          const filename = basename(new URL(`https://${hostname}${path}`).pathname)
          console.log(`URL: ${url}`)
          console.log(`downloading ${filename} with size ${length / 1024 / 1024}MiB ...`)
          
          let update = setInterval(
            () => {
              const doneRatio = Math.max(0, Math.min(1, res.socket.bytesRead / length))
              reportDownload(progress, doneRatio)
            },
            150
          )

          file.on('finish', () => {
            file.close()
            stopProgress()
          })
          file.on('error', err => {
            reject(new Error(`File write error: ${err.message}`))
            clearInterval(update)
            stopProgress()
          })
          res.on('end', () => {
            file.close() // wait till file is closed and then resolve
            stopProgress()
          })
          file.on('close', () => {
            resolve(toFile)
            stopProgress()
          })

          function stopProgress () {
            if (update) {
              clearInterval(update)
              update = null
            }
          }
        } else {
          reject(new Error(`HTTP request failed, status: ${res.statusCode}`))
        }
      }
    ).on('error', ({ message }) => {
      reject(new Error(`HTTP request failed: ${message}`))
    }).end()
  })
}
