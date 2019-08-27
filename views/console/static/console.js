const socket = io();
const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const socketConsole = document.getElementById('console-output');
const installedPacksList = document.getElementById('installed-packs');
let serverRunning = false;

// Event listeners

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
    serverRunning = false;
    serverStateChanger.textContent = 'Start server';
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
                <div class="pack-info jumbotron bg-secondary text-white p-3 rounded">${pack.name}<button class="btn btn-light float-right uninstall-pack" disabled onclick="socket.emit('uninstallPack', {packName: '${pack.pack_name}'})">Uninstall</button></div>  
            `;
        });
    }
});

serverStateChanger.addEventListener('click', e => {
    if(serverRunning) {
        serverStateChanger.textContent = 'Start server';
    } else {
        clearSocketConsole();
        serverStateChanger.textContent = 'Stop server';
    }
    serverRunning = !serverRunning;
    socket.emit('changeState', {state: serverRunning}); 
});

clearConsoleBtn.addEventListener('click', clearSocketConsole);

// Functions

function clearSocketConsole(){ socketConsole.innerHTML = ''; }