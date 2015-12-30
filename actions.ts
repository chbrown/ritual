import {Connection} from 'sqlcmd-sqlite3';
// Connection is only used for its type; it is not instantiated

export interface Action<T> {
  (db: Connection, data: T, callback: (error: Error, line?: string) => void): void;
}

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


/**
For now, get the latest directory path that matches the given query.

TODO: Get the *best* match directory from the database, not just the most recent one.
*/
export function get_directory(db: Connection,
                              data: {q: string},
                              callback: (error: Error, directory?: string) => void) {
  db.SelectOne('directory')
  .where('path LIKE ?', `%${data.q.replace(/ /g, '%')}%`)
  .orderBy('entered DESC')
  .execute((error, row) => {
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
    if (inserts >= data.score) return callback(null, inserts.toString());

    db.Insert('directory')
    .set({path: data.path})
    .execute(error => {
      if (error) return callback(error);

      inserts++;
      setImmediate(loop);
    });
  });
}

/**
List out all directories, separated by the ':' character, with the most recent
first. Hopefully you don't have any directories containing a newline.
*/
export function get_directory_list(db: Connection,
                                   data: {},
                                   callback: (error: Error, directory_list?: string) => void) {
  db.Select('directory')
  .add('path', 'MAX(entered) AS last_entered')
  .groupBy('path')
  .orderBy('last_entered DESC')
  .execute((error, rows) => {
    if (error) return callback(error);

    callback(null, rows.map(row => row.path).join(':'));
  });
}
