'use strict';

/* ------------------------------------*/
/*** IMPORTS
/* ------------------------------------*/

const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;
const settings = require('electron-settings');

const { dialog } = require('electron').remote

const cmd = require('node-cmd');
const materialize = require('materialize-css');
const moment = require('moment');
const os = require('os');
const fs = require('fs');
const $ = require('jquery');

/* ------------------------------------*/
/*** GENERAL VARIABLES
/* ------------------------------------*/

const links = document.querySelectorAll('link[rel="import"]');
const rclone = process.platform === 'darwin' ? 'rclone/mac/rclone' : process.platform === 'win32' ? '"rclone/win/rclone"' : 'rclone/linux/rclone';
const localStorageFileSync = new EasyLocalStorage('folders-sync');
const sectionId = settings.get('activeSectionButtonId');
const activeLanguage = localStorage.language || 'en-US';
const translations = setTranslation();
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
    'psd': 'psd.svg',
    'rtf': 'rtf.svg',
    'svg': 'svg.svg',
    'txt': 'txt.svg',
    'xls': 'xls.svg',
    'xlsx': 'xls.svg',
    'xml': 'xml.svg',
    'zip': 'zip.svg'
};

/* ------------------------------------*/
/*** GENERAL FUNCTIONS
/* ------------------------------------*/

Array.prototype.forEach.call(links, (link) => {

    let template = link.import.querySelector('.task-template'),
        clone = document.importNode(template.content, true);

    if ( link.dataset.window === 'modal' ) {
        document.querySelector('body').appendChild(clone);
    } else {
        document.querySelector('.content').appendChild(clone);
    }

});

function setTranslation() {

    try {
        if ( activeLanguage !== '' && activeLanguage !== 'en-US' ) {
            return JSON.parse(fs.readFileSync('./locales/' + activeLanguage + '/translation.json', 'utf8'));
        }
    } catch (e) {
        console.log('Translation file not found.');
        console.error(e);
    }

    return {};
}

function getTranslation(str) {

    if( translations.hasOwnProperty(str) ){
        return translations[str];
    }

    return str;
}

function EasyLocalStorage(key) {

    localStorage[key] = localStorage[key] || '[]';

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

    } else if (section === 'settings') {
        getGDriveStatus();
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
        value = this + 'B'
    } else if ( this < 1000000 ) {
        value = (this/1000).toFixed(1) + 'K'
    } else if ( this < 1000000000 ) {
        value = (this/1000000).toFixed(1) + 'M'
    } else {
        value = (this/1000000000).toFixed(1) + 'G'
    }
    return value;
};

String.prototype.lastElement = function(_split) {
    let _array = this.split(_split);
    return _array.pop();
};

function getFileStats(file) {
    let _stats = fs.statSync(file),
        _details = {
            'size': _stats.size,
            'modified': _stats.mtime
        };
    return _details;
}

function getIcon(_extension) {
    return fileExtensions[_extension] ? fileExtensions[_extension] : 'file.svg';
}

String.prototype.replaceAll = function(a, b) {
    return this.split(a).join(b);
};

String.prototype.escapeQuotes = function(a) {
    return this.replaceAll('"', '\\"')
               .replaceAll('`', '\\`');
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

$('body').on('click', '.open-browser', function() {
    event.preventDefault();
    let url = event.target.href;
    electron.shell.openExternal(url);
});

/* ------------------------------------*/
/*** INIT FUNCTIONS
/* ------------------------------------*/


// Sections
if (sectionId) {
    showMainContent();
    const section = $(`#${sectionId}`);
    if (section) section.click();
} else {
    activateDefaultSection();
}

// Materialize
document.addEventListener('DOMContentLoaded', function() {
    M.Modal.init(document.querySelectorAll('.modal'));
    M.FormSelect.init(document.querySelectorAll('select'));
});


/* ------------------------------------*/
/*** SETTINGS
/* ------------------------------------*/

$('#settings-section .language select').val(activeLanguage);

$('body').on('change', '#settings-section .language select', function() {
    localStorage.language = $(this).val();
    location.reload();
});

$('body').on('click', '#settings-section .authentication .connect', function() {

    let data_line = '',
        process = cmd.get(rclone + ' config create gdrive drive');

    process.stdout.on(
        'data',
        function(err, data, stderr) {
            data_line += data;
            if (data_line[data_line.length-1] == '\n') {
                $('#settings-section .authentication .message').html(`
                    <blockquote>
                        <p>Se o navegador não abrir automaticamente, acesse pelo link abaixo:</p>
                        <a class="open-browser" href="http://127.0.0.1:53682/auth">http://127.0.0.1:53682/auth</a>
                    </blockquote>
                `);
            };
        }
    );

    process.on(
        'exit', function() {
            getGDriveStatus();
        }
    );

});


$('body').on('click', '#settings-section .authentication .disconnect', function() {
    cmd.get(rclone + ' config delete gdrive', function() {
        getGDriveStatus();
    });
});

function getGDriveStatus() {

    console.log(rclone + ' listremotes')

    cmd.get(
        rclone + ' listremotes',
        function(err, data, stderr){
            console.log(data)
            if (data) {
                aboutGDrive();
            } else {
                renderGDriveConnect();
            }
        }
    );
}

function aboutGDrive() {

    loading(true);
    $('#settings-section .authentication .status').html(`<p>${getTranslation('Loading Drive informations...')}</p>`);

    cmd.get(
        rclone + ' about gdrive: --json',
        function(err, data, stderr){

            try {
                let about = JSON.parse(data);
                renderAboutGDrive(about)
            } catch (e) {
                console.log(e);
                renderGDriveConnect();
            }

            loading(false);
        }
    );
}

function renderAboutGDrive(about) {

    console.log("Conected!!!")

    $('#settings-section .authentication .status').html(`
        <div class="row">
            <div class="col s12">
                <div class="section materialize-section">
                    <h6>
                        <i class="material-icons left">check_circle_outline</i>
                        ${getTranslation('You are connected to Google Drive!')}
                    </h6>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col s12">
                <table class="striped">
                    <tbody>
                        <tr>
                            <td><b>${getTranslation('Total')}</b></td><td>${about.total.bytesFormat()}</td>
                        </tr>
                        <tr>
                            <td><b>${getTranslation('Used')}</b></td><td>${about.used.bytesFormat()}</td>
                        </tr>
                        <tr>
                            <td><b>${getTranslation('Trashed')}</b></td><td>${about.trashed.bytesFormat()}</td>
                        </tr>
                        <tr>
                            <td><b>${getTranslation('Other')}</b></td><td>${about.other.bytesFormat()}</td>
                        </tr>
                        <tr>
                            <td><b>${getTranslation('Free')}</b></td><td>${about.free.bytesFormat()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="row">
            <div class="col s12 actions">
                <button class="waves-effect waves-light btn disconnect right"><i class="material-icons left">close</i>${getTranslation('Disconnect')}</button>
            </div>
        </div>
    `);
}

function renderGDriveConnect() {

    console.log("NOT Conected!!!")

    $('#settings-section .authentication .status').html(`
        <div class="google-connect">
            <div class="row">
                <div class="col s1">
                    <img class="logo" src="./assets/img/google-drive.png">
                </div>
                <div class="col s8">
                    <p>${getTranslation('Connect to Google Drive')}</p>
                </div>
                <div class="col s3">
                    <button class="waves-effect waves-light btn-large right connect">
                        <i class="material-icons left">cloud_queue</i>Conectar
                    </button>
                </div>
            </div>
            <div class="row">
                <div class="col s12">
                    <section class="message"></section>
                </div>
            </div>
        </div>
    `);
}

/* ------------------------------------*/
/*** PAGE LIVE SYNC
/* ------------------------------------*/

let modifiedFiles = [],
    liveSyncInProgress = false;

function checkSync(step) {

    let foldersSync = localStorageFileSync.get('parse'),
        divContent = $('#live-sync-section .active-syncs'),
        totalSyncs = foldersSync.length;

    if ( totalSyncs > 0 ) {

        loading(true);

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
                                divContent.prepend(`<li class="not-found"><p>${getTranslation('Nothing folder for upload')}</p></li>`);
                            }

                            checkSync();
                        }

                    });

                }
            });

        } else {

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
                                    stats = getFileStats(e),
                                    name = e.lastElement('/');

                                divContent.prepend(syncRowHTML('remove', folderSync.local, icon, name, stats.modified, stats.size));
                                divContent.find('li').eq(0).removeClass('remove');
                                items_add++;
                            }
                        });

                        divContent = $('#live-sync-section .active-syncs');
                        item = divContent.find('li');
                        let modify_icon = '';

                        if ( modifiedFiles[i] ) {
                            modifiedFiles[i].forEach( function(e, i) {
                                if ( _modifiedFiles.indexOf(e) === -1) {
                                    modify_icon = item.eq(i + items_add).find('.status .material-icons');
                                    modify_icon.removeClass('blink');
                                    modify_icon.addClass('done');
                                    modify_icon.text('cloud_done');
                                }
                            });

                            modifiedFiles[i] = _modifiedFiles;
                        }

                        totalSyncs === i + 1 ? loading(false) : null;

                    });

                }

            });

        }

    } else {

        $( document ).ready(function() {
            divContent.html(`<li class="not-found"><p>${getTranslation('Nothing file for sync')}</p><li>`);
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

function liveSync(i){

    i = i || 0;

    checkSync();

    if ( !liveSyncInProgress ) {

        console.log('LiveSync START');
        liveSyncInProgress = true;

        let foldersSync = localStorageFileSync.get('parse'),
            totalSyncs = foldersSync.length,
            folderSync;

        if ( totalSyncs > 0 ) {

            folderSync = foldersSync[i];

            if ( folderSync.status ) {

                // Desabilitado para evitar upload incorreto durante desenvolvimento

                let processRef = cmd.get(`${rclone} sync --progress "${folderSync.local}" "gdrive:${folderSync.remote}"`, function(){
                    liveSyncInProgress = false;
                    if ( totalSyncs === i + 1 ) {
                        console.log("LiveSync END");
                        checkSync();
                    } else {
                        console.log('MAIS UM');
                        liveSync(i + 1);
                    }
                });

                processRef.stdout.on(
                    'data',
                    function(data) {

                        data = data.split('\n');

                        let current = data[3] ? parseInt(data[3].split(': ')[1].split(' /')[0].trim()) : '',
                            total = data[3] ? parseInt(data[3].split(': ')[1].split(' /')[1].split(',')[0].trim()) : '',
                            transferring = data[6] ? data[6].split('* ')[1].trim() : '';

                        if ( total > 0 && current < total ) {
                            $('.live-sync footer .upload').html(`
                                <p><b>Transferindo ${current + 1 } de ${total} arquivo(s)</b></p>
                                <p>${transferring}</p>
                            `);
                        } else {
                            $('.live-sync footer .upload').html('');
                        }

                    }
                );
            }
        }
    }
}

$('#check-sync').on('click', function() {
    liveSync();
});


/* ------------------------------------*/
/*** PAGE DRIVE
/* ------------------------------------*/

function openFolder(path) {
    loading(true);
    cmd.get(
        rclone + ' lsjson --fast-list gdrive:/' + path,
        function(err, data, stderr){
			
            $('#remote').html('');

            let backDirectory = path.split('/').slice(0, -1).join('/');
            if ( backDirectory !== '' ) {

                $('#remote').html(`
                    <li>
                        <div class="name">
                            <a class="open-folder" attr-path="${backDirectory}">
                                <img class="icon" src="./assets/icons/folder.svg">
                                <span class="item-name">..</span>
                            </a>
                        </div>
                    </li>
                `);
            }

            if (data) {
                JSON.parse(data).forEach(e => {

                    e.Size = e.Size === -1 ? '0' : e.Size;
                    e.ModTime = moment(e.ModTime).format('YYYY-MM-DD hh:mm:ss');
                    e.Extension = e.Name.split('.').slice(-1)[0];

                    e.IsDir ? ( e.Icon = 'folder.svg', e.Tag = 'a class="open-folder"' ) : ( e.Tag = 'div', fileExtensions[e.Extension] ? e.Icon = fileExtensions[e.Extension] : e.Icon = 'file.svg' );

                    $('#remote').append(`
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
                    `);

                });
            }

            loading(false);
        }
    );
}

$('body').on('click', '.open-folder', function(){
    let path = ( $(this).attr('attr-path') + '/' + $(this).find('.item-name').text() ).replace('/..', '');
    openFolder(path);
});

/* ------------------------------------*/
/*** PAGE SELECT FOLDERS
/* ------------------------------------*/
let win32Drives;

function openLocalFolder(path) {
	if ( process.platform === 'win32' ) {
        if (win32Drives) {
            cmd.get('wmic logicaldisk get name', function(err, data, stderr){
                win32Drives = data.split('\n').map(drive => drive.trim()).filter(drive => drive !== 'Name' && drive !== '').map(drive => drive + '/');
                realOpenLocalFolder(path);
            });
        } else {
            realOpenLocalFolder(path);
        }
	} else {
		realOpenLocalFolder(path);
	}
}

function realOpenLocalFolder(path) {

    $('.local.list-files .directory').html('');
    $('.select-folders .hidden-files input').attr('data-directory', path);

    let cmdListFolders = process.platform === 'win32' ? `dir "${path.escapeQuotes()}"` : `cd "${path.escapeQuotes()}" && ls -d */`,
        pathBackDirectory = path.split('/').slice(0, -1).join('/'),
        backDirectory = process.platform === 'win32' ? win32Drives.indexOf(path) !== -1 ? '/' : pathBackDirectory : pathBackDirectory,
        allFolders = [],
        visibleFolders = [],
		listFolders = [],
        hiddenFolder = $('.select-folders .hidden-files input').is(":checked");

	if ( path !== '/' ) {
		openFolderBackHTML(backDirectory);
    };
	
	if ( process.platform === 'win32' && path === '/' ) {
		win32Drives.forEach(function(e) {
			openFolderHTML('', e);
		});

	} else {

		try {
			
			fs.readdirSync(path.escapeQuotes()).filter(function (folder) {	

				let fullPath = path + '/' + folder;
				
				try {

					if ( fs.existsSync(fullPath) ) {

						if (fs.statSync(fullPath).isDirectory() ) {
							allFolders.push(folder);
						};

					}
					
				} catch (e) {
					console.log('Error read folder: ' + e)
				}

			});
			
		} catch (e) {
			console.log('Error read folder: ' + e)
		}

		cmd.get(cmdListFolders, function(err, data, stderr){
			
			console.log(cmdListFolders)

			if ( data ) {
				
				if ( process.platform === 'win32' ) {
					
					data.split('\n').forEach(function(e) {
						
						if ( e.indexOf('<DIR>') !== -1 ) {
							
							if ( e.split('<DIR>')[1].trim() !== '.' && e.split('<DIR>')[1].trim() !== '..' ) {
								visibleFolders.push(e.split('<DIR>')[1].trim());
							}
						}

					});
					
				} else {
					data.split('\n').forEach(function(e) {
						e && visibleFolders.push(e.substr(0,(e.length - 1)).trim());
                    });
				}
				
			}

			listFolders = hiddenFolder ? allFolders : visibleFolders;

			listFolders.forEach(function(e) {
				openFolderHTML(path, e);
			});

		});
		
	}

}

function openFolderHTML(path, e) {
	$('.local.list-files .directory').append(`
		<li class="item-select local unique">
			<div class="name truncate">
				<a class="open-local-folder" attr-path="${path}">
					<img class="icon" src="./assets/icons/folder.svg">
					<span class="item-name">${e}</span>
				</a>
			</div>
		</li>
	`);
}

function openFolderBackHTML(backDirectory) {
	$('.local.list-files .directory').html(`
		<li>
			<div class="name">
				<a class="open-local-folder" attr-path="${backDirectory}">
					<img class="icon" src="./assets/icons/folder.svg">
					<span class="item-name">..</span>
				</a>
			</div>
		</li>
	`);
}

function openRemoteFolder(path) {

    loading(true);
    cmd.get(
        rclone + ' lsjson --fast-list gdrive:/' + path,
        function(err, data, stderr){

            $('.remote.list-files .directory').html('');

            let backDirectory = path.split('/').slice(0, -1).join('/');
            if ( backDirectory !== '' ) {

                $('.remote.list-files .directory').html(`
                    <li>
                        <div class="name">
                            <a class="open-remote-folder" attr-path="${backDirectory}">
                                <img class="icon" src="./assets/icons/folder.svg">
                                <span class="item-name">..</span>
                            </a>
                        </div>
                    </li>
                `);
            }

            if (data) {
                JSON.parse(data).forEach(e => {
                    if ( e.IsDir ){
                        $('.remote.list-files .directory').append(`
                            <li class="item-select remote unique">
                                <div class="name truncate">
                                    <a class="open-remote-folder" attr-path="${path}">
                                        <img class="icon" src="./assets/icons/folder.svg">
                                        <span class="item-name">${e.Name}</span>
                                    </a>
                                </div>
                            </li>
                        `);
                    }
                });
            }

            loading(false);
        }
    );
}

function selectedFolder(path, source) {

    let name = path.split('/').pop();
	
	path = path.replace('//', '/');

    if ( source === 'local' ) {
        $('.selected-folders .local').html(`
            <div class="infos">
                <i class="material-icons icon left">computer</i>
                <h2 class="truncate">${name}</h2>
                <label class="truncate">${path}</label>
            </div>
            <div class="direction">
                <i class="material-icons">chevron_right</i>
            </div>
        `);
    }

    if ( source === 'remote' ) {
        $('.selected-folders .remote').html(`
            <div class="infos">
                <i class="material-icons icon left">cloud_upload</i>
                <h2 class="truncate">${name}</h2>
                <label class="truncate">${path}</label>
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
    let _current = localStorageFileSync.get('parse');
    _current.push(sync);
    localStorageFileSync.set('parse', _current);
    updateListSyncs();
}

function emptyFolder(path) {
    loading(true);
    cmd.get(
        rclone + ' lsjson --fast-list gdrive:/' + path,
        function(err, data, stderr){
            if (data) {
                let instance = M.Modal.getInstance(document.querySelector('.empty-folder'));
                instance.open();
            } else {
                finishSyncFolder(true);
            }
            loading(false);
        }
    );
}

function finishSyncFolder(verified) {

    let _local = $('.selected-folders .local .infos label'),
        _remote = $('.selected-folders .remote .infos label');

    if (verified) {
        addFolderSync({ "local": _local.text(), "remote": _remote.text(), "status": true });
        $('[data-section="folders-sync"]').click();
    } else {
        emptyFolder(_remote.text());
    }

}

!localStorageFileSync.get() ? localStorageFileSync.set(null, '[]') : null;

$('body').on('click', '.open-local-folder', function(event){
    event.stopPropagation();

	let attrPath = $(this).attr('attr-path'),
		basePath = ( attrPath === '' || attrPath === '/' ) ? attrPath : attrPath + '/',
		path = (( basePath + $(this).find('.item-name').text() ).replace('/..', '')) || '/';
		
		console.log(path);
	
    openLocalFolder(path);
    selectedFolder(path, 'local');
});

$('body').on('click', '.open-remote-folder', function(event){
    event.stopPropagation();
    let path = ( $(this).attr('attr-path') + '/' + $(this).find('.item-name').text() ).replace('/..', '');
    openRemoteFolder(path);
    selectedFolder(path, 'remote');
});


$('body').on('click', '.item-select', function(){

    let path = $(this).find('.open-local-folder, .open-remote-folder').attr('attr-path') + '/' + $(this).find(".item-name").text(),
        source = $(this).hasClass('local') ? 'local' : 'remote';

    if ( !event.target.classList.contains('icon') && !event.target.classList.contains('item-name') ) {

        if (!event.ctrlKey || $(this).hasClass('unique')) {
            $('.item-select.' + source).removeClass('selected');
        }
        $(this).toggleClass('selected');

    }

    selectedFolder(path, source);

});

$('#folders-sync-finish').on('click', function() {
    finishSyncFolder();
});

$('.empty-folder').on('click', '.check-confirm', function(){
    let check = $('.empty-folder .check-confirm').prop('checked'),
        confirm = $('.empty-folder .confirm');

    if ( check ) {
        confirm.prop('disabled', false);
    } else {
        confirm.prop('disabled', true);
    }
});

$('.empty-folder').on('click', '.confirm', function(){
    finishSyncFolder(true);
});

$('.select-folders .hidden-files input').on('click', function(){
    openLocalFolder($(this).attr('data-directory'));
});


/* ------------------------------------*/
/*** PAGE FOLDERS SYNC
/* ------------------------------------*/

function updateListSyncs() {

    if ( localStorageFileSync.get() !== '[]' ) {

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

    } else {
        $( document ).ready(function() {
            $('#list-syncs ul').html(`<li class="not-found"><p>${getTranslation('Nothing folder for sync')}</p></li>`);
        });
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
/*** TITLE BAR  */
/* ------------------------------------*/

// Minimize task
$(".titlebar .titlebar-minimize").on("click", () => {
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
/*** SPLASH SCREEN
/* ------------------------------------*/

setTimeout(function() { 
    $('#splash-screen-modal').removeClass('is-shown');

    try {
        let window = BrowserWindow.getFocusedWindow();
        window.maximize();
    } catch {}

}, 2000);

/* ------------------------------------*/
/*** LOCATIION i18n  */
/* ------------------------------------*/

$('[data-i18n]').each(function(){
    $(this).html(
        getTranslation($(this).attr('data-i18n'))
    );
});



