process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');     

let wsProcess;

function checkFunctions() {
    const functions = fs.readdirSync(path.join(__dirname, '/functions'));
    let funcPacks = [];
    let skippedPacks = 0;
    functions.forEach(file => {
        let funcManifest = require(path.join(__dirname, '/functions/', file)).manifest;
        funcManifest.pack_file = file;
        if(funcManifest) funcPacks.push(funcManifest);
        else skippedPacks++;
    });
    return {packs: funcPacks, skippedPacks: skippedPacks};
}

if(process.argv[2] === 'ui') {

    wsProcess = childProcess.fork(path.join(__dirname, '/ws/childProcess.js'));

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
            else {
                wsProcess.send({purpose: 'stopServer', process: wsProcess});
            }
        });

        socket.on('detectInstalledPacks', () => {
            const funcs = checkFunctions();

            if(funcs.skippedPacks > 0) socket.emit({message: `Skipped ${funcs.skippedPacks} of the ${funcs.packs.length} function ${funcs.skippedPacks > 1 ? "packs" : "pack"}`});
            socket.emit("displayInstalledPacks", {packs: funcs.packs});
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
        }
    });

}

else if(process.argv[2] === 'ls') {
    const functions = checkFunctions();
    if(functions.packs.length === 0) console.log("There are no functions installed");
    else {
        console.log(`There ${functions.packs.length > 1 ? "are" : "is"} ${functions.packs.length} function${functions.packs.length > 1 ? 's': ''} installed`);

        functions.packs.forEach(pack => {
            console.log(`- ${pack.name} - v${pack.version.join(".")}`);
        });
    }
}