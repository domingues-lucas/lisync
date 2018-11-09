'use strict';

const cmd=require('node-cmd');
const materialize=require('materialize-css');
const moment = require('moment');
const shell = require('electron');
const os = require('os');
const fs = require('fs');
const settings = require('electron-settings');
const links = document.querySelectorAll('link[rel="import"]');
const rclone = process.platform === 'darwin' ? 'rclone/mac/rclone' : process.platform === 'win32' ? 'rclone/win/rclone' : 'rclone/linux/rclone';
const $ = require('jquery');

// Import and add each page to the DOM
Array.prototype.forEach.call(links, (link) => {
    let template = link.import.querySelector('.task-template'),
        clone = document.importNode(template.content, true);
    if (link.href.match('welcome.html')) {
        document.querySelector('body').appendChild(clone);
    } else {
        document.querySelector('.content').appendChild(clone);
    }
});

document.body.addEventListener('click', (event) => {
  if (event.target.dataset.section) {
    handleSectionTrigger(event);
  } else if (event.target.dataset.modal) {
    handleModalTrigger(event);
  } else if (event.target.classList.contains('modal-hide')) {
    hideAllModals();
  }
});

function handleSectionTrigger (event) {

  hideAllSectionsAndDeselectButtons()

	// Open/refresh remote or Local folders
	const section = event.target.dataset.section;
	if (section === 'drive') {
		openFolder('/');
    } 
    else if (section == 'folders-sync') {
        updateListSyncs();
    }
    else if (section == 'live-sync') {
        checkSync();
    }

	// Highlight clicked button and show view
	event.target.classList.add('is-selected');

	// Display the current section
	const sectionId = `${event.target.dataset.section}-section`;

    document.getElementById(sectionId).classList.add('is-shown');

	// Save currently active button in localStorage
	const buttonId = event.target.getAttribute('id');
	settings.set('activeSectionButtonId', buttonId);

}

function activateDefaultSection () {
  document.getElementById('button-drive').click();
}

function showMainContent () {
  document.querySelector('.js-nav').classList.add('is-shown');
  document.querySelector('.js-content').classList.add('is-shown');
}

function handleModalTrigger (event) {
  hideAllModals();
  const modalId = `${event.target.dataset.modal}-modal`;
  document.getElementById(modalId).classList.add('is-shown');
}

function hideAllModals () {
  const modals = document.querySelectorAll('.modal.is-shown')
  Array.prototype.forEach.call(modals, (modal) => {
    modal.classList.remove('is-shown');
  });
  showMainContent();
}

function hideAllSectionsAndDeselectButtons () {
  const sections = document.querySelectorAll('.js-section.is-shown')
  Array.prototype.forEach.call(sections, (section) => {
    section.classList.remove('is-shown');
  });

  const buttons = document.querySelectorAll('.nav-button.is-selected')
  Array.prototype.forEach.call(buttons, (button) => {
    button.classList.remove('is-selected');
  });
}

// Default to the view that was active the last time the app was open
const sectionId = settings.get('activeSectionButtonId');

if (sectionId) {
  showMainContent();
  const section = document.getElementById(sectionId);
  if (section) section.click();
} else {
  activateDefaultSection();
}

const fileExtensions = {
    'ai': 'ai.svg',
    'avi': 'avi.svg',
    'css': 'css.svg',
    'csv': 'csv.svg',
    'dbf': 'dbf.svg',
    'doc': 'doc.svg',
    'docx': 'doc.svg',
    'dwg': 'dwg.svg',
    'exe': 'exe.svg',
    'fla': 'fla.svg',
    'html': 'html.svg',
    'htm': 'html.svg',
    'iso': 'iso.svg',
    'jpg': 'jpg.svg',
    'jpeg': 'jpg.svg',
    'js': 'js.svg',
    'json': 'json.svg',
    'mp3': 'mp3.svg',
    'mp4': 'mp4.svg',
    'pdf': 'pdf.svg',
    'png': 'png.svg',
    'ppt': 'ppt.svg',
    'pptx': 'ppt.svg',
    'pst': 'pst.svg',
    'rtf': 'rtf.svg',
    'svg': 'svg.svg',
    'txt': 'txt.svg',
    'xls': 'xls.svg',
    'xlsx': 'xls.svg',
    'xml': 'xml.svg',
    'zip': 'zip.svg'
};

Element.prototype.is = function(elementSelector) {
    switch(elementSelector[0]) {
        case ".":
            var er = new RegExp(elementSelector.replace(".", ""));
            return this.className.match(er);
            break;
        case "#":
            return this.getAttribute("id") === elementSelector.replace("#", "");
            break;
        default:
            return this.tagName === elementSelector.toUpperCase();
            break;
    };
};

let listEvents = [];
Element.prototype.delegate = function(elementSelector, callback) {
    listEvents.push({
        elementSelector: elementSelector,
        callback: callback
    });
};

document.querySelector('body').addEventListener('click', function (evt) {
    evt.preventDefault();
    listEvents.forEach(function(e) {
        let elem = evt.target;
        while (elem.tagName != 'BODY') {
            if (elem.is(e.elementSelector)) {
                e.callback.call(elem, elem);
            }
            elem = elem.parentNode;
        };
    });
});

document.querySelector('#authorization').addEventListener('click', function() {
    let data_line = '';
    cmd.get(rclone + ' config create gdrive drive').stdout.on(
        'data',
        function(data) {
            data_line += data;
            if (data_line[data_line.length-1] == '\n') {
                console.log(data_line);
                // document.querySelector('#authorization-status').innerHTML += data_line;
            };
        }
    );
});

document.querySelector('#authorization-status .open-browser').addEventListener('click', function(event) {
    event.preventDefault();
    let link = event.target.href;
    require("electron").shell.openExternal(link);
});

function loading(option) {
    let _progress = document.querySelector('.progress');
    option ? _progress.classList.add('show') : _progress.classList.remove('show');
};

let modifiedFiles;

// Check modified files
function checkSync() {
    loading(true);
    cmd.get(
        rclone + ' check  --one-way "/home/ninguem/Documentos/rclone" gdrive:/"rclone"',
        function(err, data, stderr){
            let _modifiedFiles = stderr.split('\n').filter( ( elem, index, arr ) => elem.indexOf( 'ERROR' ) !== -1 ),
                _divContent = document.querySelector('#live-sync-section .active-syncs'); 

            modifiedFiles = _modifiedFiles.map( elem => elem.split(':')[3].trim() );
            _divContent.innerHTML = '';

            modifiedFiles.forEach( function(e) {
                let _extension = e.split('.')[1],
                    _icon = fileExtensions[_extension] ? fileExtensions[_extension] : 'file.svg',
                    _stats = getFileStats('/home/ninguem/Documentos/rclone', e);

                _divContent.innerHTML += `
                    <li>
                        <img class="icon left" src="./assets/icons/${_icon}"> 
                        <h2 class="name truncate left">${e}</h2>
                        <label class="modified truncate left">${moment(_stats.modified).format('YYYY-MM-DD hh:mm:ss')}</label>
                        <label class="size truncate left">${_stats.size.bytesFormat()}</label>
                        <div class="status right"><i class="material-icons left rotation">sync</i></div>
                    </li>
                `;

            });
            loading(false);
        }
    );
}

function liveSync(){
    cmd.get(
        rclone + ' check  --one-way "/home/ninguem/Documentos/rclone" gdrive:/"rclone"',
        function(err, data, stderr){
            let _modifiedFiles = stderr.split('\n').filter( ( elem, index, arr ) => elem.indexOf( 'ERROR' ) !== -1 ),
                _divContent = document.querySelector('#live-sync-section .active-syncs'),
                _item = _divContent.querySelectorAll('li'),
                _items_add = 0;

            _modifiedFiles = _modifiedFiles.map( elem => elem.split(':')[3].trim() );

            _modifiedFiles.forEach( function(e) {
                if ( modifiedFiles.indexOf(e) === -1) {
                    let _extension = e.split('.')[1],
                        _icon = fileExtensions[_extension] ? fileExtensions[_extension] : 'file.svg',
                        _stats = getFileStats('/home/ninguem/Documentos/rclone', e);

                    _divContent.insertAdjacentHTML('afterbegin', `
                        <li class="remove">
                            <img class="icon left" src="./assets/icons/${_icon}"> 
                            <h2 class="name truncate left">${e}</h2>
                            <label class="modified truncate left">${moment(_stats.modified).format('YYYY-MM-DD hh:mm:ss')}</label>
                            <label class="size truncate left">${_stats.size.bytesFormat()}</label>
                            <div class="status right"><i class="material-icons left rotation">sync</i></div>
                        </li>
                    `);
                    _divContent.querySelectorAll('li')[0].classList.remove('remove');
                    _items_add++;
                }
            });

            _divContent = document.querySelector('#live-sync-section .active-syncs');
            _item = _divContent.querySelectorAll('li');

            modifiedFiles.forEach( function(e, i) {
                if ( _modifiedFiles.indexOf(e) === -1) {
                    _item[i + _items_add].classList.add('remove');
                }
            });

            modifiedFiles = _modifiedFiles;

        }
    );
}

Number.prototype.bytesFormat = function() {
    let value;
    if ( this === 0 ) {
        value = '-'
    } else if ( this < 1000) {
        value = this + ' B'
    } else if ( this < 1000000 ) {
        value = (this/1000).toFixed(1) + ' K'
    } else if ( this < 1000000000 ) {
        value = (this/1000000).toFixed(1) + ' M'
    } else {
        value = (this/1000000000).toFixed(1) + ' G'
    }
    return value;
};

document.querySelector('#check-sync').addEventListener('click', function(event) {
    liveSync();
});

function getFileStats(path, fileName) {
    let _stats = fs.statSync(path + '/' + fileName),
        _details = {
            'size': _stats.size,
            'modified': _stats.mtime
        };
    return _details;
}

// Open remote folder
function openFolder(path) {
    loading(true);
    cmd.get(
        rclone + ' lsjson --fast-list gdrive:/' + path,
        function(err, data, stderr){

            if ( path !== '/' ) {
                document.querySelector('#remote').innerHTML = `
                    <li>
                        <div class="name">
                            <a class="open-folder" attr-path="${path}">
                                <img class="icon" src="./assets/icons/folder.svg">
                                <span class="item-name">..</span>
                            </a>
                        </div>
                    </li>
                `;
            }

            JSON.parse(data).forEach(e => {

                e.Size = e.Size === -1 ? '0' : e.Size;
                e.ModTime = moment(e.ModTime).format('YYYY-MM-DD hh:mm:ss');
                e.Extension = e.Name.split('.').slice(-1)[0];

                e.IsDir ? ( e.Icon = 'folder.svg', e.Tag = 'a class="open-folder"' ) : ( e.Tag = 'div', fileExtensions[e.Extension] ? e.Icon = fileExtensions[e.Extension] : e.Icon = 'file.svg' );

                document.querySelector('#remote').innerHTML += `
                    <li class="item-select remote">
                        <div class="name truncate">  
                            <${e.Tag} attr-path="${path}">
                                <img class="icon" src="./assets/icons/${e.Icon}">
                                <span class="item-name">${e.Name}</span>
                            </${e.Tag}>
                        </div>
                        <div class="modified">${e.ModTime}</div>
                        <div class="size truncate">${parseFloat(e.Size).bytesFormat()}</div>
                    </li>
                `;

            });
            loading(false);
        }
    );
}

document.querySelector('#button-select-folders').addEventListener('click', function(event) {
    openLocalFolder('/');
    openRemoteFolder('/');
});

// Open local folder
function openLocalFolder(path) {
    cmd.get(
        'cd ' + path + ' && ls -d */',
        function(err, data, stderr){

            if ( path !== '/' ) {
                document.querySelector('.local.list-files .directory').innerHTML = `
                    <li>
                        <div class="name">
                            <a class="open-local-folder" attr-path="${path}">
                                <img class="icon" src="./assets/icons/folder.svg">
                                <span class="item-name">..</span>
                            </a>
                        </div>
                    </li>
                `;
            };

            data.split('\n').forEach(e => {
                if ( e !== ''){
                    document.querySelector('.local.list-files .directory').innerHTML += `
                        <li class="item-select local unique">
                            <div class="name truncate">
                                <a class="open-local-folder" attr-path="${path}">
                                    <img class="icon" src="./assets/icons/folder.svg">
                                    <span class="item-name">${e.slice(0, -1)}</span>
                                </a>
                            </div>
                        </li>
                    `;
                };
            });
        }
    );
}

// Open remote folder
function openRemoteFolder (path) {
    loading(true);
    cmd.get(
        rclone + ' lsjson --fast-list gdrive:/' + path,
        function(err, data, stderr){
            let backDir = path;
                backDir = backDir.split('/').pop();

            document.querySelector('.remote.list-files .directory').innerHTML = `
                <li>
                    <div class="name">
                        <a class="open-remote-folder" attr-path="${backDir}">
                            <img class="icon" src="./assets/icons/folder.svg">
                            <span class="item-name">..</span>
                        </a>
                    </div>
                </li>
            `;

            JSON.parse(data).forEach(e => {
                if ( e.IsDir ){
                    document.querySelector('.remote.list-files .directory').innerHTML += `
                        <li class="item-select remote unique">
                            <div class="name truncate">
                                <a class="open-remote-folder" attr-path="${path}">
                                    <img class="icon" src="./assets/icons/folder.svg">
                                    <span class="item-name">${e.Name}</span>
                                </a>
                            </div>
                        </li>
                    `;
                }
            });
            loading(false);
        }
    );
}

document.querySelector('body').delegate('.open-folder', function(e){
    openFolder(e.getAttribute('attr-path') + '/' + e.querySelector('.item-name').innerText);
});

document.querySelector('body').delegate('.open-local-folder', function(e){
    let path = e.getAttribute('attr-path'),
        directory = e.querySelector('.item-name').innerText;

    if ( directory === '..' ) {
        directory = path.split('/').slice(0, -1).join('/');
    } else {
        directory = path + '/' + directory;
    }

    openLocalFolder(directory);
});

document.querySelector('body').delegate('.open-remote-folder', function(e){
    openRemoteFolder(e.getAttribute('attr-path') + '/' + e.querySelector('.item-name').innerText);
});

document.querySelector('body').delegate('.item-select', function(e){

    if ( !event.target.classList.contains('icon') && !event.target.classList.contains('item-name') ) {

        if (!event.ctrlKey || e.classList.contains('unique')) {
            let _origin = e.classList.contains('local') ? '.local' : '.remote';
            document.querySelectorAll('.item-select' + _origin).forEach(e => {
                e.classList.remove('selected');
            });
        }
        e.classList.toggle('selected');

        if ( e.querySelector(".local .item-name") ) {
            document.querySelector('.selected-folders .local').innerHTML = `
                <div class="infos">
                    <h2 class="truncate">${e.querySelector(".local .item-name").innerText}</h2>
                    <label class="truncate">${e.querySelector('.open-local-folder').getAttribute('attr-path') + '/' + e.querySelector(".local .item-name").innerText}</label>
                </div>
                <div class="direction">
                    <i class="material-icons">chevron_right</i>
                </div>`;
        }

        if ( e.querySelector(".remote .item-name") ) {
            document.querySelector('.selected-folders .remote').innerHTML = `
                <div class="infos">
                    <h2 class="truncate">${e.querySelector(".remote .item-name").innerText}</h2>
                    <label class="truncate">${e.querySelector('.open-remote-folder').getAttribute('attr-path') + '/' + e.querySelector(".remote .item-name").innerText}</label>
                </div>`;

        }

        let _local = document.querySelector('.selected-folders .local .infos label'),
            _remote = document.querySelector('.selected-folders .remote .infos label')

        if ( _local && _remote ) {
            let _finish = document.querySelector('#folders-sync-finish');
            _finish.disabled ? _finish.disabled = false : null;
        }

    }

});

!localStorage['folders-sync'] ? localStorage['folders-sync'] = '' : null;

function addFolderSync(sync) {
    let _current =  localStorage['folders-sync'] !== '' ? JSON.parse(localStorage['folders-sync']) : [];
    _current.push(sync);
    localStorage['folders-sync'] = JSON.stringify(_current);
    updateListSyncs();
}

document.querySelector('#folders-sync-finish').addEventListener('click', function() {
    let _local = document.querySelector('.selected-folders .local .infos label'),
        _remote = document.querySelector('.selected-folders .remote .infos label')
    addFolderSync('["' + _local.innerText + '", "' + _remote.innerText + '"]');
    document.querySelector('[data-section="folders-sync"]').click();
});

function updateListSyncs() {

    if ( localStorage['folders-sync'] !== '' ) {

        document.querySelector('#list-syncs').innerHTML = '';

        let _item = '';

        JSON.parse(localStorage['folders-sync']).forEach( function(e) {
            _item = JSON.parse(e);
            document.querySelector('#list-syncs').innerHTML += `
                <li>
                    <div class="local">
                        <span class="icon"><img src="./assets/icons/folder.svg"></span>
                        <div class="infos">
                            <h2 class="truncate">${_item[0].split('/').pop()}</h2>
                            <label class="truncate">${_item[0]}</label>
                        </div>
                    </div>
                    <div class="direction">
                        <i class="material-icons">chevron_right</i>
                    </div>
                    <div class="remote">
                        <span class="icon"><img src="./assets/icons/folder.svg"></span>
                        <div class="infos">
                            <h2 class="truncate">${_item[1].split('/').pop()}</h2>
                            <label class="truncate">${_item[1]}</label>
                        </div>
                    </div>
                    <div class="actions">
                        <a href="#!">
                            <i class="material-icons">play_circle_outline</i>
                        </a>
                        <a href="#!">
                            <i class="material-icons">delete_outline</i>
                        </a>
                    </div>
                </li>
            `
        });

    }
    else {
        document.querySelector('#list-syncs').innerHTML = '<li>Nenhuma pasta e sincronia</li>';
    }
}

document.querySelector('body').delegate('.ajax-load', function(e){
    fetch(e.target.href)
    .then(response => response.text()) // retorna uma promise
    .then(result => {
        page.source = e.target.href;
        document.querySelector('#ajax-load').innerHTML = result;
        beforePageLoad(page.source.split('/')[page.source.split('/').length - 1]);
    })
    .catch(err => {
        // trata se alguma das promises falhar
        console.error('Failed retrieving information', err);
    });
});


// processRef.stdout.on(
//     'data',
//     function(data) {
//         console.log(data)
//         // listFiles = JSON.parse(data[0]);
//         // console.log(listFiles)
//         // document.querySelector('#remote').innerHTML += '<li>' + listFiles + '</li>';
//     }
// );

document.addEventListener('DOMContentLoaded', function() {
    let elems = document.querySelectorAll('.modal');
    let instances = M.Modal.init(elems);
});