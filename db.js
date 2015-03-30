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

// initialize whenever require()'d
var migrations_dirpath = path.join(__dirname, 'migrations');
db.executePatches('_migrations', migrations_dirpath, function(err, filenames_applied) {
  if (err) {
    logger.error('Encountered error while initializing: %s', err);
    return process.exit(1);
  }

  logger.debug('Finished initializing; applied patches: %s', filenames_applied.length ? filenames_applied.join(' ') : '(none)');
});
