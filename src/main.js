import { app, BrowserWindow } from 'electron'
import launchRuntime from './server/runtime.js'

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('launching runtime...')
    launchRuntime().then(
      ({ port }) => {
        console.log(`runtime is up and running on port ${port}`)
        mainWindow.webContents.send('fernspielapparatReady', port)
      },
      err => mainWindow.webContents.send('fernspielapparatError', err)
    )
  })

  mainWindow.on('closed', function () {
    // Free the window
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  app.quit()
})
