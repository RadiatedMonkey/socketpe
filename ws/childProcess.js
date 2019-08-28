const socketServer = require('./server');
const universalEmitter = require('../common').universalEmitter;

universalEmitter.on('log', msg => {
    process.send({purpose: 'logToConsole', content: msg});
});

process.on('message', data => {
    switch(data.purpose) {
        case 'startServer':
            socketServer.start();
            break;
        case 'stopServer':
            socketServer.stop();
            universalEmitter.emit("log", "Succesfully closed server");
            universalEmitter.removeAllListeners();
            process.send('commitSuicide');
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