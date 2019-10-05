import { ipcRenderer } from 'electron'

Promise.all([waitForServerStart(), waitForDomReady()])
  .then(
    ([port]) => {
      document.getElementById('server-message')
        .textContent = `Server running on port ${port}.`
    }
  )

function waitForServerStart () {
  return new Promise((resolve, reject) => {
    ipcRenderer.once(
      'fernspielapparatReady',
      (_evt, port) => {
        resolve(port)
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
