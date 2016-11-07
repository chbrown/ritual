"use strict";
/**
Add a directory to the database.
*/
function add_directory(db, data, callback) {
    db.Insert('directory')
        .set({ path: data.path })
        .execute(error => {
        if (error)
            return callback(error);
        callback(null, '');
    });
}
exports.add_directory = add_directory;
/**
Removes _all_ directory entries matching the given path.
*/
function remove_directory(db, data, callback) {
    db.Delete('directory')
        .whereEqual({ path: data.path })
        .execute(error => {
        if (error)
            return callback(error);
        callback(null, '');
    });
}
exports.remove_directory = remove_directory;
/**
For now, get the latest directory path that matches the given query.

TODO: Get the *best* match directory from the database, not just the most recent one.
*/
function get_directory(db, data, callback) {
    db.SelectOne('directory')
        .where('path LIKE ?', `%${data.q.replace(/ /g, '%')}%`)
        .orderBy('entered DESC')
        .execute((error, row) => {
        if (error)
            return callback(error);
        callback(null, row ? row.path : '');
    });
}
exports.get_directory = get_directory;
/**
Useful for importing your directories from autojump. Simply adds N rows to the
directory table with the given path, where N is score rounded up to the
nearest integer.
*/
function add_scored_directory(db, data, callback) {
    let inserts = 0;
    (function loop() {
        if (inserts >= data.score)
            return callback(null, inserts.toString());
        db.Insert('directory')
            .set({ path: data.path })
            .execute(error => {
            if (error)
                return callback(error);
            inserts++;
            setImmediate(loop);
        });
    });
}
exports.add_scored_directory = add_scored_directory;
/**
List out all directories, separated by the ':' character, with the most recent
first. Hopefully you don't have any directories containing a newline.
*/
function get_directory_list(db, data, callback) {
    db.Select('directory')
        .add('path', 'MAX(entered) AS last_entered')
        .groupBy('path')
        .orderBy('last_entered DESC')
        .execute((error, rows) => {
        if (error)
            return callback(error);
        callback(null, rows.map(row => row.path).join(':'));
    });
}
exports.get_directory_list = get_directory_list;
