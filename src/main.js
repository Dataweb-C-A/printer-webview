const { app, BrowserWindow, globalShortcut } = require('electron')
require('dotenv').config()

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    frame: false,
    kiosk: false,
    resizable: false,
    movable: false,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadURL(process.env.APP_URL || 'https://google.com')

  mainWindow.on('leave-full-screen', () => {
    if (!globalShortcut.isPressed('F11')) {
      mainWindow.setFullScreen(true)
    }
  })

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || input.key === 'Escape') {
      event.preventDefault() 
    }
  })
}

app.whenReady().then(createWindow)

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})