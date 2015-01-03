/*jslint node: true */
var logger = require('loge');
var sqlcmd = require('sqlcmd-sqlite3');

var db = module.exports = new sqlcmd.Connection({
  filename: 'ritual.db',
});

// connect logger to print db log events
db.on('log', function(ev) {
  var args = [ev.format].concat(ev.args);
  logger[ev.level].apply(logger, args);
});
