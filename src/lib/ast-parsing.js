import fs from 'fs';
import { parseModule } from 'meriyah';
import path from 'path';
import { traverse, builders, utils } from 'estree-toolkit';

/**
 * Reads and parses a JavaScript file into an AST using meriyah.
 * @param {string} filePath - The path to the JavaScript file.
 * @returns {object} The parsed AST object.
 * @throws Will log and rethrow errors if parsing fails.
 */
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
    console.error(
      chalk.red(`\n\nFAILED PARSING:`) + '\n' + chalk.yellow(`${filePath}: ` + e.message) + '\n\n'
    );
    throw e;
  }
}

const defaultParseOpts = {
  scope: true,
  validateNodes: true,
};

/**
 * Parses a JavaScript file and traverses its AST with provided visitors and state.
 * @param {string} filePath - The path to the JavaScript file.
 * @param {object} visitors - Visitor functions for AST traversal.
 * @param {object} initialState - Initial state object for traversal.
 * @param {object} [parseOpts=defaultParseOpts] - Optional parsing options.
 * @returns {object} The final state after traversal.
 */
export function parseAndTraverse(filePath, visitors, initialState, parseOpts = defaultParseOpts) {
  const state = { ...initialState, builders, utils };
  traverse(parse(filePath), { $: parseOpts, ...visitors }, state);
  delete state.builders;
  delete state.utils;
  return state;
}
