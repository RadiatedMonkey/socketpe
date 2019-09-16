process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');     

let wsProcess;

function checkPlugins() {
    const plugins = fs.readdirSync(path.join(__dirname, '/plugins'));
    let funcPacks = [];
    let skippedPacks = 0;
    plugins.forEach(file => {
        let funcManifest = require(path.join(__dirname, '/plugins/', file)).manifest;
        if(funcManifest) {
            funcManifest.pack_file = file;
            funcPacks.push(funcManifest);
        }
        else skippedPacks++;
    });
    return {packs: funcPacks, skippedPacks: skippedPacks};
}

function startServer() {
    wsProcess = childProcess.fork(path.join(__dirname, '/ws/childProcess.js'));

    http.listen(80, err => {
        if(err) console.log(err);
        else {
            console.log('Open http://localhost in your browser');
        }
    });
}

if(process.argv[2] === 'ui') {

    app.use('/resources', express.static('../web/resources'));
    app.use('/', express.static('../web/console'));
    app.use('/docs', express.static('../web/docs'));

    io.on('connection', socket => {   
        wsProcess.send({purpose: 'updateServerData'});

        wsProcess.on('message', data => {
            if(data.purpose === 'updateServerData') socket.emit('updateServerData', data.content);
            else if(data.purpose === 'log') socket.emit('log', {message: data.content});
            else if(data.purpose === 'noClient') socket.emit('noClient');
        });

        socket.on('changeState', data => {
            if(data.state) wsProcess.send({purpose: 'startServer'});
            else wsProcess.send({purpose: 'stopServer'});
        });

        socket.on('detectInstalledPacks', () => {
            const funcs = checkPlugins();

            if(funcs.skippedPacks > 0) socket.emit('log', {message: `${funcs.skippedPacks} plugins were not loaded because they do not have a manifest`});
            socket.emit("displayInstalledPacks", {packs: funcs.packs});
        });

        socket.on('uninstallPack', data => {
            fs.rename(path.join(__dirname, '/plugins/', data.pack_file), path.join(__dirname, '/plugins/', data.pack.file, '.disabled'), err => {
                if(err) module.exports.log(`An error occurred:<br>${err}`);
            });
        });

        socket.on('runCMD', data => wsProcess.send({purpose: 'runCMD', content: data.cmd}));
        socket.on('clearLogHistory', () => wsProcess.send({purpose: 'clearLogHistory'}));
    });

    startServer();
}

else if(process.argv[2] === 'plugins') {
    const plugins = checkPlugins();
    if(plugins.packs.length === 0) console.log("There are no plugins installed");
    else {
        console.log(`There are ${plugins.packs.length} plugins installed`);

        plugins.packs.forEach(pack => {
            console.log(`- ${pack.name} - v${pack.version.slice(0, 3).join(".")}`);
        });
    }
}