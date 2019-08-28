process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
// const socketServer = require('./ws/server');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const wsProcess = childProcess.fork('./ws/childProcess');

path.join(__dirname, '/ws');
path.join(__dirname, '/common.js');

path.join(__dirname, '/node_modules');
path.join(__dirname, '/web'); // Make sure PKG puts the control panel files into the exe

app.use('/resources', express.static('web/resources'));
app.use('/', express.static('web/console'));
app.use('/docs', express.static('web/docs'));

io.on('connection', socket => {

    wsProcess.send({purpose: 'updateServerData'});

    wsProcess.on('message', data => {
        if(data.purpose === 'updateServerData') {
            socket.emit('updateServerData', data.content);
        } else if(data.purpose === 'logToConsole') {
            socket.emit('log', {message: data.content});
        } else if(data.purpose === 'commitSuicide') {
            wsProcess.kill();
        }
    });

    socket.on('changeState', data => {
        if(data.state) wsProcess.send({purpose: 'startServer'});
        else {
            wsProcess.send({purpose: 'stopServer', process: wsProcess});
        }
    });

    socket.on('detectInstalledPacks', () => {
        fs.readdir(path.join(__dirname, '/functions'), (err, files) => {
            if(err) console.log(err);
            else {
                let funcPacks = [];
                files.forEach(file => {
                    let funcManifest = require(path.join(__dirname, '/functions/', file)).manifest;
                    funcManifest.pack_file = file;
                    if(funcManifest) funcPacks.push(funcManifest);
                    else socket.emit("log", {message: `${file} does not contain a manifest, skipping it`});
                });
                setTimeout(function() {
                    socket.emit("displayInstalledPacks", {packs: funcPacks});
                }, 500);
            }
        });
    });

    socket.on('uninstallPack', data => {
        fs.rename(path.join(__dirname, '/functions/', data.pack_file), path.join(__dirname, '/functions/', data.pack.file, '.disabled'), err => {
            if(err) module.exports.log(`An error occurred try to disabled the function pack:<br>${err}`);
        });
    });

    socket.on('runCMD', data => wsProcess.send({purpose: 'runCMD', content: data.cmd}));
    socket.on('clearLogHistory', () => wsProcess.send({purpose: 'clearLogHistory'}));
});

http.listen(80, err => {
    if(err) console.log(err);
    else console.log('Open http://localhost in your browser');
});