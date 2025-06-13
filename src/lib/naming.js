import Inflect from 'i';
import { basename, extname } from 'path';

const inflect = new Inflect();

/**
 * Converts a filename to a camelCase variable name.
 * @param {string} str - The filename to convert.
 * @returns {string} The camelCase variable name.
 */
export const filenameToVariableName = (str) => {
  const baseName = basename(str);
  const ext = extname(baseName);
  return inflect.camelize(baseName.replace(ext, '').replace(/[-.]/gi, '_').toLowerCase(), false);
};

/**
 * Converts a filename to a dasherized command name.
 * @param {string} str - The filename to convert.
 * @returns {string} The dasherized command name.
 */
export const filenameToCommandName = (str) => {
  const baseName = basename(str);
  const ext = extname(baseName);
  return inflect.dasherize(baseName.replace(ext, '').replace(/[-.]/gi, '_').toLowerCase(), false);
};

/**
 * Determines a unique short flag letter for a command-line option.
 * @param {string} name - The option name.
 * @param {string[]} firstLetters - Array of already used short flag letters.
 * @returns {string} The selected short flag letter.
 */
export const determineShortFlagLetter = (name, firstLetters) => {
  const first = name[0];
  const lower = first === 'h' ? 'H' : first.toLowerCase();
  const upper = first.toUpperCase();

  if (!firstLetters.includes(lower)) {
    return lower;
  } else if (!firstLetters.includes(upper)) {
    return upper;
  } else if (!firstLetters.includes(name)) {
    return name;
  }

  throw Error(`All easily calculable short flags for ${name} already used!`);
};

/**
 * Creates a formatted option string for use with commander.js.
 * @param {object} option - The option definition object.
 * @param {string[]} firstLetters - Array of already used short flag letters.
 * @returns {string} The formatted option string.
 */
export const createOptionString = (option, firstLetters) => {
  const { name, type } = option;
  const { inputType } = type;
  const { extra } = typeof inputType === 'function' ? inputType(option.name) : inputType;

  const createStr = (short, long, extra) => `-${short}, --${long} ${extra}`.trim();

  if (Array.isArray(name)) {
    const [short, long] = name;
    firstLetters.push(short);
    return createStr(short, long, extra);
  }

  const firstLetter = determineShortFlagLetter(name, firstLetters);
  firstLetters.push(firstLetter);

  return createStr(firstLetter, name, extra);
};
