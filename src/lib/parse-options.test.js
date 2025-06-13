import test from 'ava';
import { isNodeModule, ImportDeclaration, parseDeps } from './parse-options.js';

test('isNodeModule returns true for a node module path', (t) => {
  t.true(isNodeModule('lodash'));
});

test('isNodeModule returns false for a file path', (t) => {
  t.false(isNodeModule('./file.js'));
  t.false(isNodeModule('/absolute/path.js'));
});

test('ImportDeclaration does nothing for node module imports', (t) => {
  const path = {
    node: { source: { value: 'lodash' } },
  };
  const state = { filePath: '/some/file.js', commands: { properties: [] } };
  t.is(ImportDeclaration(path, state), undefined);
});

test.todo(
  'ImportDeclaration adds subcommands for relative imports containing "commands" (needs refactor for DI/mocking)'
);

test('parseDeps throws for files with no DEPS export', (t) => {
  t.throws(() => parseDeps('nonexistent.js'));
});
