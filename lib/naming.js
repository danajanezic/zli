import Inflect from 'i';
import { basename, extname } from 'path';

const inflect = new Inflect();

export const filenameToVariableName = str => {
  const baseName = basename(str);
  const ext = extname(baseName);
  return inflect.camelize(baseName.replace(ext, '').replace(/[-.]/gi, '_').toLowerCase(), false);
};

export const filenameToCommandName = str => {
  const baseName = basename(str);
  const ext = extname(baseName);
  return inflect.dasherize(baseName.replace(ext, '').replace(/[-.]/gi, '_').toLowerCase(), false);
};

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
