const path = require('path');
const socketServer = require(path.join(__dirname, './server.js'));
const universalEmitter = require(path.join(__dirname, '../common.js')).universalEmitter;
const templates = require('../templates');
let wssRunning = false;
let logHistory = [];

universalEmitter.on('log', msg => {
    process.send({purpose: 'log', content: msg});
});

universalEmitter.on('noClient', () => {
    process.send({purpose: 'noClient'});
});

process.on('message', data => {
    switch(data.purpose) {
        case 'startServer':
            wssRunning = true;
            socketServer.start();
            break;
        case 'stopServer':
            wssRunning = false;
            socketServer.stop();
            break;
        case 'runCMD':
            socketServer.runCMD(templates(data.content));
            break;
        case 'clearLogHistory':
            socketServer.logHistory = [];
            break;
        case 'updateServerData':
            process.send({
                purpose: 'updateServerData',
                content: {
                    logHistory: logHistory,
                    wssRunning: wssRunning
                }
            });
            break;
        default:
            console.log('The main process sent an invalid message');
    }
});