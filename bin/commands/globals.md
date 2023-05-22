# Globals
The ZLI CLI interpreter provides the following sets of globals:
- Those inherited from ZX
- Common helper functions and context variables
- Helpers namespaced to `vn` that are either less common, has a name that shouldn't pollute the global space, or both

To see a list of these globals run this command with the additional `--show` option

## Hooks
There are two kinds of hooks: _Option Hooks_ and _Runtime Hooks_.

__Option Hooks__ provide you with a function to wrap your code with so it will
only be called when specified options have been passed.
```javascript
useOpts(<callback>, ...[option names]);
```
example:
```javascript
export const OPTS = {
  name: 'example',
  description: 'an example subcommand',
  options: [{
    name: 'foo',
    description: 'do foo-ish stuff',
    type: OPTION_TYPES.BOOLEAN,
  },
  {
    name: 'bar',
    description: 'set value for bar',
    type: OPTION_TYPES.INPUT,
  }]
}

useOpts(({foo, bar}) => {
  log({foo, bar});
}, 'foo');
```
The above example if run by a user as:
```
$ ./zli example --foo --bar 'I LIKE PIZZA!'
```

Should output:
```
> { foo: true, bar: 'I LIKE PIZZA!' }
```

But the following invocation will not output anything:
```
$ ./zli example --bar 'I DO NOT LIKE PIZZA'
```

If the example hook were passed another value in args for 'bar' like:
```
useOpts(({foo, bar}) => {
  log({foo, bar});
}, 'foo', 'bar');
```
The callback code would only be executed when the user provides **both** the *foo* and
*bar* options.

To specify a callback to call when _no options_ are provided simply pass `false` as the second argument.

**Runtime Hooks** work the same way as the _option hooks_ but your callback will only
be called when one of the _runtime flags_ has been declared by the user. _Runtime Flags_ are declared by
the user with a flag provided directly after the `./zli` invocation:

```
$ ./zli --local|develop|staging|prod <subcommand> <options>
```

This flowing list of _Runtime Hooks_ should be fairly self explanatory:
```javascript
whenLocal(callback)

whenDevelop(callback)

whenStaging(callback)

whenProduction(callback)

whenNonLocal(callback)

whenPreProd(callback)
```

Under the hood they all use the hook `whenRuntime`. It is actually a curried hook so we can bind different combinations of runtimes to the functions above:
```javascript
  const whenRuntime = (...runtimes) => {
    return (callback, onDefault) => {
      const filtered = runtimes.filter(r => vn.RUNTIME_FLAGS.includes(r));
      return filtered.length ? ifFunc(callback)(filtered) : ifFunc(onDefault)();
    };
  };

  whenNonLocal = whenRuntime(RUNTIMES.DEVELOP, RUNTIMES.STAGING, RUNTIMES.PRODUCTION)
```

__If your command requires the user to specify a runtime hook__ you can specify in this in your OPTS:
```javascript
export const OPTS = {
  name: 'example',
  description: 'an example subcommand',
  requiresRunTime: {
    default: RUNTIMES.LOCAL,
  },
  options: [{
    name: 'foo',
    description: 'do foo-ish stuff',
    type: OPTION_TYPES.BOOLEAN,
  }]
}
```
The above example shows how to specify a default runtime value. If no default is provided and the user does not provide
a runtime flag the user will be notified with an error.

## Important Globals
### ARGS (object)

This variable is populated by the interpreter with the command line args that were parsed in the option parsing phase of execution. It is
very much preferred to use the hooks rather than modifying the flow of control of your
script by testing this value, but it is here should you need it.

### CMD (object)
Set by the interpreter during the option parsing phase, provides the actual CommanderJS command object for use by child scripts
