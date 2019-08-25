module.exports = { // Export startServer function so it can be used in other scripts (index.js)
    startServer: () => {
        "use strict";

        console.log('\n');

        const WebSocket = require('ws');
        const app = require('express')();
        const server = require('http').Server(app);      // Requires
        const uuid = require('uuid/v4');
        const fs = require('fs');
        const path = require('path');
        const convert = require('./convert');
        
        let serverStarted = false;                      // Special variables
        let config;

        let tempBlocks = {};
        let currentCoords = {};                          // Global variables
        let coordHistory = {};
        let commandSender;
        let customFunctions = [];
        let totalCopyBlocks = {};
        let showProgress = {};

        if(fs.existsSync('./config.json')) {
            let cConfig = fs.readFileSync('./config.json');
            config = JSON.parse(fs.readFileSync('config.json'));
            if(!config.model_dir) {
                console.log(`Missing model_dir option in config.json, using ${__dirname}/models`);
                cConfig.model_dir = `${__dirname}/models`;
                fs.writeFile('config.json', JSON.stringify(cConfig), err => {
                    if(err) console.log(err);
                });
                config = cConfig;
            } else if(config.model_dir === '*') config.model_dir = __dirname + '/models';
        
            if(!config.command_prefix) config.command_prefix = '!';
            if(!config.place_delay) config.place_delay = 20;
            if(!config.copy_delay) config.copy_delay = 25;
        
            if(config.custom_functions) {
                config.custom_functions.forEach(item => {
                    customFunctions.push(require(process.cwd() + "/" + item));
                });
            }
            if(config.enable_viewer) {
                require('./model-viewer').startServer();
            }

            function subscribeChat() {
                return JSON.stringify({
                    "body": {
                        "eventName": "PlayerMessage"
                    },
                    "header": {
                        "requestId": uuid(), // UUID
                        "messagePurpose": "subscribe",
                        "version": 1,
                        "messageType": "commandRequest"
                    }
                });
            }
    
            function create3DCoords(w, h, l) {
                let tempCoords = [];
                for(let xr = 0; xr < w + 1; xr++) {
                    for(let yr = 0; yr < h + 1; yr++) {
                        for(let zr = 0; zr < l + 1; zr++) {  // Create an array of coordinates with the given width, height and length
                            tempCoords.push([xr, yr, zr]);
                        }
                    }
                }
                return tempCoords;
            }

            let serverLoad = {
                P: ['\\', '|', '/', '-'],
                x: 0
            };
            function serverStarting() {
                if(!serverStarted) {
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write("Starting SocketPE server " + serverLoad.P[serverLoad.x++]);
                    serverLoad.x &= 3;
                    setTimeout(serverStarting, 100);
                }
            }
            serverStarting();
            
            const wss = new WebSocket.Server({server});
    
            wss.on('connection', (socket, req) => {

                function sendCMD(cmd) {
                    socket.send(JSON.stringify({
                        "body": {
                            "origin": {
                                "type": "player"
                            },
                            "commandLine": cmd,
                            "version": 1
                        },
                        "header": {
                            "requestId": uuid(),
                            "messagePurpose": "commandRequest",
                            "version": 1,
                            "messageType": "commandRequest"
                        }
                    }));
                }

                console.log('Connection requested');
                if(config.trusted_ips) {
                    if(config.trusted_ips.some(function(ip) {
                        return ip === req.connection.remoteAddress;
                    })) {
                        console.log('Connection accepted');
                    } else {
                        console.log(`Connection refused (IP: ${req.connection.remoteAddress})`);
                        setTimeout(function() {
                            socket.close();
                        }, 250);
                    }
                } else {
                    console.log('Connection accepted');
                }
    
                socket.send(subscribeChat());
    
                socket.on('message', packet => {
                    const res = JSON.parse(packet);
    
                    if(res.body.statusMessage) {
                        if(/(Syntax error: |Too many)/g.test(res.body.statusMessage)) {
                            console.log(`[${new Date().toTimeString()}] ${res.body.statusMessage}`); // Log any errors or warnings send by Minecraft to the console
                            sendCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"${res.body.statusMessage}"}]}`)
                        }
                        if(res.body.statusMessage.includes("(expected: ")) {
                            
                            let tempBlockName = res.body.statusMessage.replace(/(The block at|\(expected: .{1,}\)| is )/g, "");
                            tempBlockName = tempBlockName.split(",");
                            tempBlockName = tempBlockName[tempBlockName.length - 1].replace(" .", "").replace(/[0-9-]{1,}/g, "");
                            tempBlockName = tempBlockName.toLowerCase().replace(/ /g, "_"); 

                            if(tempBlockName !== 'air') {
                                tempBlocks[commandSender].push({                // Add block to model array if not air
                                    n: tempBlockName,
                                    i: 0,
                                    c: coordHistory[commandSender][currentCoords[commandSender]]
                                });
                            }

                            let copyProgress = Math.round(((currentCoords[commandSender] / totalCopyBlocks[commandSender]) * 100) / 4);
                            if(copyProgress === 25) {
                                sendCMD(`title @s actionbar <▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋> Done`);
                                showProgress[commandSender] = false;
                            } else if(showProgress) {
                                let progressBar = '▋'.repeat(copyProgress) + '. '.repeat(25 - copyProgress < 0 ? 0 : 25 - copyProgress);
                                sendCMD(`title @s actionbar <${progressBar}> ${copyProgress * 4} percent`);
                                currentCoords[commandSender]++;
                            }
                        }
                    }
    
                    if (res.header.messagePurpose === 'event' && res.body.properties.Sender !== 'External') {
                        if(res.body.eventName === 'PlayerMessage') {
    
                            customFunctions.forEach(item => {
                                Object.keys(item).forEach(func => {
                                    if(func === res.body.properties.Message.split(" ")[0].replace(config.command_prefix, "")) item[func](res.body, sendCMD, config);
                                });
                            });
                            
                            let cmds = {
                                copy: copyArea,
                                export: exportModel,
                                import: importModel,
                                set: setArea
                            };

                            Object.keys(cmds).forEach(item => {
                                if(res.body.properties.Message.startsWith(`!${item}`)) cmds[item]();
                            });
                        }
                    }





                    // Functions
    
                    function copyArea() {

                        let width = Number(res.body.properties.Message.split(" ").slice(1)[0]);
                        let height = Number(res.body.properties.Message.split(" ").slice(1)[1]);
                        let length = Number(res.body.properties.Message.split(" ").slice(1)[2])
                        
                        showProgress[commandSender] = true;
                        currentCoords[commandSender] = 0;
                        let coords = create3DCoords(width, height, length);
                        totalCopyBlocks[commandSender] = (width + 1) * (height + 1) * (length + 1) - 2;
                        coordHistory[commandSender] = [];
                        tempBlocks[commandSender] = [];

                        function readBlocks() {
                            let coordIdx = 0;
                            function read() {
                                setTimeout(function() {
                                    let cCrds = coords[coordIdx];  //Execute testforblock command for every coordinate in the coordinates array
                                    coordHistory[commandSender].push(cCrds);
                                    sendCMD(`testforblock ~${cCrds[0]} ~${cCrds[1]} ~${cCrds[2]} sponge 15`);
                                    coordIdx++;
                                    if(coordIdx < coords.length -1) read();
                                }, config.copy_delay);
                            }
                            read();
                        }
                        readBlocks();
                    }



                    //Exporting copied areas to files
    
                    function exportModel() {
                        let model = res.body.properties.Message.split(' ')[1]; // Write model to file
                        fs.writeFile(`${config.model_dir}/${model}.json`, JSON.stringify(convert.convertDataValues(tempBlocks[commandSender])), function(err) {
                            if(err) {
                                sendCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"An error occurred try to save the model: ${err}"}]}`);
                            } else {
                                sendCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"Exported to ${config.model_dir}/${model}.json"}]}`);
                            }
                        
                        });
                        tempBlocks[commandSender] = [];
                    }



                    // Loading models
    
                    function importModel() {
                        let modelName = res.body.properties.Message.split(" ")[1];
    
                        if(fs.existsSync(path.join(`${config.model_dir}/${modelName}.json`))) { // If models exists, load and place model
                            let modelJSON = JSON.parse(fs.readFileSync(`${config.model_dir}/${modelName}.json`), 'utf8');
                            function placeBlock(idx) {
                                setTimeout(function() {
                                    let item = modelJSON[idx];
                                    sendCMD(`setblock ~${item.c[0]} ~${item.c[1]} ~${item.c[2]} ${item.n} ${item.i ? item.i : 0}`);
    
                                    if(idx < modelJSON.length - 1) {
                                        placeBlock(idx + 1);
                                    }
                                }, config.place_delay);
                            }
                            placeBlock(0);
                        } else {
                            sendCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"${modelName} does not exist in ${config.model_dir}"}]}`);
                        }
                    }



                    // Paste copied area

                    function pasteArea() {

                    }




                    // Filling area
    
                    function setArea() {
    
                        const allParams = res.body.properties.Message;
                        params = allParams.replace(`${config.command_prefix}set `, '').split(' ');
                        let coords = params.slice(0, 3).map(Number);            // Parse input
                        let coordsLength = coords.reduce((a, b) => a *= b);
    
                        if(config.fill_limit) {
                            if(coordsLength > config.fill_limit) {
                                sendCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"You are trying to place more blocks than the fill limit set in config.json (${coords[0] * coords[1] * coords[2]} > ${config.fill_limit})"}]}`);
                            } else execSetArea();
                        } else execSetArea();
                        
                        function execSetArea() {
    
                            let blocks = params[params.length - 1]; 
                            blocks = blocks.split(",");                      // Parse input : Blocks = block names, blockCounts = how many times the block should be placed
    
                            let coordArray = create3DCoords(coords[0] - 1, coords[1] - 1, coords[2] - 1); //Create an array of coordinates
                            let blockArray = [];
                            let blockPercs = [];
                            let blockCounts = [];
    
                            blocks.forEach(item => {
                                blockPercs.push([Number(item.split("%")[0]), item.split("%")[1]]);
                            }); //Get the percentages of the blocks
    
                            let totalBlockPercs = 0;
                            blockPercs.forEach(item => {
                                totalBlockPercs += item[0];
                            });
    
                            if(totalBlockPercs !== 100) { // Check if block percentages add up to 100%
                                sendCMD(`tellraw \"${commandSender}\" {"rawtext":[{"text":"Invalid block value, block percentages do not add up to 100%"}]}`);
                            } else {
                                blockPercs.forEach(item => {
                                    blockCounts.push([coordArray.length * (item[0] / 100), item[1]]);
                                }); // Convert the percentage to an amount of coordinates
    
                                // Create array of block names to iterate over together with coordinates
    
                                blockCounts.forEach(item => {
                                    for(let i = 0; i < item[0]; i++) {
                                        blockArray.push(item[1])
                                    }
                                });
    
                                function shuffle(array) {
                                    let currentIndex = array.length, temporaryValue, randomIndex;
                                    while (currentIndex !== 0) {
                                      randomIndex = Math.floor(Math.random() * currentIndex);
                                      currentIndex -= 1;
                                      temporaryValue = array[currentIndex];
                                      array[currentIndex] = array[randomIndex];
                                      array[randomIndex] = temporaryValue;
                                    }
                                    return array;
                                }
    
                                blockArray = shuffle(blockArray);
    
                                function placeBlock(idx) {
    
                                    setTimeout(function() {
                                        const cCoords = coordArray[idx];
                                        const item = blockArray[idx];
                                        let fillProgress = Math.round((idx / (coordArray.length - 1) * 100) / 4);
                                        let progressBar = '▋'.repeat(fillProgress) + '. '.repeat(25 - fillProgress < 0 ? 0 : 25 - fillProgress);

                                        if(fillProgress * 4 === 100) sendCMD(`title @s actionbar <▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋▋> Done`);
                                        else sendCMD(`title @s actionbar <${progressBar}> ${fillProgress * 4} percent`);
                                        
                                        sendCMD(`execute \"${commandSender}\" ~~~ setblock ~${cCoords[0] + 1}~${cCoords[1] - 1}~${cCoords[2]} ${item}`);
    
                                        if(idx < blockArray.length - 2) {placeBlock(++idx);}
                                    }, config.place_delay);
                                }
                                placeBlock(0);
                            }
                        }
                    }

                    // New function here

                });
            });
    
            server.listen(19131, () => {
                setTimeout(function() {
                    serverStarted = true;
                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write('Server listening on port 19131\n');
                    console.log('Connect to the server with: /connect localhost:19131');
                    if(customFunctions.length > 0) console.log('\nStarting custom functions\n');
                    customFunctions.forEach(item => {
                        if(item.__init__) item.__init__();
                    });
                }, 500);
            });

        } else {
            console.log('Could not find config.json, please create it and restart the program');
            setInterval(function() {});
        }
    }
}
