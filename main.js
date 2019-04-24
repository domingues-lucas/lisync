'use strict';

const {BrowserWindow, Menu, app, shell, dialog, Tray} = require('electron');
const os = require('os');

let path = require('path');
let mainWindow;
let tray = null;

function createWindow () {

    mainWindow = new BrowserWindow({
        frame: true,
        width: 600,
        height: 300,
        icon: path.join(__dirname, 'assets/app-icon/png/64.png')
    });

    mainWindow.loadFile('index.html');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setMenu(null);
    mainWindow.webContents.openDevTools();

    mainWindow.on('close', function (event) {
        if(!app.isQuiting){
            event.preventDefault();
            mainWindow.hide();
        }
    
        return false;
    });
    
    tray = new Tray('assets/app-icon/png/32.png');
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show', type: 'normal', click:  function(){
            mainWindow.show();
        }},
        { type: 'separator' },
        { label: 'Exit', click:  function(){
            app.isQuiting = true;
            app.quit();
        } }
    ]);
    tray.setToolTip('Lisync');
    tray.setContextMenu(contextMenu);
}

app.on('ready', createWindow);

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});