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
var listEvents = [];

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
var openFolder = function (path) {
    console.log('OPEN!');
    cmd.get(
        'rclone/rclone lsjson gdrive:/' + path,
        function(err, data, stderr){
            console.log(path)

            document.querySelector('#remote').innerHTML = `
                <li class="item-select">
                    <div class="name">
                        <a class="open-folder" attr-path="${path}">
                            <span class="icon"><img src="./assets/icons/folder.svg"></span>
                            <span class="item-name">..</span>
                        </a>
                    </div>
                </li>
            `;

            listFiles = JSON.parse(data);
            listFiles.forEach(e => {

                if ( e.Size === -1 ) {
                    e.Size = '-';
                } else {
                    e.Size = e.Size + 'K';
                };

                e.ModTime = e.ModTime.replace(/[TZ]/g, ' ');
                e.Extension = e.Name.split('.').slice(-1)[0];

                ( e.IsDir ) ? ( e.Icon = 'folder.svg', e.Tag = 'a class="open-folder"' ) : ( e.Tag = 'div', fileExtensions[e.Extension] ? e.Icon = fileExtensions[e.Extension] : e.Icon = 'file.svg' );

                document.querySelector('#remote').innerHTML += `
                    <li class="item-select">
                        <div class="name">
                            <${e.Tag} attr-path="${path}">
                                <span class="icon"><img src="./assets/icons/${e.Icon}"></span>
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

var beforePageLoad = function (pageSource) {

    console.log(pageSource);

    if ( pageSource === 'drive.html' ) {
        openFolder('Afeto');
    }

}

document.querySelector('body').delegate('.open-folder', function(e){
    openFolder(e.getAttribute('attr-path') + '/' + e.querySelector('.item-name').innerText);
});

document.querySelector('body').delegate('.item-select', function(e){
    e.classList.toggle("selected");
});

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