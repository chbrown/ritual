var net_1 = require('net');
var path_1 = require('path');
var json_1 = require('streaming/json');
var loge_1 = require('loge');
var sqlcmd_sqlite3_1 = require('sqlcmd-sqlite3');
var sql_patch_1 = require('sql-patch');
// each export from actions has the signature:
// function(db: sqlcmd.Connection, data: any, callback: (error: Error, line?: string) => void): void;
var actions = require('./actions');
function actionRouter(db, data, callback) {
    var actionFunction = actions[data.action];
    if (actionFunction === undefined) {
        return callback(new Error("no handler found for action: " + data.action));
    }
    actionFunction(db, data, callback);
}
function main() {
    // process (and other Node.js globals) should not be used outside this method
    var _a = process.env, RITUAL_HOST = _a.RITUAL_HOST, RITUAL_PORT = _a.RITUAL_PORT, RITUAL_DATABASE = _a.RITUAL_DATABASE, RITUAL_VERBOSE = _a.RITUAL_VERBOSE;
    var host = (RITUAL_HOST !== undefined) ? RITUAL_HOST : '127.0.0.1';
    var port = (RITUAL_PORT !== undefined) ? parseInt(RITUAL_PORT, 10) : 7483;
    var database = (RITUAL_DATABASE !== undefined) ? RITUAL_DATABASE : path_1.join(__dirname, '..', 'ritual.db');
    var db = new sqlcmd_sqlite3_1.Connection({ filename: database });
    // connect logger to print db log events
    db.on('log', function (ev) {
        var args = [ev.format].concat(ev.args);
        logger[ev.level].apply(logger, args);
    });
    var logger = new loge_1.Logger(process.stderr, RITUAL_VERBOSE ? loge_1.Level.debug : loge_1.Level.info);
    logger.info("initializing logger with level: " + loge_1.Level[logger.level]);
    var server = net_1.createServer(function (socket) {
        socket.pipe(new json_1.Parser())
            .on('data', function (body) {
            logger.debug('request: %j', body);
            actionRouter(db, body, function (err, result) {
                if (err) {
                    return logger.error('Encountered error: %s', err);
                }
                // logger.debug('Handler result: %j', result);
                if (socket.writable) {
                    socket.write(result + '\n');
                }
            });
        })
            .on('error', function (err) {
            logger.error('input stream error: %s', err.message);
        });
        // stream.on('end', () => {
        //   socket.end(); // unnecessary
        // });
    });
    server // hack to deal with EventEmitter#on returning `EventEmitter` instead of `this`
        .on('listening', function () {
        var _a = server.address(), address = _a.address, port = _a.port;
        logger.info("server listening on tcp://" + address + ":" + port);
    })
        .on('error', function (err) {
        logger.error('server error: %j', err);
    });
    // initialize database
    var migrations_dirpath = path_1.join(__dirname, 'migrations');
    // TODO: figure out why TypeScript doesn't think sqlcmd-sqlite3.Connection can
    // be assigned to sqlcmd.Connection.
    sql_patch_1.executePatches(db, '_migrations', migrations_dirpath, function (err, filenames_applied) {
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
