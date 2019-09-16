const path = require('path');
module.exports = {
    app: require('express')(),
    server: require('http').Server(module.exports.app),
    //uuid: require(path.join(__dirname, '../node_modules/uuid')).v4,
    uuid: require('uuid/v4'),
    mcSocket: null,
    functionPacks: [],
    listenedEvents: {},
    universalEmitter: require('../common').universalEmitter,
    log: msg => {

        if(typeof msg === 'object') {
            msg = JSON.stringify(msg, null, 4).replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
        }
        module.exports.universalEmitter.emit('log', msg);
        module.exports.logHistory.push(msg);
    },
    runCMD: cmd => {
        if(module.exports.mcSocket) {
            module.exports.mcSocket.send(JSON.stringify({
                "body": {
                    "origin": {
                        "type": "player"
                    },
                    "commandLine": cmd,
                    "version": 1
                },
                "header": {
                    "requestId": module.exports.uuid(),
                    "messagePurpose": "commandRequest",
                    "version": 1,
                    "messageType": "commandRequest"
                }
            }));
        } else module.exports.universalEmitter.emit('noClient');
    },
    stop: () => { 
        module.exports.wss.close();
        module.exports.server.close();
        module.exports.log('Server successfully closed');
    },
    start: () => {
        "use strict";

        module.exports.functionPacks = [];

        const WebSocket = require('ws');      // Requires
        const fs = require('fs');
                              
        function subscribeEvent(event) {
            return JSON.stringify({
                "body": {
                    "eventName": event
                },
                "header": {
                    "requestId": module.exports.uuid(), // UUID
                    "messagePurpose": "subscribe",
                    "version": 1,
                    "messageType": "commandRequest"
                }
            });
        }

        let files = fs.readdirSync(path.join(__dirname, '../functions'));
        files.forEach(file => {
            if(!file.endsWith('.disabled')) {
                module.exports.functionPacks.push(require(`../functions/${file}`));
            }
        });

        module.exports.wss = new WebSocket.Server({server: module.exports.server});
        
        module.exports.wss.on('listening', () => {
            module.exports.log('Server is running, connect to it with: /connect localhost:19131');

            module.exports.functionPacks.forEach(pack => {
                let tempPack = pack;
                delete tempPack.manifest; // Gets the event functions of a pack
                delete tempPack.__init__;
                delete tempPack.__connect__;
            });
            module.exports.log(`Loaded ${module.exports.functionPacks.length } function packs`);
        });

        module.exports.wss.on('connection', socket => {
            module.exports.mcSocket = socket;

            // Subscribe to events listed in function packs

            module.exports.functionPacks.forEach(pack => {
                delete pack.log;
                delete pack.config;
                delete pack.send;

                let eventFuncs = Object.keys(pack);
                eventFuncs.forEach(eventFunc => socket.send(subscribeEvent(eventFunc)));

                pack.__connect__ ? pack.__connect__() : null;
            });

            socket.on('message', packet => {
                const res = JSON.parse(packet);
                module.exports.functionPacks.forEach(pack => {
                    delete pack.log;
                    delete pack.config;
                    delete pack.send;

                    let funcs = Object.keys(pack);
                    funcs.indexOf(res.body.eventName) >= 0 ? pack[res.body.eventName](res.body) : null;
                });
            });
        });
        module.exports.server.listen(19131, () => {
            setTimeout(function() {
                module.exports.functionPacks.forEach(pack => {
                    let setGlobals = function() {
                        global.console.log = module.exports.log;
                        global.config = module.exports.config;
                        global.send = module.exports.runCMD;
                        global.loadDependency = dependency => {
                            dependency = require(path.join(__dirname, './dependencies/', dependency + dependency.endsWith('.js') ? '' : '.js'));
                            return dependency;
                        };
                    };
                    pack.setGlobals = setGlobals;
                    pack.setGlobals();
                    delete pack.setGlobals;

                    pack.__init__ ? pack.__init__() : null;
                });
            }, 500);
        });
    }
}