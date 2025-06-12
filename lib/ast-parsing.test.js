import fs from 'fs';
import path from 'path';
import test from 'ava';
import { parse, parseAndTraverse } from './ast-parsing.js';

const tempFilePath = path.join(process.cwd(), 'temp_test_file.js');
const tempContent = 'export const foo = 42;';

test.before(() => {
  fs.writeFileSync(tempFilePath, tempContent, 'utf8');
});

test.after(() => {
  fs.unlinkSync(tempFilePath);
});

test('parse parses a valid JS file', t => {
  const ast = parse(tempFilePath);
  t.truthy(ast.type);
  t.is(ast.type, 'Program');
});

test('parse throws for invalid file', t => {
  t.throws(() => parse('nonexistent_file.js'));
});

test('parseAndTraverse calls visitor', t => {
  let called = false;
  const visitors = {
    ExportNamedDeclaration() {
      called = true;
    },
  };
  parseAndTraverse(tempFilePath, visitors, {});
  t.true(called);
});
