const fs = require('fs');

module.exports = {
    manifest: {
        name: "Chat To File",
        description: "This simple plugin writes every chat message to chat.txt",
        thumbnail: "https://raw.githubusercontent.com/RadiatedMonkey/socketpe-marketplace/master/plugins/chat2file/thumbnail.png",
        author: "RadiatedMonkey",
        version: [1,0,0],
        uuid: "f42fcdb3-f51a-4317-a1ba-7b7708945a90"
    },

    PlayerMessage: res => fs.appendFileSync("../chat.txt", `(${new Date().toLocaleString()}) ${res.properties.Sender}: ${res.properties.Message}\n`)
};