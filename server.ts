import {createServer} from 'net';
import {homedir} from 'os';
import {join} from 'path';
import {Parser as JSONParser} from 'streaming/json';
import {Logger, Level} from 'loge';
import {Connection} from 'sqlcmd-sqlite3';
import {executePatches} from 'sql-patch';

// each export from actions has the signature:
// function(db: sqlcmd.Connection, data: any, callback: (error: Error, line?: string) => void): void;
import * as actions from './actions';

function actionRouter(db: Connection,
                      data: {action: string},
                      callback: (error: Error, line?: string) => void) {
  let actionFunction: actions.Action<any> = actions[data.action];
  if (actionFunction === undefined) {
    return callback(new Error(`no handler found for action: ${data.action}`));
  }
  actionFunction(db, data, callback);
}

export function main() {
  // process (and other Node.js globals) should not be used outside this method
  const {RITUAL_HOST, RITUAL_PORT, RITUAL_DATABASE, RITUAL_VERBOSE} = process.env;
  const host = (RITUAL_HOST !== undefined) ? RITUAL_HOST : '127.0.0.1';
  const port = (RITUAL_PORT !== undefined) ? parseInt(RITUAL_PORT, 10) : 7483;
  const database = (RITUAL_DATABASE !== undefined) ? RITUAL_DATABASE : join(homedir(), '.local', 'ritual.db');

  const db = new Connection({filename: database});

  // connect logger to print db log events
  db.on('log', function(ev) {
    let args = [ev.format].concat(ev.args);
    logger[ev.level].apply(logger, args);
  });

  const logger = new Logger(process.stderr, RITUAL_VERBOSE ? Level.debug : Level.info);
  logger.info(`initializing logger with level: ${Level[logger.level]}`);

  const server = createServer(socket => {
    socket.pipe(new JSONParser())
    .on('data', (body: {action: string}) => {
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
    const {address, port} = server.address();
    logger.info(`server listening on tcp://${address}:${port}`);
  })
  .on('error', err => {
    logger.error('server error: %j', err);
  });

  // initialize database
  const migrations_dirpath = join(__dirname, 'migrations');
  // TODO: figure out why TypeScript doesn't think sqlcmd-sqlite3.Connection can
  // be assigned to sqlcmd.Connection.
  executePatches(<any>db, '_migrations', migrations_dirpath, (err, filenames_applied) => {
    if (err) {
      logger.error('Encountered error while initializing: %s', err);
      return process.exit(1);
    }

    logger.debug('Finished initializing; applied patches: %s',
      filenames_applied.length ? filenames_applied.join(' ') : '(none)');

    server.listen(port, host);
  });
}

// this adds support for the standard `npm start` script
if (require.main === module) {
  main();
}
