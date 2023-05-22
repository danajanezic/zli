import fs from 'fs';
import { parseModule } from 'meriyah';
import path from 'path';
import { traverse, builders, utils } from 'estree-toolkit';

export function parse(filePath) {
  try {
    const absPath = path.resolve(filePath);
    const contents = fs.readFileSync(path.resolve(absPath), 'utf8');

    return parseModule(contents, {
      next: true,
      module: true,
      specDeviation: true,
      source: true,
    });
  } catch (e) {
    console.error(chalk.red(`\n\nFAILED PARSING:`) + '\n' + chalk.yellow(`${filePath}: ` + e.message) + '\n\n');
    throw e;
  }
}

const defaultParseOpts = {
  scope: true,
  validateNodes: true,
};

export function parseAndTraverse(filePath, visitors, initialState, parseOpts = defaultParseOpts) {
  const state = { ...initialState, builders, utils };
  traverse(parse(filePath), { $: parseOpts, ...visitors }, state);
  delete state.builders;
  delete state.utils;
  return state;
}
