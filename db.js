/*jslint node: true */
var path = require('path');
var logger = require('loge');
var sqlcmd = require('sqlcmd-sqlite3');

var db = module.exports = new sqlcmd.Connection({
  filename: path.join(__dirname, 'ritual.db'),
});

// connect logger to print db log events
db.on('log', function(ev) {
  var args = [ev.format].concat(ev.args);
  logger[ev.level].apply(logger, args);
});
