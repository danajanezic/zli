import test from 'ava';
import { isNodeModule } from './parse-options.js';

test('isNodeModule identifies node modules', t => {
  t.true(isNodeModule('chalk'));
  t.true(isNodeModule('@scope/pkg'));
  t.false(isNodeModule('./local.js'));
  t.false(isNodeModule('../relative.js'));
  t.false(isNodeModule('/absolute/path.js'));
});
