function ritual_tcp {
  # >(logger -t ritual) generates a writable file descriptor that represents
  # syslog. we'll open up the logger and redirect all STDERR to it, _before_ the
  # TCP connection happens
  exec 2>>>(logger -t ritual)
  # now try to open up the TCP connection, which may fail, but that output will
  # go to the logger
  exec 3<>/dev/tcp/127.0.0.1/$RITUAL_PORT
  # if we could not connect successfully, return with an error
  if [ $? -ne 0 ]; then
    echo 'could not establish TCP connection to ritual server' >&2
    return 1
  fi
  # if we've connected successfully, send STDIN, line by line, to the RITUAL
  # server via the TCP socket file descriptor
  while read -r input; do
    echo "$input" >&3
    # echo "sent $input to RITUAL" >&2
    # read and send the response to STDOUT
    read -r -u 3 output
    # echo "got response $output" >&2
    echo "$output"
  done
  # exec {RITUAL}>&-
}

function ritual_add_pwd {
  # discard the output (there shouldn't be any)
  echo '{"action":"add_directory","path":"'$(pwd)'"}' | ritual_tcp >/dev/null
}

function j {
  # cd to the output
  cd "$(echo '{"action":"get_directory","q":"'$@'"}' | ritual_tcp)"
}

# set default RITUAL_PORT if not already set
[ -z "$RITUAL_PORT" ] && RITUAL_PORT=7483
# : ${RITUAL_PORT=7483}

# extras

# while read -r DIRECTORY; do
#   if [ ! -d "$DIRECTORY" ]; then
#     echo Removing missing directory: $DIRECTORY
#     echo '{"action":"remove_directory","path":"'$DIRECTORY'"}' | ritual_tcp >/dev/null
#   fi
# done < <(echo '{"action":"get_directory_list"}' | ritual_tcp | tr ':' '\n')

PROMPT_COMMAND="ritual_add_pwd"
