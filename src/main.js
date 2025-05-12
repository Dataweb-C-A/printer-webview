const { app, BrowserWindow, globalShortcut } = require('electron')
// const { autoUpdater } = require('electron-updater')
const path = require('path');

require('./websocket')
require('./extension')
require('dotenv').config()

let mainWindow

const URL = process.env.APP_URL || 'http://localhost:3000'

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    frame: false,
    kiosk: false,
    resizable: false,
    movable: false,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  mainWindow.loadURL(URL, {"extraHeaders" : "pragma: no-cache\n"})

  const KEYS_DISABLED = ['F11', 'F12', 'Escape']

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (KEYS_DISABLED.includes(input.key)) {
      event.preventDefault() 
    }
  })
}

app.whenReady().then(createWindow)

app.disableHardwareAcceleration()

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})