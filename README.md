# ritual

Database and API for enhancing command line history, common paths and files, and clipboard handling.


## Installation

Put the following in your `~/.bashrc` or something:

    export RITUAL_PORT=7483  # RITE on a telephone's keypad
    source ~/github/ritual/install/ritual.bash


## IPC

I've chosen TCP for inter-process communication. Linux supports [IPC](http://www.tldp.org/LDP/tlk/ipc/ipc.html) [message queues](http://www.cs.cf.ac.uk/Dave/C/node25.html) at some level, but there doesn't appear to be a trivial way to add messages to the queue via the command line.

Meanwhile, bash makes TCP requests easy with its `echo 'hello' > /dev/tcp/<host>/<port>` syntax.


## License

Copyright 2015 Christopher Brown. [MIT Licensed](http://opensource.org/licenses/MIT).
