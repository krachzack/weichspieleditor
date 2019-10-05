// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')
const launchRuntime = require('./server/runtime.js')

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'view/main/preload.js')
    }
  })

  mainWindow.loadFile('src/view/main/index.html')

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
