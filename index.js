// const fs = require('fs');

// const loadAnimation = {
//     P: ['\\', '|', '/', '-'],
//     x: 0
// };
// const waitingForConfig = () => {
//     process.stdout.clearLine();
//     process.stdout.cursorTo(0);
//     process.stdout.write(loadAnimation.P[loadAnimation.x++]);
//     loadAnimation.x &= 3;
//     setTimeout(waitingForConfig, 100);
// }

// process.title = 'SocketPE v0.2.0 - By RadiatedMonkey';

// process.on('uncaughtException', err => {
//     fs.appendFileSync('errors.log', `[${new Date().toLocaleDateString()}: ${new Date().toLocaleTimeString()}] ${err}\n`);
//     console.log('Exception occurred, logged in errors.log');
// });

//     if(fs.existsSync('node_modules')) {
//         require('./server').startServer();
//     } else {
//         console.log('Folder node_modules not found, please download SocketPE again and make sure node_modules exists\n');
//         fs.appendFileSync('errors.log', `[${new Date().toLocaleDateString()}: ${new Date().toLocaleTimeString()}] node_modules not found\n`);
//         waitingForConfig();
//     }





process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const socketServer = require('./wsserver/server');

app.get('/', (req, res) => {
    res.redirect('/control-panel');
});

app.use('/console', express.static('web/console'));
app.use('/config', express.static('web/config'));

app.use('/viewer', express.static('model-viewer'));

io.on('connection', socket => {
    socket.emit("connected", {message: "success"}); 
 
    socket.on('changeState', data => {
        if(data.state) socketServer.start(socket);
        else socketServer.stop();
    });
});

http.listen(80, err => {
    if(err) console.log(err);
    else console.log('Go to http://localhost in your browser to start the server');
});