module.exports = {
    manifest: {
        name: 'Example Function Pack',
        author: 'RadiatedMonkey',
        version: [1,0,0],
        uuid: '2ea96131-50cf-4335-8d49-64553cbab9c1'
    },
    __init__: () => {
        module.exports.log('Example function initialized');
    },
    say: (res) => {
        console.log(module.exports);
        // module.exports.send(`say ${res.properties.Sender} said: ${res.properties.Message}`);
    }
}