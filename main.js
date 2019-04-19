'use strict';

const {BrowserWindow, Menu, app, shell, dialog} = require('electron');
const os = require('os');
var path = require('path');

var mainWindow;

function createWindow () {

    mainWindow = new BrowserWindow({
        frame: false,
        width: 600,
        height: 300,
        icon: path.join(__dirname, 'assets/app-icon/png/64.png')
    });

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

}

app.on('ready', createWindow)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});