const base = {
  name: 'string',
  message: 'string',
  description: 'string',
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
  },
  INPUT: {
    ...base,
    inputType: INPUT_TYPES.scalar,
  },
  PASSWORD: {
    ...base,
    inputType: INPUT_TYPES.password,
  },
  ONE_OF: {
    ...base,
    inputType: 'scalar',
  },
  ANY_OF: {
    ...base,
    inputType: INPUT_TYPES.variadicString,
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
