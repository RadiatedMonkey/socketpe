const fs = require('fs');

const loadAnimation = {
    P: ['\\', '|', '/', '-'],
    x: 0
};
const waitingForConfig = () => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(loadAnimation.P[loadAnimation.x++]);
    loadAnimation.x &= 3;
    setTimeout(waitingForConfig, 100);
}

process.title = 'SocketPE v0.2.0 - By RadiatedMonkey';

// process.on('uncaughtException', err => {
//     fs.appendFileSync('errors.log', `[${new Date().toLocaleDateString()}: ${new Date().toLocaleTimeString()}] ${err}\n`);
//     console.log('Exception occurred, logged in errors.log');
// });

    if(fs.existsSync('node_modules')) {
        require('./server').startServer();
    } else {
        console.log('Folder node_modules not found, please download SocketPE again and make sure node_modules exists\n');
        fs.appendFileSync('errors.log', `[${new Date().toLocaleDateString()}: ${new Date().toLocaleTimeString()}] node_modules not found\n`);
        waitingForConfig();
    }