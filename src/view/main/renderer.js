import { ipcRenderer } from 'electron'

Promise.all([waitForServerStart(), waitForDomReady()])
  .then(
    ([url]) => {
      document.getElementById('server-message')
        .textContent = `Server running on ${url}.`
    }
  )

function waitForServerStart () {
  return new Promise((resolve, reject) => {
    ipcRenderer.once(
      'fernspielapparatReady',
      (_evt, url) => {
        resolve(url)
      }
    )
    ipcRenderer.once(
      'fernspielapparatError',
      (_evt, err) => {
        reject(err)
      }
    )
  })
}

function waitForDomReady () {
  return new Promise((resolve, _reject) => {
    window.addEventListener('load', () => {
      resolve()
    })
  })
}
