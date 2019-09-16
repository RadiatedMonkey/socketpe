process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';
process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    fs.writeFile('./errors.log', err, () => {
        process.exit(1);
    });
  });

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const wsProcess = childProcess.fork(path.join(__dirname, '/ws/childProcess.js'));
const open = require('open');

app.use('/resources', express.static('web/resources'));
app.use('/', express.static('web/console'));
app.use('/docs', express.static('web/docs'));

io.on('connection', socket => {
    wsProcess.send({purpose: 'updateServerData'});

    wsProcess.on('message', data => {
        if(data.purpose === 'updateServerData') socket.emit('updateServerData', data.content);
        else if(data.purpose === 'log') socket.emit('log', {message: data.content});
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
            if(err) module.exports.log(`An error occurred:<br>${err}`);
        });
    });

    socket.on('runCMD', data => wsProcess.send({purpose: 'runCMD', content: data.cmd}));
    socket.on('clearLogHistory', () => wsProcess.send({purpose: 'clearLogHistory'}));
});

http.listen(80, err => {
    if(err) console.log(err);
    else {
        console.log('Open http://localhost in your browser');
        open("http://localhost:80");
    }
});