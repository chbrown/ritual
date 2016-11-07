# ritual

Database and API for enhancing command line history, common paths and files, and clipboard handling.


## Installation

The server is configured via environment variables.

* `RITUAL_PORT`: set this to the TCP port you want to listen on.
  - Defaults to 7483 ("RITE" on a telephone's keypad).
* `RITUAL_VERBOSE`: set this to '1' (or anything except the empty string) to increase the logging threshold to 'debug'.
  - Defaults to 'info'.
* `RITUAL_HOST`: set this to the IPv4 address to listen on.
  - Defaults to '127.0.0.1'.

Load bash integration by putting the following in your `~/.bashrc` or somewhere:

    source ~/github/ritual/install/ritual.bash

Run at load:

    cp install/github.chbrown.ritual.plist ~/Library/LaunchAgents/github.chbrown.ritual.plist
    launchctl load ~/Library/LaunchAgents/github.chbrown.ritual.plist

When running under `launchctl`, there are two useful commands:

To kill the ritual server process until the next system boot:

    launchctl remove github.chbrown.ritual

To restart it:

    launchctl stop github.chbrown.ritual

Calling `stop` kills the current process, but `launchd` will immediately restart it since the `launchd` config file, `github.chbrown.ritual.plist`, has `KeepAlive` set to `true`.


## IPC

I've chosen TCP for inter-process communication. Linux supports [IPC](http://www.tldp.org/LDP/tlk/ipc/ipc.html) [message queues](http://www.cs.cf.ac.uk/Dave/C/node25.html) at some level, but there doesn't appear to be a trivial way to add messages to the queue via the command line.

Meanwhile, bash makes TCP requests easy with its `echo 'hello' > /dev/tcp/<host>/<port>` syntax.

The Ritual TCP server is obligated to return one (new)line for every line that it receives. If it does not, the client may hang, waiting for a response.


## Ideas / TODO

* Maybe load top 10 paths into `$CDPATH`?
* Smarter path selection (right now it only selects the most recent exact match)
  - Exclude current path from candidates
  - Weight directories that have been recently used higher
  - Weight directories that have been frequently used higher
* Add weight for directories successfully fetched with `j` or, more generally, `get_directory`.
* Add clipboard watching
* Add shell history watching
* Prune directories that don't exist, or maybe just skip them in case they are mounted directories that may exist again.
* There are a lot of good ideas on the [iTerm2 shell integration page](http://iterm2.com/shell_integration.html) which seem to me like overkill for a terminal GUI, and much more suited to a third party service (like ritual).
* Maybe use a [coproc](http://www.gnu.org/software/bash/manual/bashref.html#Coprocesses) in the shell script instead of kicking off a new subshell whenever the bash user enters a ritual command?


## Examples

Want to grab the matching directories for several queries at once?

    echo $'q\ntmp\nmovies\nnode' |\
      sv --json |\
      jq -c '{action: "get_directory", q: .q}' |\
      ritual_tcp


## Autojump import

    cat <(echo $'score\tpath') <(sort -g ~/.local/share/autojump/autojump.txt) |\
      sv --json |\
      jq -c '{action: "add_scored_directory", score: .score | tonumber, path: .path}' |\
      ritual_tcp


## License

Copyright 2015-2016 Christopher Brown. [MIT Licensed](https://chbrown.github.io/licenses/MIT/#2015-2016).
