const path = require('path');
const socketServer = require(path.join(__dirname, './server.js'));
const universalEmitter = require(path.join(__dirname, '../common.js')).universalEmitter;

universalEmitter.on('log', msg => {
    process.send({purpose: 'log', content: msg});
});

process.on('message', data => {
    switch(data.purpose) {
        case 'startServer':
            socketServer.start();
            break;
        case 'stopServer':
            socketServer.stop();
            break;
        case 'runCMD':
            socketServer.runCMD(data.content);
            break;
        case 'clearLogHistory':
            socketServer.logHistory = [];
            break;
        case 'updateServerData':
            process.send({
                purpose: 'updateServerData',
                content: {
                    logHistory: socketServer.logHistory,
                    wssRunning: socketServer.wssRunning
                }
            });
            break;
        default:
            console.log('Something went wrong with the communication between the main and child process');
    }
});