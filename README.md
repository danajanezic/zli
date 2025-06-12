# ZLI 
A [Google ZX](https://github.com/google/zx) based CLI that also utilizes 
[Commander's](https://github.com/tj/commander.js/) API to provide an intuitively
organized CLI with easy to use declarative syntax. 

### !!! ONLY MJS IS SUPPORTED !!!
If your project is in common it will not work. There are no plans to support CJS as of now. 
ZLI was designed to be used in an MJS mono-repo with CJS subprojects. As CJS doesn't
support top level async/await, it is not preferable for NodeJS scripting since so much
tooling requires reaching out to the OS.

Also of note, while there probably shouldn't be any issues using this in linux, 
as of now only OS X has been tested. Support for other OS's isn't a high priority at the moment, but
we're always open to PR's for adding support.

## Motivation
ZX is a great scripting tool that has allowed our engineering team to quickly create tooling 
that can leverage our node-based ecosystem. While ZX provides some rudimentary argument
handling, it is nowhere near as rich as Commander's. Initially, we added commander to our scripts
for this, but this provided no over-arching organization, nor did it provide easy discovery of the whole
suite of scripts that had been written. ZLI was written to solve this while also providing a declarative 
syntax for describing commands, subcommands, and arguments.

## Features
ZLI, as stated above, provides a simple declarative way of describing the command hierarchy and options with
automatic built-in help output. It also provides a suite of functional hooks for handling options and environment 
flags and a suite of helpers to handle common scripting functionality.

## Getting Started

### From NPM

```
$ npm i @venicemusic/zli
```

### From Repo Clone
```
$ gh repo clone danajanezic/zli

$ cd <your project name>

$ npm i <location  you cloned zli to>
```

### Quick Install with Installer
If you prefer a single command setup you can run the provided installer script.
From your project root execute:
```
$ node <location you cloned zli to>/install.js
```
This will install all dependencies and start the configuration process.


Once installed you have to configure it:
```
$ npx zli --configure
```

The documentation will assume that you used all the default configuration values.

To see an example project that uses ZLI [go here](https://github.com/qandamedia/example-zli-project).

From there you can do the following:
```
$ ./zli --help
$ ./zli show-globals --docs
$ ./zli show-globals --list
```

## Creating Commands
Let's create a command with the following signature:`./zli secrets --fetch-all`:

First let's create a file in our command root called `secrets.js`

Inside this let's add the following:
```javascript
export const OPTS = {
    name: 'secrets',
    description: 'Commands for fetching/updating secrets from secret store'
    options: [
        {
            name: 'fetch-all',
            description: 'Fetch all secrets from store',
            type: OPTION_TYPES.BOOLEAN,
        }
    ]
}
```

This tells the ZLI interpreter the command structure we want. The interpreter
looks for exported constant object declarations named "OPTS". The key *name*
at the top level of this object tells it the command name, the *description* tells it
what to display in the help output for this command. The *options* array are all 
argument options for the command which follow the same *name/description* pattern 
but require an extra field: *type* which tells the interpreter what type of options it is.
To see available types you can check the [source code](https://github.com/qandamedia/zli/blob/master/types/index.js).

At this point we can actually now run the following: 

```
$ ./zli secrets --help

__________.____    .___
\____    /|    |   |   |
  /     / |    |   |   |
 /     /_ |    |___|   |
/_______ \|_______ \___|
        \/        \/



Usage: ZLI secrets [options]

Commands for fetching/updating secrets from secret store

Options:
  -f, --fetch-all            Fetch all secrets from store
  -h, --help                 display help for command

```

So now that we have told the interpreter what our command looks like, we probably want to be able to 
have our script actually do something when invoked. So let's now add the following to our file:

```javascript
useOpts(() => {
    echo('DO THE THING TO FETCH');
}, 'fetchAll');
```

The `useOpts` handler provides a way of scoping code to only be called when the arguments passed
as strings. Note here that Commander transforms 'fetch-all' to 'fetchAll' as the argument name. Since
ZLI is built on GoogleZX, *the entire ZX API is within the scope of your scripts*. Hence `echo` being available.

The `useOpts` handler can be nested within other `useOpts` handlers or the runtime handlers which
you can learn more about by running `$ ./zli show-globals --docs`. If you want a block of code to run
when multiple options are provided just pass each option name as a subsequent argument to the end
of *useOpts*. 

Let's now make our command require a password option to be provided:

```javascript
export const OPTS = {
    name: 'secrets',
    description: 'Commands for fetching/updating secrets from secret store',
    options: [
        {
            name: 'fetch-all',
            description: 'Fetch all secrets from store',
            type: OPTION_TYPES.BOOLEAN,
        },
        {
            name: 'password',
            description: 'Password for secret store',
            type: OPTION_TYPES.PASSWORD,
            required: true,
        }
    ]
}
```

Notice now we have two option items in our array with the new one being for a password. 
We can see here that the type is *OPTION_TYPES.PASSWORD* which tells the interpreter 
not only that the user will be providing a value, but that value should be treated as a password.
As of now there is no special treatment, but it is on the roadmap to make sure that if there is
logging of this value (like say when an error is thrown) that it is masked by default, so 
it's still worth using this type over *OPTION_TYPES.INPUT* for password values. Next 
we see that there is a new field named *required*. This tells the interpreter not to 
proceed if the user has not provided this options.

```
$ ./zli secrets --fetch-all

ERROR:

	Missing required argument(s): password

```

Now let's update our code to use the password:

```javascript
useOpts(({ password }) => {
    echo(`Authenticating with password ${password}`);
    echo('DO THE THING TO FETCH');
}, 'fetchAll', 'password');
```

So as you can see we added *password* to the args for useOpts and now our
callback function takes an argument: `({ password }) => {}`. ZLI passes all the 
arguments to the callback function's first argument as an object. If we wanted to just
scope our callback within the password and test *fetchAll* independently we could 
rewrite our usage of *useOpts* to be the following should we so choose:

```javascript
useOpts(({ password, fetchAll }) => {
    echo(`Authenticating with password ${password}`);
    
    if (fetchAll) {
        echo('DO THE THING TO FETCH');    
    }
    
}, 'password');
```

Or we could also do rewrite it like this:
```javascript
useOpts(({ password, fetchAll }) => {
    echo(`Authenticating with password ${password}`);
    
    useOpts(() => {
        echo('DO THE THING TO FETCH');
    }, 'fetchAll');
    
}, 'password');
```

It's up to you're preference. Very often the pattern we end up using is creating
functions to handle specific operations and then wire up those functions with `useOpts`.
The idea behind *useOpts* is to prevent garden path if/then code for handling all 
the possible configurations of options.

If you need to code to always run inside a command script you just write it like you
would normally:

```javascript
//ONLY CALLED when options 'fetchAll' and 'password' are present
useOpts(({ password }) => {
    echo(`Authenticating with password ${password}`);
    echo('DO THE THING TO FETCH');
}, 'fetchAll', 'password');

//Always called if no required options are defined or required options are defined and provided by user
echo(`You should see this output whether or not you provide the fetch options`);
```

```
$ ./zli secrets -p 12341234
You should see this output whether or not you provide the fetch options
```

Now it needs to be pointed out that that code *will not* be called if the password is not provided
because the interpreter will not execute your script if a required field is not provided. This hints at
the underlying design goal of *minimizing side-effects*. That is, you should be able to do *very dangerous
things in your scripts that will never run unless explicitly told to*. Implementing this goal as well
as the goal of providing simple declarative ways of describing command structure meant that
the CLI's interpreter works in two primary phases: 1. parse all the exported Opts objects to determine
command structure and which script to run, 2. evaluate script within the context provided by
the interpreter.

As a result of this two-phased execution, code *outside* of ```export const OPTS = {}``` does not run
during the first phase. This means you cannot use imports inside of it unless you use the async `import()` 
function or the `require` function provided by ZX (since ZX is within the scope of OPTS too).

### Calling Commands in Other Files

Let's say we need to call our`secrets` script from another script. ZLI provides the `withZliCmd` hook for just
this use-case. In our new script we will want to do the following:

```javascript
withZliCmd(secretsCmd => {
    // Don't hardcode passwords this is just an example
    secretsCmd({fetchAll: true, password: 1234}); 
}, 'secrets.js');
```

Like `useOpts`, `withZliCmd` takes a callback as it's first argument which when executed 
is provided the command as a function to call with the arguments you would normally pass
as cli options. The rest of the arguments to `withZliCmd` are the path to the command
you want to use. This example assumes that it is in a file that is next to 'secrets.js'.

## Debugging
If you are having trouble figuring out why commands, subcommands and/or options
aren't as expected you can run the following command to see the a representation
of the command hierarchy:

```
# ./zli --show-arg-name-map
> ZLI
----> [
  [ 'v', 'verbose' ],
  [ 'l', 'local' ],
  [ 'd', 'develop' ],
  [ 's', 'staging' ],
  [ 'p', 'prod' ]
]
ZLI > secrets
----> [ [ 'f', 'fetch-all' ], [ 'p', 'password' ] ]
ZLI > show-globals
----> [ [ 'd', 'docs' ], [ 'l', 'list' ] ]
```

## Experimental Features

### Command Tree Caching
If you're CLI grows to be many files you might find that caching the command tree
will provide a performance lift. To do so you can run:

```
$ ./zli --write-cache
```

This will create a file named `.zli.cache.js` which you'll probably want to add to your
.gitignore file because the command paths will be absolute in the file and most definitely
won't work on other computers.

If you do this, remember to run the write command any time the cli commands change
to update the cache, otherwise the CLI won't know about new commands that have
been added since the cache was last updated.

There is a known issue where multiline line backtick string literals are not serialized
properly. This is an issue with the`code-stringify` package and is the reason why
this feature is still experimental.
