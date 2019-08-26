const socket = io();
const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const socketConsole = document.getElementById('console-output');
let serverRunning = false;

// Event listeners

socket.on('disconnect', () => {
    Swal.fire({
        type: 'error',
        title: 'Disconnected',
        text: 'Your SocketPE server went offline',
        timer: 5000,
        showCloseButton: true,
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
        timer: 5000,
        showCloseButton: true,
        showConfirmButton: false
    });
    clearSocketConsole();
    serverRunning = false;
    serverStateChanger.textContent = 'Start server';
    serverStateChanger.disabled = false;
});

socket.on('wsStarted', () => {
    console.log('SocketPE started');
});

socket.on('log', data => {
    socketConsole.innerHTML += `<span>${data.message}</span>`;
});

serverStateChanger.addEventListener('click', e => {
    if(serverRunning) {
        serverStateChanger.textContent = 'Start server';
    } else {
        serverStateChanger.textContent = 'Stop server';
    }
    serverRunning = !serverRunning;
    socket.emit('changeState', {state: serverRunning}); 
});

clearConsoleBtn.addEventListener('click', clearSocketConsole);

function clearSocketConsole(){ socketConsole.innerHTML = ''; }

// Functions
