#! _z.js
import escodegen from 'escodegen';
import { parseAndTraverse } from './ast-parsing.js';

/**
 * Checks if a file path refers to a Node.js module.
 * @param {string} filePath - The file path to check.
 * @returns {boolean} True if the path is a Node.js module, false otherwise.
 */
export const isNodeModule = (filePath) => {
  const match = filePath.match(/$\.|\//);
  return match === null;
};

/**
 * Creates an ESTree ObjectExpression node.
 * @param {object[]} [properties=[]] - Properties to include in the object expression.
 * @returns {object} ESTree ObjectExpression node.
 */
const OBJECT_EXPRESSION = (properties = []) => ({
  type: 'ObjectExpression',
  properties,
});

/**
 * Creates an ESTree Property node.
 * @param {string} name - Property name.
 * @param {object} value - Property value node.
 * @returns {object} ESTree Property node.
 */
const createProperty = (name, value) => {
  return {
    type: 'Property',
    key: {
      type: 'Identifier',
      name,
    },
    value,
    kind: 'init',
    computed: false,
    method: false,
    shorthand: false,
  };
};

/**
 * Creates an ESTree ArrayExpression node.
 * @param {object[]} elements - Elements of the array expression.
 * @returns {object} ESTree ArrayExpression node.
 */
const createArrayExpression = (elements) => {
  return {
    type: 'ArrayExpression',
    elements,
  };
};

// IN PROGRESS
/**
 * Visitor for handling import declarations in AST parsing.
 * @param {object} path - Babel path object for the import declaration.
 * @param {object} state - State object for the parser.
 */
export const ImportDeclaration = (path, state) => {
  const { filePath } = state;

  const {
    node: {
      source: { value },
    },
  } = path;

  if (isNodeModule(value)) return;

  const fileName = _z.extname(value) ? value : value + '.js';
  const resolvedFileName = _z.resolve(_z.dirname(filePath), fileName);
  const shouldParseCommand =
    resolvedFileName.includes('commands') || resolvedFileName.includes('build/index.js');

  if (shouldParseCommand) {
    const subcommands = parseOptions(resolvedFileName);
    state.commands.properties.push(
      createProperty('subcommands', createArrayExpression([subcommands]))
    );
  }
};

/**
 * Visitor for handling export named declarations related to OPTS in AST parsing.
 * @param {object} path - Babel path object for the export declaration.
 * @param {object} state - State object for the parser.
 */
const OptsExportNamedDeclarationVisitor = (path, state) => {
  const hasOpts = path.scope.hasBinding('OPTS');
  const declarations = path.get('declaration').get('declarations');

  if (hasOpts) {
    const _OPTS = declarations.find((d) => d?.node?.id?.name === 'OPTS');
    if (_OPTS) {
      state.commands = OBJECT_EXPRESSION([
        ...state.commands.properties,
        ..._OPTS.node.init.properties,
        createProperty('filePath', {
          type: 'Literal',
          value: state.filePath,
        }),
      ]);
    }
  }
};

/**
 * Visitor for handling export named declarations related to DEPS in AST parsing.
 * @param {object} path - Babel path object for the export declaration.
 * @param {object} state - State object for the parser.
 */
const DepsExportNamedDeclarationVisitor = (path, state) => {
  const hasDeps = path.scope.hasBinding('DEPS');
  const declarations = path.get('declaration').get('declarations');

  if (hasDeps) {
    const _DEPS = declarations.find((d) => d?.node?.id?.name === 'DEPS');
    if (_DEPS?.node?.init?.elements) {
      state.deps = _DEPS.node?.init?.elements.map((e) => e.value);
    }
  }
};

/**
 * Parses options from a file and returns an ESTree object representing commands.
 * @param {string} filePath - Path to the file to parse.
 * @param {object} [commands=OBJECT_EXPRESSION()] - Initial commands object.
 * @returns {object} The parsed commands object.
 */
export const parseOptions = (filePath, commands = OBJECT_EXPRESSION()) => {
  const state = {
    filePath,
    commands,
  };

  const visitors = {
    ExportNamedDeclaration: OptsExportNamedDeclarationVisitor,
  };

  try {
    const finalState = parseAndTraverse(filePath, visitors, state);
    return finalState.commands;
  } catch (e) {
    const err = new Error(e.message);
    err.stack = e.stack + '\n' + err.stack;
    throw err;
  }
};

/**
 * Parses dependencies from a file and returns an array of dependency names.
 * @param {string} filePath - Path to the file to parse.
 * @returns {string[]|boolean} Array of dependency names, or false if not found.
 */
export const parseDeps = (filePath) => {
  const state = {
    deps: false,
  };

  const visitors = {
    ExportNamedDeclaration: DepsExportNamedDeclarationVisitor,
  };

  try {
    const finalState = parseAndTraverse(filePath, visitors, state);
    return finalState.deps;
  } catch (e) {
    const err = new Error(e.message);
    err.stack = e.stack + '\n' + err.stack;
    throw err;
  }
};

/**
 * Parses options from a file and returns them as a string of code.
 * @param {string} filePath - Path to the file to parse.
 * @returns {string} The generated code string for options.
 */
export const parseOptsToString = (filePath) => {
  const commands = parseOptions(filePath);
  return escodegen.generate(commands);
};

/**
 * Parses and evaluates options from a file, returning the resulting object.
 * @param {string} filePath - Path to the file to parse.
 * @returns {object} The evaluated options object.
 */
export const parseAndEvaluateOptions = (filePath) => {
  const commands = parseOptions(filePath);
  const optsGen = escodegen.generate(commands);

  try {
    return new Function(`
    try {
      return ${optsGen};
     } catch (e) {
      console.log('______________________________________________________________________________________');
      console.error(e);
      console.log('______________________________________________________________________________________');
     }
    `).bind(global)();
  } catch (e) {
    const err = Error(
      'Could not evaluate options, please make sure they follow conventions. \n Originating Error: ' +
        e.message
    );
    err.stack = e.stack;
    throw err;
  }
};
