const events = require('events');
const emitter = new events.EventEmitter();

let client;

module.exports = {
    manifest: {
        name: "Discord Chat",
        description: "Connects a Discord channel to Minecraft chat",
        thumbnail: 'https://cdn.discordapp.com/avatars/616703819514118154/05a0888fdfa565853cec2b26618cf4b8.png?size=128',
        dependencies: ['discord.js'],
        version: [1,0,0],
        author: "RadiatedMonkey"
    },

    __config: {
        token: '<bot token>',
        channelIDs: ['<channel id>'],
        username: '<bot username>'
    },

    __connect: () => {
        const Discord = require('discord.js');
        client = new Discord.Client();

        let channels = [];

        client.on('ready', () => {
            module.exports.__config.channelIDs.forEach(id => {
                channels.push(client.channels.get(id));
            });

            console.log(`${client.user.username} is ready`);
            send('tellraw @s {"rawtext":["text": "Discord Chat is Ready"]}');
        });

        client.on('message', msg => {
            if(msg.author.tag !== module.exports.__config.username && module.exports.__config.channelIDs.includes(msg.channel.id)) send(`tellraw @a {"rawtext":[{"text": "<${msg.author.tag}> ${msg.content}"}]}`)
        });

        emitter.on("fromMC", msg => {
            channels.forEach(chatChannel => {
                chatChannel.send(`<${msg.sender}> ${msg.content}`);
            });
        });

        console.log("Starting bot...");
        client.login(module.exports.__config.token);
    },

    __disconnect: () => {
        if(client) {
            client.removeAllListeners();
            client = null;
            console.log("Client disconnected, the bot server has been closed");
        }
    },

    PlayerMessage: res => {
        if(res.properties.Sender !== 'External' && res.properties.MessageType === 'chat') {
            emitter.emit("fromMC", {sender: res.properties.Sender, content: res.properties.Message});
        }
    }
}