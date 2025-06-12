#! _z.js
import escodegen from 'escodegen';
import { parseAndTraverse } from './ast-parsing.js';

export const isNodeModule = filePath => {
  // A Node module import will not begin with a relative or absolute path
  // indicator. Scoped packages (e.g. @scope/pkg) should also be treated as
  // node modules, so simply check the first character.
  return !filePath.startsWith('.') && !filePath.startsWith('/');
};

const OBJECT_EXPRESSION = (properties = []) => ({
  type: 'ObjectExpression',
  properties,
});

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

const createArrayExpression = elements => {
  return {
    type: 'ArrayExpression',
    elements,
  };
};

// IN PROGRESS
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
  const shouldParseCommand = resolvedFileName.includes('commands') || resolvedFileName.includes('build/index.js');

  if (shouldParseCommand) {
    const subcommands = parseOptions(resolvedFileName);
    state.commands.properties.push(createProperty('subcommands', createArrayExpression([subcommands])));
  }
};

const OptsExportNamedDeclarationVisitor = (path, state) => {
  const hasOpts = path.scope.hasBinding('OPTS');
  const declarations = path.get('declaration').get('declarations');

  if (hasOpts) {
    const _OPTS = declarations.find(d => d?.node?.id?.name === 'OPTS');
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

const DepsExportNamedDeclarationVisitor = (path, state) => {
  const hasDeps = path.scope.hasBinding('DEPS');
  const declarations = path.get('declaration').get('declarations');

  if (hasDeps) {
    const _DEPS = declarations.find(d => d?.node?.id?.name === 'DEPS');
    if (_DEPS?.node?.init?.elements) {
      state.deps = _DEPS.node?.init?.elements.map(e => e.value);
    }
  }
};

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

export const parseDeps = filePath => {
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

export const parseOptsToString = filePath => {
  const commands = parseOptions(filePath);
  return escodegen.generate(commands);
};

export const parseAndEvaluateOptions = filePath => {
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
      'Could not evaluate options, please make sure they follow conventions. \n Originating Error: ' + e.message
    );
    err.stack = e.stack;
    throw err;
  }
};
