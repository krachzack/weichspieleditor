import { app, BrowserWindow } from 'electron'
import launchRuntime from './server/runtime.js'

let mainWindow

function createWindow () {
  /**
   * @type {import('child_process').ChildProcess} child process set when window contents first loaded
   */
  let runtimeProcess

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // same color as loading overlay, so we don't see white flashing at startup
    backgroundColor: '#444444',
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  mainWindow.webContents.once('did-finish-load', () => {
    console.log('launching runtime...')
    launchRuntime().then(
      ({ process, url }) => {
        runtimeProcess = process
        console.log(`runtime is up and running on 0.0.0.0:38397`)
        mainWindow.webContents.send('fernspielapparatReady', url)
      },
      err => {
        console.error('runtime startup failure', err)
        mainWindow.webContents.send('fernspielapparatError', err)
      }
    )
  })

  mainWindow.on('closed', function () {
    // Free the window
    mainWindow = null

    if (runtimeProcess) {
      runtimeProcess.kill()
    }
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  app.quit()
})
