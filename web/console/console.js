const socket = io();
const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const runCMDBtn = document.getElementById('runCMD');
const socketConsole = document.getElementById('console-output');
const installedPacksList = document.getElementById('installed-packs');
let serverRunning = false;

document.addEventListener('DOMContentLoaded', e => {
    socket.emit('detectInstalledPacks', {});
});

socket.on('disconnect', () => {
    Swal.fire({
        type: 'error',
        title: 'Disconnected',
        text: 'Your SocketPE server went offline',
        showConfirmButton: false
    });
    serverStateChanger.textContent = 'Server unavailable';
    serverStateChanger.disabled = true;
    clearSocketConsole();
});

socket.on('reconnect', () => {
    Swal.fire({
        type: 'success',
        title: 'Reconnected',
        text: 'You have been reconnected to the server',
        showConfirmButton: false
    });
    clearSocketConsole();
    serverStateChanger.disabled = false;
});

socket.on('log', data => {
    socketConsole.innerHTML += `<span>${data.message}</span>`;
});

socket.on('displayInstalledPacks', data => {
    console.log(data.packs.length);
    installedPacksList.classList.remove('row');
    installedPacksList.innerHTML = '';
    if(data.packs.length === 0) installedPacksList.innerHTML = '<h5 class="text-dark text-center">No installed function packs detected</h5>';
    else {
        data.packs.forEach(pack => {
            installedPacksList.innerHTML += ` 
                <div class="pack-info jumbotron bg-secondary p-3 rounded">
                    <span class="text-white font-weight-bold">${pack.name} - v${String(pack.version.slice(0,3)).replace(/,/g, ".")}</span>
                    <button class="btn btn-light float-right uninstall-pack" onclick="uninstallPack(${JSON.stringify(pack)})">Uninstall</button>
                    <img class="pack-thumbnail float-left" src="${pack.thumbnail ? pack.thumbnail : 'https://github.com/RadiatedMonkey/socketpe-packs/raw/master/thumbnail_placeholder.png'}" alt="${pack.name}'s thumbnail">
                    <br />
                    <span class="text-white font-weight-light">By ${pack.author}</span>
                </div>  
            `;
        });
    }
});

socket.on('updateServerData', data => {
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
        title: 'Send a commamd',
        text: 'All commands are executed by the player hosting the world',
        input: 'text',
        inputValidator: value => {
          if (!value) {
            return 'You need to write something!'
          }
        }
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