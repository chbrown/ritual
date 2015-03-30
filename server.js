var net = require('net');
var logger = require('loge');
var streaming = require('streaming');

var handler = require('./handler');

module.exports = net.createServer(function(socket) {
  var stream = socket.pipe(new streaming.json.Parser());
  stream.on('data', function(body) {
    logger.debug('request: %j', body);
    handler(body, function(err, result) {
      if (err) {
        return logger.error('Encountered error: %s', err);
      }
      // logger.debug('Handler result: %j', result);
      if (socket.writable) {
        socket.write(result + '\n');
      }
    });
  });
  stream.on('error', function(err) {
    logger.error('input stream error: %s', err.message);
  });
  // stream.on('end', function() {
  //   socket.end(); // unnecessary
  // });
})
.on('listening', function() {
  var address = this.address();
  logger.info('server listening on tcp://%s:%d', address.address, address.port);
})
.on('error', function(err) {
  logger.error('server error: %j', err);
});
