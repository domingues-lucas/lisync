'use strict';

const cmd=require('node-cmd');
const materialize=require('materialize-css');

// Open file Explorer
const shell = require('electron')
const os = require('os')
// const fileManagerBtn = document.getElementById('open-file-manager')

let page = {
    source: 'index.html'
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
}

// fileManagerBtn.addEventListener('click', (event) => {
//   shell.showItemInFolder(os.homedir())
// })

// Delegate
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
    }
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
        }

    });

});

document.querySelector('#authorization').addEventListener('click', function() {
    let data_line = '';
    cmd.get('rclone/rclone config create gdrive drive').stdout.on(
        'data',
        function(data) {
            data_line += data;
            if (data_line[data_line.length-1] == '\n') {
                console.log(data_line);
                // document.querySelector('#authorization-status').innerHTML += data_line;
            }
        }
    )
});

document.querySelector('#authorization-status .open-browser').addEventListener('click', function(event) {
    event.preventDefault();
    let link = event.target.href;
    require("electron").shell.openExternal(link);
});

document.querySelector('#button-drive').addEventListener('click', function(event) {
    beforePageLoad("drive.html");
});

// Open remote folder
let openFolder = function (path) {
    cmd.get(
        'rclone/rclone lsjson gdrive:/' + path,
        function(err, data, stderr){

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

            JSON.parse(data).forEach(e => {

                e.Size = e.Size === -1 ? '-' : e.Size + ' K';
                e.ModTime = e.ModTime.replace(/[TZ]/g, ' ');
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
                        <div class="size">${e.Size}</div>
                    </li>
                `;

            });
        }
    );
}

document.querySelector('#button-select-folders').addEventListener('click', function(event) {
    openLocalFolder('/');
    openRemoteFolder('Afeto');
});

// Open local folder
var openLocalFolder = function (path) {

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
                }
            });
        }
    );
}

// Open remote folder
var openRemoteFolder = function (path) {
    console.log('OPEN!');
    cmd.get(
        'rclone/rclone lsjson gdrive:/' + path,
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
        }
    );
}

var beforePageLoad = function (pageSource) {

    console.log(pageSource);

    if ( pageSource === 'drive.html' ) {
        openFolder('Afeto');
    }

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
            addFolderSync(local.innerText + '"!#"' + _remote.innerText);
        }

    }

});

let addFolderSync = function addFolderSync(sync) {
    let _current = localStorage['folders-sync'];

    _current.split(';')
    console.log(current)
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
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems);
});