import { ipcRenderer } from 'electron'
import connect from '../connect'

Promise.all([waitForServerStart(), waitForDomReady()])
  .then(
    ([url]) => {
      document.getElementById('server-message')
        .textContent = `Server running on ${url}, trying to connect.`

      return connect({
        url,
        onStart ({ id }) { console.log(`starting phonebook at initial state ${id}`) },
        onTransition ({ from, to }) { console.log(`transitioning from ${from} to ${to}`) },
        onClose() { console.log('disconnected') }
      })
    }
  ).then(
    ({ url }) => {
      document.getElementById('server-message')
        .textContent = `Connected to ${url} was successful, weichspielapparat is ready.`
    },
    err => {
      document.getElementById('server-message')
        .textContent = `Connection failed. Error: ${err.message}.`
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
  return new Promise(resolve => {
    window.addEventListener('load', () => {
      resolve()
    })
  })
}
