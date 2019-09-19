const events = require('events');
module.exports.universalEmitter = new events.EventEmitter();
module.exports.universalEmitter.setMaxListeners(0);