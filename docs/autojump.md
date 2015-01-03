## Autojump issues

* Autojump pollutes the command line environment. Previously there was a script on `PATH` called `autojump`, and a helper bash function, `j`, that was loaded when sourcing the `autojump.bash` script. Now there's `jc`, `jo`, and `jco`. This is feature creep. Not a good thing.
* Autojump is slow. It kicks off a Python process whenever a new prompt is reached, i.e., whenever your bash session shows a blank prompt. Type `set -x` to show all commands that are running underneath the covers when working at your command line.
  - [#303](https://github.com/joelthelion/autojump/issues/303)
* Autojump is often backwards incompatible. Upgrading is a headache, whether via Homebrew or setuptools. It can't make up its mind where it should keep its config files.


## Benchmarking `PROMPT_COMMAND`

After initializing autojump by sourcing its `autojump.bash` file, you probably previously had a `PROMPT_COMMAND` environment variable like:

    autojump_add_to_database

Set it to the following:

    export PROMPT_COMMAND='BEFORE=`gdate +%s.%N`; autojump_add_to_database; echo `gdate +%s.%N` - $BEFORE >> /tmp/autojump.txt'

Now, spend a little time navigating around your file system, in order to gather some data, just with `cd`. Don't `autojump` around yet; the problem is not how long autojump takes when you want to use it, but how long it takes when you're just doing other stuff. Probably only 10% of your work at the command line is changing directories. My bash history says 16% or my work is, but I'm a compulsive `cd`'er:

    # calculate what fraction of your bash commands change the directory
    NMATCH=`egrep '^(cd|j) ' <~/.bash_history | wc -l`
    NTOTAL=`wc -l <~/.bash_history`
    PERCENT=`bc <<< "scale=2; 100 * $NMATCH / $NTOTAL"`
    echo "$NMATCH cd/j out of $NTOTAL = $PERCENT%"

After 20 or so directory changes, run the following to show how many seconds `autojump` consumed at each prompt:

    bc </tmp/autojump.txt

And calculate the overall mean:

    bc </tmp/autojump.txt | awk '{total += $0} END {print total / NR}'

My `autojump v21.7.1` is consuming an average of 225 milliseconds per prompt.
Based on a sample of my bash history going back a year, I type about 165 commands a day. That's 37 seconds per day of waiting for autojump.
Not acceptable.
