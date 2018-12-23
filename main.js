// Modules to control application life and create native browser window
const {BrowserWindow, Menu, app, shell, dialog} = require('electron')
const os = require('os')
var path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  	// Create the browser window.
	mainWindow = new BrowserWindow({
		// frame: false,
		width: 1366,
		height: 800,
		minWidth: 1281,
		minHeight: 800,
		icon: path.join(__dirname, 'assets/app-icon/png/64.png')
    });

    // mainWindow.setMenuBarVisibility(false);
    // mainWindow.setAutoHideMenuBar(true);

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let template = [{
    label: 'File',
	submenu: [{
		label: 'Exit',
		accelerator: 'CmdOrCtrl+Q',
		click: () => {
            app.quit()
        }
	}],
    }, {
	label: 'View',
	submenu: [{
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                // on reload, start fresh and close any old
                // open secondary windows
                if (focusedWindow.id === 1) {
                    BrowserWindow.getAllWindows().forEach(win => {
                        if (win.id > 1) win.close()
                    })
                }
                    focusedWindow.reload()
            }
        }
        }, {   
        label: 'Toggle Full Screen',
        accelerator: (() => {
        if (process.platform === 'darwin') {
            return 'Ctrl+Command+F'
        } else {
            return 'F11'
        }
        })(),
        click: (item, focusedWindow) => {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }]
    }, {
	label: 'Window',
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
		app.emit('activate')
		}
	}]
	}, {
	label: 'Help',
	role: 'help',
	submenu: [{
		label: 'Github Project',
		click: () => {
		    shell.openExternal('https://github.com/afonso-piroca/lrgdrive')
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

    // Window menu.
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
