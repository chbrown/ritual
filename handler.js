var async = require('async');
var logger = require('loge');

var db = require('./db');

var actions = {};

/** add_directory(data: {path: string},
                  callback: (error: Error, empty_result?: string))

Add a directory to the database.
*/
actions.add_directory = function(data, callback) {
  db.Insert('directory')
  .set({path: data.path})
  .execute(function(err) {
    if (err) return callback(err);

    callback(null, '');
  });
};

/** remove_directory(data: {path: string},
                     callback: (error: Error, empty_result?: string))

Removes _all_ directory entries matching the given path.
*/
actions.remove_directory = function(data, callback) {
  db.Delete('directory')
  .whereEqual({path: data.path})
  .execute(function(err) {
    if (err) return callback(err);

    callback(null, '');
  });
};


/** get_directory(data: {q: string},
                  callback: (error: Error, directory?: string))

For now, get the latest directory path that matches the given query.

TODO: Get the *best* match directory from the database, not just the most recent one.
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

/** add_scored_directory(data: {score: number, path: string},
                         callback: (error: Error, number_added?: string))

Useful for importing your directories from autojump. Simply adds N rows to the
directory table with the given path, where N is score rounded down to the
nearest integer.
*/
actions.add_scored_directory = function(data, callback) {
  var n = data.score | 0;
  async.times(n, function(i, callback) {
    db.Insert('directory')
    .set({path: data.path})
    .execute(callback);
  }, function(err) {
    callback(err, n.toString());
  });
};

/** get_directory_list(data: {},
                       callback: (error: Error, directory_list?: string))

List out all directories, separated by the ':' character, with the most recent
first. Hopefully you don't have any directories containing a newline.
*/
actions.get_directory_list = function(data, callback) {
  db.Select('directory')
  .add('path', 'MAX(entered) AS last_entered')
  .groupBy('path')
  .orderBy('last_entered DESC')
  .execute(function(err, rows) {
    if (err) return callback(err);

    var line = rows.map(function(row) { return row.path; }).join(':');
    callback(null, line);
  });
};

module.exports = function(data, callback) {
  var actionFunction = actions[data.action];
  if (!actionFunction) {
    return callback(new Error('no handler found for action: ' + data.action));
  }
  actionFunction(data, callback);
};
