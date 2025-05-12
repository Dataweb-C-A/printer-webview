const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path');

require('./websocket')
require('./extension')
require('dotenv').config()

let mainWindow

const URL = process.env.APP_URL || 'http://localhost:3000'

function configureAutoUpdater() {
  autoUpdater.logger = require('electron-log')
  autoUpdater.logger.transports.file.level = 'info'

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for updates...')
  })

  autoUpdater.on('update-available', () => {
    sendStatusToWindow('Update available.')
  })

  autoUpdater.on('update-not-available', () => {
    sendStatusToWindow('Update not available.')
  })

  autoUpdater.on('error', (err) => {
    sendStatusToWindow(`Error in auto-updater: ${err.toString()}`)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    sendStatusToWindow(
      `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`
    )
  })

  autoUpdater.on('update-downloaded', () => {
    sendStatusToWindow('Update downloaded. Will install on restart.')
  })
}

function sendStatusToWindow(text) {
  if (mainWindow) {
    mainWindow.webContents.send('update-message', text)
  }
}

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
      contextIsolation: true,
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

app.whenReady().then(() => {
  createWindow()
  configureAutoUpdater()
  
  autoUpdater.checkForUpdatesAndNotify()
  
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 60 * 60 * 1000)
})

app.disableHardwareAcceleration()

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify()
})