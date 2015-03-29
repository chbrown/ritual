var path = require('path');
var logger = require('loge');

var db = require('./db');

var migrations_dirpath = path.join(__dirname, 'migrations');
db.executePatches('_migrations', migrations_dirpath, function(err, filenames_applied) {
  if (err) {
    logger.error('Encountered error while initializing: %s', err);
    return process.exit(1);
  }

  logger.info('Finished initializing');
  logger.debug('Applied patches: %s', filenames_applied.length ? filenames_applied.join(' ') : '(none)');
  process.exit(0);
});
