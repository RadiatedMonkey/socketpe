const socket = io();
const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const runCMDBtn = document.getElementById('runCMD');
const socketConsole = document.getElementById('console-output');
const installedPacksList = document.getElementById('installed-packs');
const serverStatus = document.getElementById("server-status");

let serverRunning = false;

document.addEventListener('DOMContentLoaded', e => {
    socket.emit('detectInstalledPacks', {});
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
    installedPacksList.classList.remove('row');
    installedPacksList.innerHTML = '';
    if(data.packs.length === 0) installedPacksList.innerHTML = '<h5 class="text-dark text-center">No installed plugins detected</h5>';
    else {
        data.packs.forEach(pack => {
            installedPacksList.innerHTML += ` 
                <div class="pack-info jumbotron bg-success p-3 rounded">
                    <span class="text-white font-weight-bold">${pack.name} - v${pack.version.slice(0, 3).join(".")}</span>
                    <button class="btn btn-light float-right uninstall-pack" onclick="uninstallPack(${JSON.stringify(pack)})">Uninstall</button>
                    <img class="pack-thumbnail float-left" src="${pack.thumbnail ? pack.thumbnail : 'https://raw.githubusercontent.com/RadiatedMonkey/socketpe-marketplace/master/thumbnail_placeholder.png'}" alt="${pack.name}'s thumbnail">
                    <br />
                    <span class="text-white font-weight-light">By ${pack.author}</span>
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