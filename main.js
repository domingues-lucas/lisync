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
    // mainWindow.webContents.openDevTools();
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

let template = [{
    label: 'File',
    submenu: [{
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
            app.quit();
        }
    }],
    }, {
    label: 'View',
    submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(win => {
                        if (win.id > 1) win.close();
                    })
                }
                    focusedWindow.reload()
            }
        }}, {   label: 'Toggle Full Screen',
                accelerator: (() => {
                    if (process.platform === 'darwin') {
                        return 'Ctrl+Command+F'
                    } else {
                        return 'F11'
                    }
                })(),
                click: (item, focusedWindow) => {
                    if (focusedWindow) {
                        focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
            }]
    }, { label: 'Window',
        role: 'window',
        submenu: [{
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        }, {
            type: 'separator'
        }, {
            label: 'Reopen Window',
            accelerator: 'CmdOrCtrl+Shift+T',
            enabled: false,
            key: 'reopenMenuItem',
            click: () => {
            app.emit('activate');
            }
        }]
    },
    {   label: 'Help',
        role: 'help',
        submenu: [{
            label: 'Github Project',
            click: () => {
                shell.openExternal('https://github.com/afonso-piroca/lrgdrive');
            }
        }]
}]

function addUpdateMenuItems (items, position) {
    if (process.mas) return

    const version = app.getVersion()
    let updateItems = [{
        label: `Version ${version}`,
        enabled: false
    }, {
        label: 'Checking for Update',
        enabled: false,
        key: 'checkingForUpdate'
    }, {
        label: 'Check for Update',
        visible: false,
        key: 'checkForUpdate',
        click: () => {
        require('electron').autoUpdater.checkForUpdates()
        }
    }, {
        label: 'Restart and Install Update',
        enabled: true,
        visible: false,
        key: 'restartToUpdate',
        click: () => {
        require('electron').autoUpdater.quitAndInstall()
        }
    }]

    items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem () {
    const menu = Menu.getApplicationMenu()
    if (!menu) return

    let reopenMenuItem
    menu.items.forEach(item => {
        if (item.submenu) {
        item.submenu.items.forEach(item => {
            if (item.key === 'reopenMenuItem') {
            reopenMenuItem = item
            }
        })
        }
    })
    return reopenMenuItem
    }

    if (process.platform === 'darwin') {
    const name = app.getName()
    template.unshift({
        label: name,
        submenu: [{
        label: `About ${name}`,
        role: 'about'
        }, {
        type: 'separator'
        }, {
        label: 'Services',
        role: 'services',
        submenu: []
        }, {
        type: 'separator'
        }, {
        label: `Hide ${name}`,
        accelerator: 'Command+H',
        role: 'hide'
        }, {
        label: 'Hide Others',
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
        }, {
        label: 'Show All',
        role: 'unhide'
        }, {
        type: 'separator'
        }, {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: () => {
            app.quit()
        }
        }]
    })

    template[3].submenu.push({
        type: 'separator'
    }, {
        label: 'Bring All to Front',
        role: 'front'
    })

    addUpdateMenuItems(template[0].submenu, 1)
}

if (process.platform === 'win32') {
    const helpMenu = template[template.length - 1].submenu
    addUpdateMenuItems(helpMenu, 0)
}

app.on('ready', () => {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
})

app.on('browser-window-created', () => {
    let reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = false
})

app.on('window-all-closed', () => {
    let reopenMenuItem = findReopenMenuItem()
    if (reopenMenuItem) reopenMenuItem.enabled = true
})
