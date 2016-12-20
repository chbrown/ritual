"use strict";
const net_1 = require("net");
const os_1 = require("os");
const path_1 = require("path");
const json_1 = require("streaming/json");
const loge_1 = require("loge");
const sqlcmd_sqlite3_1 = require("sqlcmd-sqlite3");
const sql_patch_1 = require("sql-patch");
// each export from actions has the signature:
// function(db: sqlcmd.Connection, data: any, callback: (error: Error, line?: string) => void): void;
const actions = require("./actions");
function actionRouter(db, data, callback) {
    let actionFunction = actions[data.action];
    if (actionFunction === undefined) {
        return callback(new Error(`no handler found for action: ${data.action}`));
    }
    actionFunction(db, data, callback);
}
function main() {
    // process (and other Node.js globals) should not be used outside this method
    const { RITUAL_HOST, RITUAL_PORT, RITUAL_DATABASE, RITUAL_VERBOSE } = process.env;
    const host = (RITUAL_HOST !== undefined) ? RITUAL_HOST : '127.0.0.1';
    const port = (RITUAL_PORT !== undefined) ? parseInt(RITUAL_PORT, 10) : 7483;
    const database = (RITUAL_DATABASE !== undefined) ? RITUAL_DATABASE : path_1.join(os_1.homedir(), '.local', 'ritual.db');
    const db = new sqlcmd_sqlite3_1.Connection({ filename: database });
    // connect logger to print db log events
    db.on('log', function (ev) {
        let args = [ev.format].concat(ev.args);
        logger[ev.level].apply(logger, args);
    });
    const logger = new loge_1.Logger(process.stderr, RITUAL_VERBOSE ? loge_1.Level.debug : loge_1.Level.info);
    logger.info(`initializing logger with level: ${loge_1.Level[logger.level]}`);
    const server = net_1.createServer(socket => {
        socket.pipe(new json_1.Parser())
            .on('data', (body) => {
            logger.debug('request: %j', body);
            actionRouter(db, body, (err, result) => {
                if (err) {
                    return logger.error('Encountered error: %s', err);
                }
                // logger.debug('Handler result: %j', result);
                if (socket.writable) {
                    socket.write(result + '\n');
                }
            });
        })
            .on('error', (err) => {
            logger.error('input stream error: %s', err.message);
        });
        // stream.on('end', () => {
        //   socket.end(); // unnecessary
        // });
    });
    server // hack to deal with EventEmitter#on returning `EventEmitter` instead of `this`
        .on('listening', () => {
        const { address, port } = server.address();
        logger.info(`server listening on tcp://${address}:${port}`);
    })
        .on('error', err => {
        logger.error('server error: %j', err);
    });
    // initialize database
    const migrations_dirpath = path_1.join(__dirname, 'migrations');
    // TODO: figure out why TypeScript doesn't think sqlcmd-sqlite3.Connection can
    // be assigned to sqlcmd.Connection.
    sql_patch_1.executePatches(db, '_migrations', migrations_dirpath, (err, filenames_applied) => {
        if (err) {
            logger.error('Encountered error while initializing: %s', err);
            return process.exit(1);
        }
        logger.debug('Finished initializing; applied patches: %s', filenames_applied.length ? filenames_applied.join(' ') : '(none)');
        server.listen(port, host);
    });
}
exports.main = main;
// this adds support for the standard `npm start` script
if (require.main === module)
    main();
