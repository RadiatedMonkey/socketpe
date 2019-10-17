const socket = io();

socket.on("reload", () => document.location.reload(true));

const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const runCMDBtn = document.getElementById('runCMD');
const socketConsole = document.getElementById('console-content');

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
});

socket.on('log', data => {
    socketConsole.innerHTML += `<p>${data.message}</p>`;
});

socket.on('updateServerData', data => {
    console.log(data);
    data.logHistory.forEach(log => {
        socketConsole.innerHTML += `<p>${log}</p>`;
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
    console.log("test");
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