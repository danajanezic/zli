import test from 'ava';
import { registerGlobals, createInterpreter } from './interpreter.js';

test('registerGlobals assigns to global', (t) => {
  registerGlobals({ foo: 'bar' });
  t.is(global.foo, 'bar');
  // Clean up
  delete global.foo;
});

test('registerGlobals provides die, ifFunc, debug', (t) => {
  registerGlobals();
  t.is(typeof global.die, 'function');
  t.is(typeof global.ifFunc, 'function');
  t.is(typeof global.debug, 'function');
});

test('createInterpreter throws for missing scriptPath', (t) => {
  t.throws(() => createInterpreter(undefined, [], {}));
});

// Optionally, more tests could be added for createInterpreter, but it relies on file IO and commander setup.
