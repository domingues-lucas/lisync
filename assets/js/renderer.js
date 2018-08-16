const cmd=require('node-cmd');
const materialize=require('materialize-css');


// Open file Explorer
const {shell} = require('electron')
const os = require('os')
const fileManagerBtn = document.getElementById('open-file-manager')

fileManagerBtn.addEventListener('click', (event) => {
  shell.showItemInFolder(os.homedir())
})

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
        if (evt.target.is(e.elementSelector)) {
            e.callback.call(evt.target, evt);
        }
        if (evt.target.parentNode.is(e.elementSelector)) {
            e.callback.call(evt.target.parentNode, evt);
        }
    });

});


// Open remote folder
var openFolder = function (path) {
    cmd.get(
        'rclone/rclone lsjson gdrive:/' + path,
        function(err, data, stderr){
            document.querySelector('#remote').innerHTML = '';
            listFiles = JSON.parse(data);
            console.log(listFiles)
            listFiles.forEach(e => {

                if ( e.Size === -1 ) {
                    e.Size = '-'
                };

                document.querySelector('#remote').innerHTML += `
                    <li>
                        
                        <a class="open-folder" attr-path="${path}">
                            <label>
                                <input type="checkbox" class="filled-in" checked="checked" />
                                <span></span>
                            </label>
                            <span class="icon folder">
                            <span class="name">${e.Name}</span>
                            <span class="modified">${e.ModTime}</span>
                            <span class="size">${e.Size}</span>
                        </a>
                    </li>
                `;

            });
        }
    );
}

document.querySelector('body').delegate('.open-folder', function(e){
    openFolder(e.target.parentElement.getAttribute('attr-path') + '/' + e.target.innerText);
});

document.querySelector('body').delegate('.ajax-load', function(e){
    fetch(e.target.href)
    .then(response => response.text()) // retorna uma promise
    .then(result => {
        document.querySelector('#ajax-load').innerHTML = result;
    })
    .catch(err => {
        // trata se alguma das promises falhar
        console.error('Failed retrieving information', err);
    });
});


openFolder('Afeto');

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