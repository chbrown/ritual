import {Connection} from 'sqlcmd-sqlite3';
// Connection is only used for its type; it is not instantiated

export interface DirectoryRow {
  path: string;
  entered: number;
}

export type Action<T> = (db: Connection, data: T, callback: (error: Error, line?: string) => void) => void;

/**
Add a directory to the database.
*/
export function add_directory(db: Connection,
                              data: {path: string},
                              callback: (error: Error, empty_result?: string) => void) {
  db.Insert('directory')
  .set({path: data.path})
  .execute(error => {
    if (error) return callback(error);

    callback(null, '');
  });
}

/**
Removes _all_ directory entries matching the given path.
*/
export function remove_directory(db: Connection,
                                 data: {path: string},
                                 callback: (error: Error, empty_result?: string) => void) {
  db.Delete('directory')
  .whereEqual({path: data.path})
  .execute(error => {
    if (error) return callback(error);

    callback(null, '');
  });
}

function prepareSearchPattern(q: string) {
  const query = '%' + q.replace(/ /g, '%');
  // special syntax: if query ends with a $, do not wildcard match on the end
  if (/\$$/.test(query)) {
    return query.replace(/\$$/, '');
  }
  else {
    return query + '%';
  }
}

/**
For now, get the latest directory path that matches the given query.

TODO: Get the *best* match directory from the database, not just the most recent one.
*/
export function get_directory(db: Connection,
                              data: {q?: string},
                              callback: (error: Error, directory?: string) => void) {
  let query = db.SelectOne('directory')
  .orderBy('entered DESC')
  if (data.q) {
    query = query.where('path LIKE ?', prepareSearchPattern(data.q))
  }
  query.execute((error, row: DirectoryRow) => {
    if (error) return callback(error);

    callback(null, row ? row.path : '');
  });
}

/**
Useful for importing your directories from autojump. Simply adds N rows to the
directory table with the given path, where N is score rounded up to the
nearest integer.
*/
export function add_scored_directory(db: Connection,
                                     data: {score: number, path: string},
                                     callback: (error: Error, number_added?: string) => void) {
  let inserts = 0;
  (function loop() {
    if (inserts >= data.score) {
      return callback(null, inserts.toString());
    }

    db.Insert('directory')
    .set({path: data.path})
    .execute(error => {
      if (error) return callback(error);

      inserts++;
      setImmediate(loop);
    });
  })();
}

/**
List out all directories, separated by the ':' character, with the most recent
first. Hopefully you don't have any directories containing a newline.
*/
export function get_directory_list(db: Connection,
                                   data: {q?: string},
                                   callback: (error: Error, directory_list?: string) => void) {
  let query = db.Select('directory')
  .add('path', 'MAX(entered) AS last_entered')
  .groupBy('path')
  .orderBy('last_entered DESC')
  if (data.q) {
    query = query.where('path LIKE ?', prepareSearchPattern(data.q))
  }
  query.execute((error, rows: {path: string, last_entered: number}[]) => {
    if (error) return callback(error);

    callback(null, rows.map(row => row.path).join(':'));
  });
}

/**
Replace the value of `from` with the value of `to` in all paths.
*/
export function replace(db: Connection,
                        data: {from: string, to: string},
                        callback: (error: Error, changes?: string) => void) {
  db.Update('directory')
  .set('path = REPLACE(path, ?, ?)', data.from, data.to)
  .where('path LIKE ?', `%${data.from}%`)
  .execute(error => {
    if (error) return callback(error);

    db.executeSQL('SELECT changes() AS changes', [], (error, rows) => {
      if (error) return callback(error);

      callback(null, rows[0].changes);
    });
  });
}
