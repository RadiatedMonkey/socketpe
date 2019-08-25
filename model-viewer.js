module.exports = {
    startServer: function() {
        console.log('\n');
        let viewerStarted = false;
        let serverLoad = {
            P: ['\\', '|', '/', '-'],
            x: 0
        };
        
        function serverStarting() {
            if(!viewerStarted) {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write("Starting model viewer " + serverLoad.P[serverLoad.x++]);
                serverLoad.x &= 3;
                setTimeout(serverStarting, 100);
            }
        }
        serverStarting();

        setTimeout(function() {
            const express = require('express');
            const app = express();
            const server = require('http').Server(app);

            app.use(express.static('model-viewer'));
            app.use('/models', express.static('../models'))

            server.listen(80, () => {
                viewerStarted = true;
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                console.log('Model-viewer running on port 80\nGo to http://localhost in your browser');
            });
        }, 500);
    }
}