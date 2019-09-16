module.exports = {
    manifest: {
        name: 'Example Plugin',
        author: 'RadiatedMonkey',
        version: [1,0,0],
        uuid: '9bbe495c-92af-4aa9-982f-2472b3d3bc53'
    },
    __init__: () => {
        console.log(global);
    },
    __connect__: () => {
        send('tellraw @s {"rawtext":[{"text": "Connected to server"}]}');
    },
    PlayerMessage: res => {
        if(res.properties.Sender !== 'External') {
            console.log(`${res.properties.Sender}: ${res.properties.Message}`);
        }
    }
}