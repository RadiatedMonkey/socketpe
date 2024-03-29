const socket = io();
const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const runCMDBtn = document.getElementById('runCMD');
const socketConsole = document.getElementById('console-output');
const installedPacksList = document.getElementById('installed-packs');
const serverStatus = document.getElementById("server-status");

let serverRunning = false;

document.addEventListener('DOMContentLoaded', e => {
    socket.emit('detectInstalledPacks');
});

socket.on('disconnect', () => {
    Swal.fire({
        type: 'error',
        title: 'Disconnected from Server',
        text: 'You have been disconnected from the backend server',
        showConfirmButton: false
    });
    serverStateChanger.textContent = 'Server unavailable';
    serverStateChanger.disabled = true;
    serverStatus.textContent = "Status: Not Connected";
    clearSocketConsole();
});

socket.on('reconnect', () => {
    Swal.fire({
        type: 'success',
        title: 'Reconnected to Server',
        text: 'You have been reconnected to the backend server',
        showConfirmButton: false
    });
    clearSocketConsole();
    serverStateChanger.disabled = false;
    serverStatus.textContent = "Status: Connected";
});

socket.on('log', data => {
    socketConsole.innerHTML += `<span>${data.message}</span>`;
});

socket.on('displayInstalledPacks', data => {
    const pluginList = document.getElementById("plugin-list");
    const pluginSpy = document.getElementsByClassName("plugin-scrollspy")[0];
    if(data.packs.length === 0) pluginSpy.innerHTML = '<h5 class="text-dark text-center">No installed plugins detected</h5>';
    else {
        data.packs.forEach((pack, idx) => {
            pluginList.innerHTML += `
                <a class="list-group-item list-group-item-action" href="#plugin-${idx}">${pack.name}</a>
            `;
            pluginSpy.innerHTML += `
                <img class="plugin-thumbnail mt-3" src="${pack.thumbnail ? pack.thumbnail : 'http://localhost/resources/thumbnail-placeholder.jpg'}" alt="Thumbnail of ${pack.name}" />
                <h5 id="plugin-${idx}" class="mb-2">${pack.name}</h5>
                <p class="plugin-info">Version ${pack.version.join(".")} - Created by ${pack.author}</p>
                <hr class="mb-3" />
                
                <button class="btn btn-secondary mb-3" onclick="editConfig('${pack.pack_file}')">Edit Configuration</button>
                <div class="description-wrapper">
                    <button class="btn btn-outline-primary mb-3" type="button" data-toggle="collapse" data-target="#pluginDescription-${idx}" aria-expanded="false" aria-controls="pluginDescriptionCollapse">
                        View Description
                    </button>
                    <div class="collapse" id="pluginDescription-${idx}">
                        <div class="card card-body">
                            ${pack.description ? pack.description : 'No Description Provided'}
                        </div>
                    </div>
                </div>
            `;
        });
    }
});

socket.on('updateServerData', data => {
    console.log(data);
    data.logHistory.forEach(log => {
        socketConsole.innerHTML += `<span>${log}</span>`;
    });
    serverStateChanger.disabled = false;
    if(data.wssRunning) {
        serverStateChanger.textContent = 'Stop server';
        runCMDBtn.disabled = false;
        serverRunning = true;
    } else {
        serverStateChanger.textContent = 'Start server';
        serverRunning = false;
    }
});

socket.on('noClient', () => {
    Swal.fire({
        type: 'error',
        title: 'No Client Connected',
        text: 'Please connect Minecraft to the WebSocket server before sending any commands',
        showConfirmButton: false
    });
});

socket.on('noConfig', file => {
    Swal.fire({
        type: 'question',
        title: 'No Configuration',
        text: 'This plugin does not have any configuration options, do you want to open it anyway?',
        showCancelButton: true
    })
    .then(result => {
        if(result.value) {
            Swal.fire({
                type: 'info',
                title: 'Opening text editor...',
                position: 'center',
                showConfirmButton: false,
                timer: 3000
            });
            socket.emit("openPlugin", file);
        }
    });
});

serverStateChanger.addEventListener('click', e => {
    if(serverRunning) {
        serverStateChanger.textContent = 'Start server';
        runCMDBtn.disabled = true;
    } else {
        clearSocketConsole();
        socket.emit('clearLogHistory', {});
        serverStateChanger.textContent = 'Stop server';
        runCMDBtn.disabled = false;
    }
    serverRunning = !serverRunning;
    socket.emit('changeState', {state: serverRunning}); 
});

runCMDBtn.addEventListener('click', async () => {
    const { value: cmd } = await Swal.fire({
        title: 'Send a Command',
        text: 'All commands are executed by the player that has connected to the server using /connect',
        input: 'text',
        inputValidator: value => {
          if (!value) {
            return 'You need to write something!'
          }
        },
        showCloseButton: true
      });
      
      if (cmd) {
        socket.emit('runCMD', {cmd: cmd});
      }
});

clearConsoleBtn.addEventListener('click', e => {
    clearSocketConsole();
    socket.emit('clearLogHistory', {});
});

function clearSocketConsole() {
    socketConsole.innerHTML = '';
}

function editConfig(file) {
    Swal.fire({
        type: 'info',
        title: 'Opening text editor...',
        position: 'center',
        showConfirmButton: false,
        timer: 3000
    });
    socket.emit("editConfig", {pluginName: file});
}

document.getElementById("open-plugins").addEventListener("click", () => {
    socket.emit("openPluginsFolder");
});

document.getElementById('refresh-plugins').addEventListener("click", () => {
    document.getElementById("plugin-list").innerHTML = '';
    document.getElementsByClassName('plugin-scrollspy')[0].innerHTML = '';
    socket.emit("detectInstalledPacks");
});