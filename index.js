process.title = `SocketPE v${require('./package.json').version} - Created by RadiatedMonkey`;

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');     

const launch = require('launch-editor');

let wsProcess;

function checkPlugins() {
    const plugins = fs.readdirSync(path.join(__dirname, '/plugins'));
    let funcPacks = [];
    let skippedPacks = 0;
    plugins.forEach(file => {
        if(file.endsWith(".js")) {
            let funcManifest = require(path.join(__dirname, '/plugins/', file)).manifest;
            if(funcManifest) {
                funcManifest.pack_file = file;
                funcPacks.push(funcManifest);
            }
            else skippedPacks++;
        }
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

function handleConfig(fileName, viaControl, socket = null) {
    const file = require(path.join(__dirname, '/plugins/', fileName));
    
    if(file.__config) {

        if(!viaControl) console.log('Opening text editor...');
        launch(path.join(__dirname, '/plugins/', fileName));

    } else {
        if(viaControl) {
            socket.emit('noConfig', fileName);
        } else console.log('This plugin has no config');
    }
}

const socketFunctions = {
    changeState: data => {
        if(data.state) wsProcess.send({purpose: 'startServer'});
        else wsProcess.send({purpose: 'stopServer'});
    },

    detectInstalledPacks: socket => {
        const funcs = checkPlugins();

        if(funcs.skippedPacks > 0) socket.emit('log', {message: `${funcs.skippedPacks} plugins were skipped because they do not have a manifest`});
        socket.emit("displayInstalledPacks", {packs: funcs.packs});
    },

    openPluginsFolder: () => launch(path.join(__dirname, '/plugins')),
    runCMD: data => wsProcess.send({purpose: 'runCMD', content: data.cmd}),
    clearLogHistory: () => wsProcess.send({purpose: 'clearLogHistory'}),
    editConfig: (socket, data) => handleConfig(data.pluginName, true, socket),
    openPlugin: file => launch(path.join(__dirname, './plugins/', file))
};

if(process.argv[2] === 'ui') {

    app.use('/resources', express.static('web/resources'));
    app.use('/', express.static('web/console'));

    app.get('/search', (req, res) => {
        res.send(req.query);
    });

    let reloaded = false;
    io.on('connection', socket => {  

        if(!reloaded) 
            socket.emit("reload");
        reloaded = true;
        
        global.socketEmit = function(event, data) {
            socket.emit(event, data);
        }

        wsProcess.send({purpose: 'updateServerData'});

        wsProcess.on('message', data => {
            if(data.purpose === 'updateServerData') socket.emit('updateServerData', data.content);
            else if(data.purpose === 'log') socket.emit('log', {message: data.content});
            else if(data.purpose === 'noClient') socket.emit('noClient');
        });

        socket.on('changeState', data => socketFunctions.changeState(data));
        socket.on('detectInstalledPacks', () => socketFunctions.detectInstalledPacks(socket));
        socket.on("openPluginsFolder", () => socketFunctions.openPluginsFolder());
        socket.on('runCMD', data => socketFunctions.runCMD(data));
        socket.on('clearLogHistory', () => socketFunctions.clearLogHistory());
        socket.on('editConfig', data => socketFunctions.editConfig(socket, data));
        socket.on("openPlugin", file => socketFunctions.openPlugin(file));
    });

    startServer();
}

else if(process.argv[2] === 'plugins') {
    const plugins = checkPlugins();
    switch(process.argv[3]) {
        case undefined:
        case 'list':
            if(plugins.packs.length === 0) console.log("There are no plugins installed\n");
            else {
                console.log(`There are ${plugins.packs.length} plugins installed\n`);

                plugins.packs.forEach(pack => {
                    console.log(`- ${pack.name} - v${pack.version.slice(0, 3).join(".")}`);
                });

                console.log("\n");
            }
            break;

        case 'edit':

            fs.readdir(path.join(__dirname, '/plugins'), (err, files) => {

                let foundFile = null;

                files.forEach(file => {
                    if(file.endsWith('.js')) {
                        if(process.argv[4].endsWith('.js')) {
                            if(process.argv[4] === file) foundFile = file;
                            else console.log('Not found');
                        } else {
                            if(process.argv[4] + '.js' === file) foundFile = file;
                            if(require(path.join(__dirname, '/plugins/', file)).manifest.name.toLowerCase() === process.argv[4].toLowerCase()) foundFile = file;
                        }
                    }
                });

                if(!foundFile) console.log('Plugin not found\n');
                else handleConfig(foundFile, false);
            });

            break;

        default:
            console.log(`Invalid argument: ${process.argv[3]}\n`);
    }
} else console.log(`Invalid argument: ${process.argv[2]}\n`)