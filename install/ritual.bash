# >(logger -t ritual) generates a writable file descriptor that represents syslog
# /dev/fd/9 : write-only syslog link
exec 9> >(logger -t ritual)

function ritual_add_pwd {
  # the stderr redirection must occur before the specially-handled /dev/tcp/ device
  echo '{"action":"add_directory","path":"'$(pwd)'"}' 2>&9 1>/dev/tcp/127.0.0.1/$RITUAL_PORT
}
function j {
  # /dev/fd/3 : read/write ritual link
  exec 3<>/dev/tcp/127.0.0.1/$RITUAL_PORT
  echo '{"action":"get_directory","q":"'$@'"}' 2>&9 1>&3
  DIRECTORY=$(cat <&3)
  exec 3>&- # even though the ritual server closes the socket, bash doesn't.
  cd "$DIRECTORY"
}

PROMPT_COMMAND="ritual_add_pwd"
