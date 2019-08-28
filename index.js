process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const socketServer = require('./ws/server');
const fs = require('fs');
const path = require('path');

path.join(__dirname, '/node_modules');
path.join(__dirname, '/web'); // Make sure PKG puts the control panel files into the exe

app.use('/resources', express.static('web/resources'));
app.use('/', express.static('web/console'));
app.use('/docs', express.static('web/docs'));

io.on('connection', socket => {

    socket.emit('updateServerData', {logHistory: socketServer.logHistory, wssRunning: socketServer.wssRunning});

    socket.on('changeState', data => {
        socketServer.controlSocket = socket;
        if(data.state) socketServer.start(socket);
        else socketServer.stop();
    });

    socket.on('detectInstalledPacks', () => {
        setTimeout(function() {
            fs.readdir(path.join(__dirname, '/functions'), (err, files) => {
                if(err) console.log(err);
                else socket.emit('displayInstalledPacks', {packs: files});
            });
        }, 500);
    });

    socket.on('runCMD', data => {
        socketServer.runCMD(data.cmd);
    });

    socket.on('clearLogHistory', () => {
        socketServer.logHistory = [];
    });
});

http.listen(80, err => {
    if(err) console.log(err);
    else console.log('Open http://localhost in your browser');
});