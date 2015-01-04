# >(logger -t ritual) generates a writable file descriptor that represents syslog
# a space is required between the N> and >(...) syntax
exec {RITUAL_LOGGER}> >(logger -t ritual)

function ritual_tcp {
  # redirect stderr to the logger BEFORE the TCP connection happens,
  # then put it back, and close the temporary file descriptor.
  exec {ERR}>&2 2>&$RITUAL_LOGGER {RITUAL}<>/dev/tcp/127.0.0.1/$RITUAL_PORT 2>&$ERR {ERR}>&-
  if [ $? -eq 0 ]; then
    # send the request from STDIN
    cat - 2>&$RITUAL_LOGGER 1>&$RITUAL
    # send the response to STDOUT
    cat <&$RITUAL
    # even though the ritual server closes the socket, bash will just leave it
    # there hanging, so we have to close it manually.
    exec {RITUAL}>&-
  else
    echo 'could not establish TCP connection to ritual server' >&$RITUAL_LOGGER
    return 1
  fi
}

function ritual_add_pwd {
  # discard the output (there shouldn't be any)
  echo '{"action":"add_directory","path":"'$(pwd)'"}' | ritual_tcp >/dev/null
}

function j {
  # cd to the output
  cd $(echo '{"action":"get_directory","q":"'$@'"}' | ritual_tcp)
}

PROMPT_COMMAND="ritual_add_pwd"
