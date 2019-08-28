module.exports = {
    app: require('express')(),
    server: require('http').Server(module.exports.app),
    uuid: require('uuid/v4'),
    logHistory: [],
    controlSocket: null,
    mcSocket: null,
    wssRunning: false,
    functionPacks: [],
    log: msg => {
        module.exports.controlSocket.emit("log", {message: msg});
        module.exports.logHistory.push(msg);
    },
    runCMD: cmd => {
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
    },
    stop: () => { 
        module.exports.wss.close();
        module.exports.server.close();
        module.exports.wssRunning = false;
        module.exports.logHistory = [];
        module.exports.log('Server successfully closed');
    },
    start: () => {
        "use strict";

        process.on('uncaughtException', err => {
            fs.appendFileSync('../errors.module.exports.log', `[${new Date().toLocaleDateString()}: ${new Date().toLocaleTimeString()}] ${err}\n`);
            module.exports.log(`Error occurred: ${err}`);
        });

        module.exports.functionPacks = [];

        const WebSocket = require('ws');      // Requires
        const fs = require('fs');
        const path = require('path');
                              
        function subscribeChat() {
            return JSON.stringify({
                "body": {
                    "eventName": "PlayerMessage"
                },
                "header": {
                    "requestId": module.exports.uuid(), // UUID
                    "messagePurpose": "subscribe",
                    "version": 1,
                    "messageType": "commandRequest"
                }
            });
        }

        // functionPacks should become an array of function files

        fs.readdir(path.join(__dirname, '../functions'), (err, files) => {
            if(err) module.exports.log(err);
            else {
                files.forEach(file => {
                    module.exports.functionPacks.push(require(path.join(__dirname, `../functions/${file}`)));
                });
            }
        });

        module.exports.wss = new WebSocket.Server({server: module.exports.server});
        
        module.exports.wss.on('listening', () => {
            module.exports.log('Server is running, connect to it with: /connect localhost:19131');
            module.exports.wssRunning = true;
        });

        module.exports.wss.on('connection', socket => {
            module.exports.mcSocket = socket;

            socket.send(subscribeChat());
            socket.on('message', packet => {
                const res = JSON.parse(packet);

                if(res.body.statusMessage) {
                    if(/(Syntax error: |Too many)/g.test(res.body.statusMessage)) {
                        module.exports.log(`[${new Date().toTimeString()}] ${res.body.statusMessage}`); // module.exports.log any errors or warnings send by Minecraft to the console
                        module.exports.runCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"${res.body.statusMessage}"}]}`)
                    }
                }
                if (res.header.messagePurpose === 'event' && res.body.properties.Sender !== 'External') {
                    if(res.body.eventName === 'PlayerMessage') {
                        module.exports.log(res.body.properties.Message);

                        module.exports.functionPacks.forEach(pack => {
                            // Run correct function from pack.content and set log, config and send
                        });
                    }
                }
            });
        });
        module.exports.server.listen(19131, () => {
            setTimeout(function() {
                module.exports.functionPacks.forEach(pack => {
                    pack.log = module.exports.log;
                    pack.config = module.exports.config;
                    pack.send = module.exports.runCMD;
                    pack.__init__ ? pack.__init__() : null;
                });
            }, 500);
        });
    }
}