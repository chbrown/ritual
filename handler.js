/*jslint node: true */
var logger = require('loge');

var db = require('./db');

var actions = {};

/** add_directory(data: {path: string}, callback: (error?: Error))

Add a directory to the database.
*/
actions.add_directory = function(data, callback) {
  db.Insert('directory')
  .set({path: data.path})
  .execute(function(err) {
    if (err) return callback(err);

    callback();
  });
};

/** get_directory(data: {q: string}, callback: (error: Error, directory?: string))

For now, get the latest directory path that matches the given query.

TODO: Get the best match directory from the database.
*/
actions.get_directory = function(data, callback) {
  var path_like = '%' + data.q.replace(/ /g, '%') + '%';
  db.Select('directory')
  .where('path LIKE ?', path_like)
  .orderBy('entered DESC')
  .limit(1)
  .execute(function(err, rows) {
    if (err) return callback(err);

    callback(null, rows.length ? rows[0].path : '');
  });
};

module.exports = function(data, callback) {
  var actionFunction = actions[data.action];
  if (!actionFunction) {
    return callback(new Error('no handler found for action: ' + data.action));
  }
  actionFunction(data, callback);
};
