function ritual_tcp {
  # >(logger -t ritual) generates a writable file descriptor that represents
  # syslog. we'll open up the logger and redirect all STDERR to it, _before_ the
  # TCP connection happens
  #exec {STDERR}>&2 # since we only pipe to this function, it'll be in a
                    # subshell, so we don't have to worry about reseting STDERR
  exec 2>>>(logger -t ritual)
  # now try to open up the TCP connection, which may fail, but that output will
  # go to the logger
  exec {RITUAL}<>/dev/tcp/127.0.0.1/$RITUAL_PORT
  # immediately record whether that worked
  # CONNECTED=$?
  # if we connected successfully, talk to the RITUAL server
  if [ $? -eq 0 ]; then
    # send the request from STDIN to the TCP socket file descriptor
    cat - >&$RITUAL
    # send the response to STDOUT
    cat <&$RITUAL
    # even though the ritual server closes the socket, bash will just leave it
    # there hanging, so we have to close it manually.
    exec {RITUAL}>&-
  else
    echo 'could not establish TCP connection to ritual server' >&2
    false
  fi
  #exec 2>&$STDERR {STDERR}>&- # again, since we're in a subshell, we don't have
                               # to put STDERR back or close the STDERR alias
  # return $CONNECTED
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
