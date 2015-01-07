/*jslint node: true */
var net = require('net');
var logger = require('loge');
var streaming = require('streaming');

var handler = require('./handler');

var server = module.exports = net.createServer(function(socket) {
  var stream = socket.pipe(new streaming.json.Parser());
  stream.on('data', function(body) {
    logger.debug('request: %j', body);
    handler(body, function(err, result) {
      if (err) {
        return logger.error('Encountered error: %s', err);
      }
      logger.debug('Handler result: %s', result);
      if (socket.writable) {
        socket.end(result);
      }
    });
  });
  stream.on('error', function(err) {
    logger.error('input stream error: %s', err.message);
  });
})
.on('listening', function() {
  var address = server.address();
  console.log('server listening on tcp://%s:%d', address.address, address.port);
})
.on('error', function(err) {
  logger.error('server error: %j', err);
});

if (require.main === module) {
  server.listen(parseInt(process.env.RITUAL_PORT) || 0, process.env.RITUAL_HOST);
  logger.level = process.env.RITUAL_VERBOSE ? 'debug' : 'info';
}
