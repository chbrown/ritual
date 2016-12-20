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
    printf 'could not establish TCP connection to ritual server'\\n >&2
    return 1
  fi
  # if we've connected successfully, send STDIN, line by line, to the RITUAL
  # server via the TCP socket file descriptor
  while read -r input; do
    printf '%s\n' "$input" >&3
    # printf 'sent %s to RITUAL'\\n "$input" >&2
    # read and send the response to STDOUT
    read -r -u 3 output
    # printf 'got response %s'\\n "$output" >&2
    printf '%s\n' "$output"
  done
  # exec {RITUAL}>&-
}

function ritual_add_pwd {
  printf '{"action":"add_directory","path":"%s"}\n' "$(pwd)" | ritual_tcp >/dev/null
}
function ritual_get_directory {
  printf '{"action":"get_directory","q":"%s"}\n' "$*" | ritual_tcp
}
function ritual_remove_directory {
  printf '{"action":"remove_directory","path":"%s"}\n' "$1" | ritual_tcp >/dev/null
}

function j {
  for i in {0..10}; do
    top_dir="$(ritual_get_directory "$@")"
    # cd to the output and return if successful
    cd "$top_dir" && return 0
    # if cd failed, remove the directory and try again
    ritual_remove_directory "$top_dir"
  done
  return 1
}

# set default RITUAL_PORT if not already set
[ -z "$RITUAL_PORT" ] && RITUAL_PORT=7483
# : ${RITUAL_PORT=7483}

# extras

# while read -r DIRECTORY; do
#   if [ ! -d "$DIRECTORY" ]; then
#     printf 'Removing missing directory: %s'\\n "$DIRECTORY"
#     printf '{"action":"remove_directory","path":"%s"}'\\n "$DIRECTORY" | ritual_tcp >/dev/null
#   fi
# done < <(printf '{"action":"get_directory_list"}'\\n | ritual_tcp | tr ':' '\n')

PROMPT_COMMAND="ritual_add_pwd"
