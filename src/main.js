const { app, BrowserWindow, globalShortcut } = require('electron')
const path = require('path');

require('./websocket');
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
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  mainWindow.loadURL(process.env.APP_URL || 'https://localhost:3000')

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