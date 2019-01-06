'use strict';

/* ------------------------------------*/
/*** IMPORTS
/* ------------------------------------*/

const i18next = require('i18next');
const cmd = require('node-cmd');
const materialize = require('materialize-css');
const moment = require('moment');
const shell = require('electron');
const {BrowserWindow} = shell.remote;
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

    if ( link.dataset.window === 'modal' ) {
        document.querySelector('body').appendChild(clone);
    } else {
        document.querySelector('.content').appendChild(clone);
    }
});


/* ------------------------------------*/
/*** GENERAL FUNCTIONS
/* ------------------------------------*/

function EasyLocalStorage(key) {

    this.get = function(format) {
        if ( format === 'parse' ) {
            return JSON.parse(localStorage[key]);
        } else {
            return localStorage[key];
        }
    };

    this.set = function(format, value) {
        if ( format === 'parse' ) {
            localStorage[key] =  JSON.stringify(value);
        } else {
            localStorage[key] = value;
        }
    };

}

function handleSectionTrigger (e) {

    hideAllSectionsAndDeselectButtons();

    const section = e.attr('data-section');

    if (section === 'drive') {
        openFolder('/');

    } else if (section === 'folders-sync') {
        updateListSyncs();

    } else if (section === 'live-sync') {
        checkSync('first');

    } else if (section === 'select-folders') {
        openLocalFolder('/');
        openRemoteFolder('/');
    }

    e.addClass('is-selected');
    $(`#${section}-section`).addClass('is-shown');
    settings.set('activeSectionButtonId', e.attr('id'));

}

function handleModalTrigger (e) {
    hideAllModals();
    $(`#${e.attr('data-modal')}-modal`).addClass('is-shown');
}

function activateDefaultSection () {
    $('#button-drive').click();
}

function showMainContent () {
    $('.js-nav').addClass('is-shown');
    $('.js-content').addClass('is-shown');
}

function hideAllModals () {
    $('.modal.is-shown').removeClass('is-shown');
    showMainContent();
}

function hideAllSectionsAndDeselectButtons () {
  $('.js-section.is-shown').removeClass('is-shown');
  $('.nav-button.is-selected').removeClass('is-selected');
}

function loading(option) {
    let _progress = document.querySelector('.progress');
    option ? _progress.classList.add('show') : _progress.classList.remove('show');
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

String.prototype.lastElement = function(_split) {
    let _array = this.split(_split);
    return _array.pop();
}

function getFileStats(file) {
    let _stats = fs.statSync(file),
        _details = {
            'size': _stats.size,
            'modified': _stats.mtime
        };
    return _details;
}

function getIcon(_extension) {
    return fileExtensions[_extension] ? fileExtensions[_extension] : 'file.svg'
}

/* ------------------------------------*/
/*** GENERAL VARIABLES
/* ------------------------------------*/

const localStorageFileSync = new EasyLocalStorage('folders-sync');
const sectionId = settings.get('activeSectionButtonId');
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


/* ------------------------------------*/
/*** GENERAL EVENTS
/* ------------------------------------*/

$('body').on('click', '.open-content', function() {

    if ( $(this).attr('data-section') ) {
        handleSectionTrigger($(this));

    } else if ( $(this).attr('data-modal') ) {
        handleModalTrigger($(this));

    } else if ( $(this).hasClass('modal-hide') ) {
        hideAllModals();
    }

});

/* ------------------------------------*/
/*** INIT FUNCTIONS
/* ------------------------------------*/

if (sectionId) {
    showMainContent();
    const section = $(`#${sectionId}`);
    if (section) section.click();
} else {
    activateDefaultSection();
}


/* ------------------------------------*/
/*** PAGE AUTHORIZATION
/* ------------------------------------*/

$('.authorization').on('click', function() {
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

$('.authorization-status .open-browser').on('click', function(event) {
    event.preventDefault();
    let link = event.target.href;
    require("electron").shell.openExternal(link);
});


/* ------------------------------------*/
/*** PAGE LIVE SYNC
/* ------------------------------------*/

let modifiedFiles = [],
    liveSyncInProgress = false;

function checkSync(step) {

    loading(true);

    let foldersSync = localStorageFileSync.get('parse'),
        divContent = $('#live-sync-section .active-syncs'),
        totalSyncs = foldersSync.length;

    if ( step === 'first' ) {

        divContent.html('');

        $.each(foldersSync, function( i, folderSync ) {

            if ( folderSync.status ) {

                cmd.get(`${rclone} check  --one-way "${folderSync.local}" "gdrive:${folderSync.remote}"`, function(err, data, stderr){

                    let _modifiedFiles = stderr.split('\n').filter( ( elem, index, arr ) => elem.indexOf( 'ERROR' ) !== -1 );

                    modifiedFiles[i] = _modifiedFiles.map( elem => folderSync.local + '/' + elem.split(':')[3].trim() );

                    modifiedFiles[i].forEach( function(e) {
                        let extension = e.lastElement('.'),
                            icon = getIcon(extension),
                            stats = getFileStats(e),
                            name = e.lastElement('/');

                        divContent.append(syncRowHTML('active', folderSync.local, icon, name, stats.modified, stats.size));

                    });

                    if ( totalSyncs === i + 1 ) {

                        if ( _modifiedFiles.length === 0 ) {
                            divContent.prepend(`<li class="not-found"><p>${i18next.store.data[i18next.language].translation['not-upload']}</p></li>`);
                        }

                        checkSync();
                    }

                });

            }
        });

    } else {

        loading(true);

        $.each(foldersSync, function( i, folderSync ) {

            if ( folderSync.status ) {

                cmd.get(`${rclone} check  --one-way "${folderSync.local}" "gdrive:${folderSync.remote}"`, function(err, data, stderr){

                    let _modifiedFiles = stderr.split('\n').filter( ( elem, index, arr ) => elem.indexOf( 'ERROR' ) !== -1 ),
                        item = divContent.find('li'),
                        items_add = 0;

                    _modifiedFiles = _modifiedFiles.map( elem => folderSync.local + '/' + elem.split(':')[3].trim() );

                    _modifiedFiles.forEach( function(e) {

                        if ( modifiedFiles[i].indexOf(e) === -1) {

                            let extension = e.lastElement('.'),
                                icon = getIcon(extension),
                                stats = getFileStats(folderSync.local, e),
                                name = e.lastElement('/');

                            divContent.prepend(syncRowHTML('remove', folderSync.local, icon, name, stats.modified, stats.size));
                            divContent.find('li').eq(0).removeClass('remove');
                            items_add++;
                        }
                    });

                    divContent = $('#live-sync-section .active-syncs');
                    item = divContent.find('li');
                    let modify_icon = '';

                    modifiedFiles[i].forEach( function(e, i) {
                        if ( _modifiedFiles.indexOf(e) === -1) {
                            modify_icon = item[i + items_add].find('.status .material-icons');
                            modify_icon.removeClass('blink');
                            modify_icon.addClass('done');
                            modify_icon.text('cloud_done');
                        }
                    });

                    modifiedFiles[i] = _modifiedFiles;

                    totalSyncs === i + 1 ? loading(false) : null;

                });

            }

        });

    }

}

function syncRowHTML(_class, directory, icon, name, date, size) {

    $('.live-sync .not-found').addClass('hide');

    return `
        <li class="${_class}">
            <div class="name truncate">
                <img class="icon" src="./assets/icons/${icon}">
                <span class="item-name">
                    ${name}
                    <span class="directory">${directory}</span>
                </span>
            </div>
            <div class="modified">${moment(date).format('YYYY-MM-DD hh:mm:ss')}</div>
            <div class="size truncate">${size.bytesFormat()}</div>
            <div class="status"><i class="material-icons blink">cloud_upload</i></div>
        </li>
    `;
}

function liveSync(){

    checkSync();

    if ( !liveSyncInProgress ) {

        console.log('LiveSync START');
        liveSyncInProgress = true;

        let foldersSync = localStorageFileSync.get('parse'),
            totalSyncs = foldersSync.length;

        $.each(foldersSync, function( i, folderSync ) {

            if ( folderSync.status ) {

                let processRef = cmd.get(`${rclone} sync --progress "${folderSync.local}" "gdrive:${folderSync.remote}"`, function(){
                    if ( totalSyncs === i + 1 ) {
                        liveSyncInProgress = false;
                        checkSync();
                        console.log("LiveSync END");
                    }
                });

                processRef.stdout.on(
                    'data',
                    function(data) {
                        console.log(data)
                    }
                );

            }
        });
    }
}

$('#check-sync').on('click', function() {
    liveSync();
});

$('body').on('click', '.open-folder', function(){
    let path = $(this).attr('attr-path'),
        directory = $(this).find('.item-name').text();

    if ( directory === '..' ) {
        directory = path.split('/').slice(0, -1).join('/');
    } else {
        directory = path + '/' + directory;
    }

    openFolder(directory);
});

/* ------------------------------------*/
/*** PAGE DRIVE
/* ------------------------------------*/

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
                    <li class="remote">
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


/* ------------------------------------*/
/*** PAGE SELECT FOLDERS
/* ------------------------------------*/

function openLocalFolder(path) {

    cmd.get(
        'cd ' + path + ' && ls -d */',
        function(err, data, stderr){

            $('.local.list-files .directory').html('');

            if ( path !== '/' ) {
                $('.local.list-files .directory').html(`
                    <li>
                        <div class="name">
                            <a class="open-local-folder" attr-path="${path}">
                                <img class="icon" src="./assets/icons/folder.svg">
                                <span class="item-name">..</span>
                            </a>
                        </div>
                    </li>
                `);
            };

            data.split('\n').forEach(e => {
                if ( e !== ''){
                    $('.local.list-files .directory').append(`
                        <li class="item-select local unique">
                            <div class="name truncate">
                                <a class="open-local-folder" attr-path="${path}">
                                    <img class="icon" src="./assets/icons/folder.svg">
                                    <span class="item-name">${e.slice(0, -1)}</span>
                                </a>
                            </div>
                        </li>
                    `);
                };
            });
        }
    );
}

function openRemoteFolder (path) {

    loading(true);
    cmd.get(
        rclone + ' lsjson --fast-list gdrive:/' + path,
        function(err, data, stderr){

            if ( path !== '/' ) {
                document.querySelector('.remote.list-files .directory').innerHTML = `
                    <li>
                        <div class="name">
                            <a class="open-remote-folder" attr-path="${path}">
                                <img class="icon" src="./assets/icons/folder.svg">
                                <span class="item-name">..</span>
                            </a>
                        </div>
                    </li>
                `;
            }

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

function selectedFolder(e) {
    if ( e.hasClass('local') ) {
        $('.selected-folders .local').html(`
            <div class="infos">
                <i class="material-icons icon left">computer</i>
                <h2 class="truncate">${e.find(".item-name").text()}</h2>
                <label class="truncate">${e.find('.open-local-folder').attr('attr-path') + '/' + e.find(".item-name").text()}</label>
            </div>
            <div class="direction">
                <i class="material-icons">chevron_right</i>
            </div>
        `);
    }

    if ( e.hasClass('remote') ) {
        $('.selected-folders .remote').html(`
            <div class="infos">
                <i class="material-icons icon left">cloud_upload</i>
                <h2 class="truncate">${e.find(".item-name").text()}</h2>
                <label class="truncate">${e.find('.open-remote-folder').attr('attr-path') + '/' + e.find(".item-name").text()}</label>
            </div>
        `);
    }

    let _local = $('.selected-folders .local .infos'),
    _remote = $('.selected-folders .remote .infos');

    if ( _local.length > 0 && _remote.length > 0 ) {
        let _finish = $('#folders-sync-finish');
        _finish.prop('disabled', false);
    }

}

function addFolderSync(sync) {
    let _current = localStorageFileSync.get() !== '' ? localStorageFileSync.get('parse') : [];
    _current.push(sync);
    localStorageFileSync.set('parse', _current);
    updateListSyncs();
}

!localStorageFileSync.get() ? localStorageFileSync.set(null, '') : null;

$('body').on('click', '.open-local-folder', function(){
    let path = $(this).attr('attr-path'),
        directory = $(this).find('.item-name').text();

    if ( directory === '..' ) {
        directory = path.split('/').slice(0, -1).join('/');
    } else {
        directory = path + '/' + directory;
    }

    openLocalFolder(directory);
});

$('body').on('click', '.open-remote-folder', function(){

    let path = $(this).attr('attr-path'),
    directory = $(this).find('.item-name').text();


    if ( directory === '..' ) {
        directory = path.split('/').slice(0, -1).join('/');
    } else {
        directory = path + '/' + directory;
    }

    openRemoteFolder(directory);
});


$('body').on('click', '.item-select', function(){

    if ( !event.target.classList.contains('icon') && !event.target.classList.contains('item-name') ) {

        if (!event.ctrlKey || $(this).hasClass('unique')) {
            let _origin = $(this).hasClass('local') ? '.local' : '.remote';
            $('.item-select' + _origin).removeClass('selected');
        }
        $(this).toggleClass('selected');
    }

    selectedFolder($(this));

});

$('#folders-sync-finish').on('click', function() {
    let _local = $('.selected-folders .local .infos label'),
        _remote = $('.selected-folders .remote .infos label');
    addFolderSync({ "local": _local.text(), "remote": _remote.text(), "status": true });
    $('[data-section="folders-sync"]').click();
});



/* ------------------------------------*/
/*** PAGE FOLDERS SYNC
/* ------------------------------------*/

function updateListSyncs() {

    if ( localStorageFileSync.get() !== '' ) {

        $('#list-syncs ul').html('');

        localStorageFileSync.get('parse').forEach( function(e, i) {

            $('#list-syncs ul').append(`
                <li>
                    <div class="row">
                        <div class="col s12">
                            <div class="local truncate">
                                <i class="material-icons icon left">computer</i>
                                <span class="item-name">
                                    ${e['local'].split('/').pop()}
                                    <span class="directory">${e['local']}</span>
                                </span>
                            </div>
                            <div class="remote truncate">
                                <i class="material-icons icon left">cloud_upload</i>
                                <span class="item-name">
                                    ${e['remote'].split('/').pop()}
                                    <span class="directory">${e['remote']}</span>
                                </span>
                            </div>
                            <div class="actions">
                                <a href="#!" class="play-or-pause playing" data-item=${i}>
                                    <span class="play">
                                        <i class="material-icons">play_circle_outline</i>
                                    </span>
                                    <span class="pause">
                                        <i class="material-icons">pause_circle_outline</i>
                                    </span>
                                </a>
                                <a href="#!" class="delete" data-item=${i}>
                                    <i class="material-icons">delete_outline</i>
                                </a>
                            </div>
                        </div>
                    </div>
                </li>
            `);
        });

    }
    else {
        $('#list-syncs').html('<li>Nenhuma pasta e sincronia</li>');
    }
}

function updateStatusSync(item, status) {
    let syncs = localStorageFileSync.get('parse');
    syncs[item].status = status;
    localStorageFileSync.set('parse', syncs);
}

function deleteSync(item) {
    let syncs = localStorageFileSync.get('parse');
    syncs.splice(item, 1);
    localStorageFileSync.set('parse', syncs);
}

function pauseSync(item) {
    updateStatusSync(item, false);
}

function playSync(item) {
    updateStatusSync(item, true);
}

$('#button-select-folders').on('click', function() {
    openLocalFolder('/');
    openRemoteFolder('/');
});

$('#list-syncs').on('click', '.play-or-pause', function() {
    $(this).toggleClass('playing');
});

$('#list-syncs').on('click', '.play-or-pause .play', function() {
    let item = $(this).parent().attr('data-item');
    playSync(item);
});

$('#list-syncs').on('click', '.play-or-pause .pause', function() {
    let item = $(this).parent().attr('data-item');
    pauseSync(item);
});

$('#list-syncs').on('click', '.delete', function() {
    let item = $(this).attr('data-item');
    deleteSync(item);
    $(this).parents('li').addClass('deleted');
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

/* ------------------------------------*/
/*** INIT MODALS  */
/* ------------------------------------*/

document.addEventListener('DOMContentLoaded', function() {
    let elems = document.querySelectorAll('.modal');
    let instances = M.Modal.init(elems);
});


/* ------------------------------------*/
/*** TITLE BAR  */
/* ------------------------------------*/

// Minimize task
$(".titlebar .titlebar-minimize").on("click", (e) => {
    let window = BrowserWindow.getFocusedWindow();
    window.minimize();
});

// Maximize window
$(".titlebar .titlebar-resize").on("click", (e) => {
    let window = BrowserWindow.getFocusedWindow();
    if (window.isMaximized()){
        $('.titlebar').removeClass('fullscreen');
        window.unmaximize();
    } else{
        $('.titlebar').addClass('fullscreen');
        window.maximize();
    }
});

// Close app
$(".titlebar .titlebar-close").on("click", (e) => {
    let window = BrowserWindow.getFocusedWindow();
    window.close();
});


/* ------------------------------------*/
/*** LOCATIION i18n  */
/* ------------------------------------*/

i18next.init({
    lng: 'br',
    debug: false,
    resources: {
        br: {
            translation: {
                    "name": "Nome",
                    "last-modified": "Última modificação",
                    "size": "Tamanho",
                    "status": "Situação",
                    "not-upload": "Nenhum arquivo para upload",
                    "live-sync": "Sincronia",
                    "drive": "Google Drive",
                    "folders-sync": "Pastas Sincronizadas",
                    "settings": "Configurações",
                    "authentication": "Autenticação",
                    "new-sync": "Nova Sincronia",
                    "back": "Voltar",
                    "finish": "Finalizar"
                }
            }
    }
}, function(err, t) {
    $('[data-i18n]').each(function(){
        let label = i18next.t(
            $(this).attr('data-i18n')
        );
        $(this).html(label);
    });
});


/* ------------------------------------*/
/*** SPLASH SCREEN
/* ------------------------------------*/

setTimeout(function(){ 
    $('#splash-screen-modal').removeClass('is-shown');
}, 2000);
