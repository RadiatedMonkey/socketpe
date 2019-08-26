const socket = io();
const serverStateChanger = document.getElementById('serverStateChanger');
const clearConsoleBtn = document.getElementById('clearConsole');
const socketConsole = document.getElementById('console-output');
const restartServerBtn = document.getElementById('restartServer');
let serverRunning = false;

async function loadCarouselData() {
    const carouselIndicators = document.getElementsByClassName('carousel-indicators')[0];
    const carouselInner = document.getElementsByClassName('carousel-inner')[0];

    let carouselItems = [];
    let featuredPacks = await fetch('https://raw.githubusercontent.com/RadiatedMonkey/socketpe-data/master/featured_packs.json');
    featuredPacks = await featuredPacks.json();
    
    featuredPacks.forEach((item, idx) => {
        carouselIndicators.innerHTML += `<li data-target="#featured_packs" data-slide-to="${idx + 1}"></li>`;
        carouselInner.innerHTML += `<div class="carousel-item"><h3 class="text-center text-white">${item.name}</h3><button class="downloadPack-btn btn btn-light" onclick="window.open('https://github.com/RadiatedMonkey/socketpe-data/blob/master/function_packs/${item.pack_name}.js')">Download</button></div>`;
    });
}
loadCarouselData();

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

socket.on('log', data => {
    socketConsole.innerHTML += `<span>${data.message}</span>`;
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

restartServerBtn.addEventListener('click', e => {

});

clearConsoleBtn.addEventListener('click', clearSocketConsole);

function clearSocketConsole(){ socketConsole.innerHTML = ''; }

// Functions
