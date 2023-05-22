const base = {
  name: 'string',
  message: 'string',
  description: 'string',
  callback: 'function',
  required: false,
};

export const INPUT_TYPES = {
  variadicString: name => ({ extra: `<${name}...>` }),
  scalar: name => ({ extra: `<${name}>` }),
  password: { extra: '[password]' },
  boolean: { extra: '' },
};

export const OPTION_TYPES = {
  BOOLEAN: {
    ...base,
    inputType: INPUT_TYPES.boolean,
    promptType: 'confirm',
  },
  INPUT: {
    ...base,
    inputType: INPUT_TYPES.scalar,
    promptType: 'input',
  },
  PASSWORD: {
    ...base,
    inputType: INPUT_TYPES.password,
    promptType: 'password',
  },
  ONE_OF: {
    ...base,
    inputType: 'scalar',
    promptType: 'autocomplete',
    multiple: false,
  },
  ANY_OF: {
    ...base,
    inputType: INPUT_TYPES.variadicString,
    choices: 'variadic',
    promptType: 'autocomplete',
    multiple: true,
  },
  VARIADIC: {
    ...base,
    inputType: INPUT_TYPES.variadicString,
  },
  DOCUMENTATION: {
    ...base,
    inputType: INPUT_TYPES.boolean,
  },
};
