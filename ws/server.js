const path = require('path');
module.exports = {
    app: require('express')(),
    server: require('http').Server(module.exports.app),
    uuid: require('uuid/v4'),
    mcSocket: null,
    pluginPacks: [],
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
            
            if(cmd.startsWith("__") && cmd.endsWith("__")) {

                module.exports.pluginPacks.forEach(pack => {
                    const packFunctions = Object.keys(pack);
    
                    if(packFunctions.includes(cmd)) pack[cmd]();
                });

            } else {

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
                
            }

        } else module.exports.universalEmitter.emit('noClient');
    },
    stop: () => { 

        module.exports.pluginPacks.forEach(pack => {
            pack.__disconnect ? pack.__disconnect() : null;
        });

        module.exports.wss.close();
        module.exports.server.close();
        module.exports.log('Server successfully closed');
    },
    start: () => {
        "use strict";

        module.exports.pluginPacks = [];

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

        let files = fs.readdirSync(path.join(__dirname, '../plugins'));
        files.forEach(file => {
            if(file.endsWith('.js')) {
                module.exports.pluginPacks.push(require(`../plugins/${file}`));
            }
        });

        module.exports.wss = new WebSocket.Server({server: module.exports.server});
        
        module.exports.wss.on('listening', () => {
            module.exports.log('Server is running, connect to it with: /connect localhost:19131');
            module.exports.log(`Loaded ${module.exports.pluginPacks.length } plugins`);
        });

        module.exports.wss.on('connection', socket => {
            module.exports.mcSocket = socket;

            // Subscribe to events listed in function packs

            module.exports.pluginPacks.forEach(pack => {
                delete pack.log;
                delete pack.config;
                delete pack.send;

                

                let eventFuncs = Object.keys(pack);
                eventFuncs.forEach(eventFunc => socket.send(subscribeEvent(eventFunc)));

                pack.__connect ? pack.__connect() : null;
            });

            socket.on('message', packet => {
                const res = JSON.parse(packet);
                module.exports.pluginPacks.forEach(pack => {
                    delete pack.log;
                    delete pack.send;

                    let funcs = Object.keys(pack);
                    let funcIndex = funcs.indexOf(res.body.eventName);
                    funcIndex >= 0 && !funcs[funcIndex].startsWith("__") ? pack[res.body.eventName](res.body) : null;
                });
            });
        });

        module.exports.server.listen(19131, () => {
            setTimeout(() => {
                module.exports.pluginPacks.forEach(pack => {
                    const setGlobals = () => {
                        global.console.log = module.exports.log;
                        global.send = module.exports.runCMD;
                        global.loadDependency = dependency => require(path.join(__dirname, '../dependencies/', dependency));
                    };
                    pack.setGlobals = setGlobals;
                    pack.setGlobals();
                    delete pack.setGlobals;

                    pack.__init ? pack.__init() : null;
                });
            }, 500);
        });
    }
}