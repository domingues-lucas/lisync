const cmd=require('node-cmd');
const materialize=require('materialize-css');


// Open file Explorer
const {shell} = require('electron')
const os = require('os')
const fileManagerBtn = document.getElementById('open-file-manager')

fileManagerBtn.addEventListener('click', (event) => {
  shell.showItemInFolder(os.homedir())
})


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

document.body.addEventListener('click', function (e) {
    if ( e.target.parentElement.classList.contains('open-folder') ) {
        openFolder(e.target.parentElement.getAttribute('attr-path') + '/' + e.target.innerText)
    }
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