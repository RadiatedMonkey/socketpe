process.title = 'SocketPE v0.2.0 - Created by RadiatedMonkey';

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const socketServer = require('./wsserver/server');
const fs = require('fs');
const path = require('path');

path.join(__dirname, '/node_modules');
path.join(__dirname, '/node_modules/ejs');
path.join(__dirname, '/web_static'); // Make sure PKG puts the control panel files into the exe
path.join(__dirname, '/views');

app.set('view engine', 'ejs');

app.use('/static', express.static('web_static'));

app.use('/', express.static('views/console/static'));
app.get('/', (req, res) => {
    res.render('console/index');
});

app.use('/viewer', express.static('model-viewer'));

app.use('/docs', express.static('views/docs/static'));
app.get('/docs', (req, res) => {
    res.render('docs/index');
});

io.on('connection', socket => {
    socket.on('changeState', data => {
        socketServer.controlSocket = socket;
        if(data.state) socketServer.start(socket);
        else socketServer.stop();
    });

    socket.on('detectInstalledPacks', () => {
        fs.readdir(path.join(__dirname, '/functions'), (err, files) => {
            if(err) console.log(err);
            else socket.emit('displayInstalledPacks', {packs: files});
        });
    });
});

http.listen(80, err => {
    if(err) console.log(err);
    else console.log('Open http://localhost in your browser');
});