import { ipcRenderer } from 'electron'

export default new Promise((resolve, reject) => {
  ipcRenderer.once(
    'fernspielapparatReady',
    (_evt, url) => {
      resolve(url)
    }
  )
  ipcRenderer.once(
    'fernspielapparatError',
    (_evt, err) => {
      const msg = err.message || err
      console.error(err)
      reject(new Error(`Server startup failed: ${msg}`))
    }
  )
})
