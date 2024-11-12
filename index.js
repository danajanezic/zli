#! /usr/bin/env node
import { createInterpreter, registerGlobals } from './lib/interpreter.js';
import { parseOptsToString } from './lib/parse-options.js';
import os from 'os';
import{ $ } from 'zx';
import { logo } from './logo.js';

const CONFIG = JSON.parse(process.env.CONFIG);
// EXPAND HOME DIRECTORIES IN UNIX-BASED SYSTEMS
CONFIG.root = CONFIG.root.startsWith('~') ? `${os.homedir()}${CONFIG.root.slice(1)}` : CONFIG.root;
const CMD_ROOT = CONFIG.root + 'commands';

registerGlobals(CONFIG);
$.verbose = false;
const { stdout: dirname } = await $`pwd`;
const __dirname = dirname.trim();

_z.program.configureOutput({
  writeOut: str => {
    console.log(chalk.green(str));
  },
  writeErr: str => {
    console.error(chalk.red(`${str}`));
  },
});

_z.program.addHelpText('beforeAll', logo);


const populateSubcommands = (parentNode, paths, optsCode) => {
  const currentPath = paths[0];
  const nextPath = paths.slice(1);
  const nodeName = currentPath.endsWith('.js') ? optsCode.name : currentPath;

  const currentNode = parentNode.subcommands.find(n => n.name === nodeName) || {
    name: nodeName,
    subcommands: [],
  };

  if (nextPath.length) {
    return {
      ...parentNode,
      subcommands: [
        ...parentNode.subcommands.filter(s => s.name !== currentPath),
        populateSubcommands(currentNode, paths.slice(1), optsCode),
      ],
    };
  }

  const optsSubs = optsCode?.subcommands || [];

  if (currentPath !== 'index.js') {
    parentNode.subcommands.push({
      ...currentNode,
      ...optsCode,
      subcommands: [...currentNode.subcommands, ...optsSubs],
    });

    return parentNode;
  }

  return {
    ...parentNode,
    ...optsCode,
    subcommands: [...parentNode.subcommands, ...optsSubs],
  };
};

async function getParsedOpts() {

  const commandStrs = await globby([`${CMD_ROOT}/**.js`, `${CMD_ROOT}/**/*.js`, `!${CMD_ROOT}/**/node_modules`]);

  return commandStrs.reduce(
      (subcommandArray, c) => {

        const cmdStartIdx = CMD_ROOT.endsWith('/') ? CMD_ROOT.split('/').length - 1 : CMD_ROOT.split('/').length;
        const parts = c.split('/').slice(cmdStartIdx);
        const script = _z.resolve(__dirname, c);

        const opts = parseOptsToString(script);

        try {
          const asCode = new Function(`const subs = ${opts}; return subs`)();

          if (!_z.hasValues(asCode)) {
            return subcommandArray;
          }
          return populateSubcommands(subcommandArray, parts, asCode);
        } catch (e) {
          const error = new Error(`Opts parsing failed on ${script} with error: 
          ${e.message}`);

          console.error(error);
          console.error(`
Opts that failed parsing:
          
${opts}
          `);
          process.exit(1);
        }

      },
      { subcommands: [] }
  );
}

const showNames = (node, parentName = '') => {
  if (node.name) console.info(parentName + ' > ' + node.name);
  if (node.options)
    console.info(
        '---->',
        node.options.map(o => [o.name[0], o.name])
    );
  if (node.subcommands) {
    node.subcommands.map(s => showNames(s, node.name));
  }
};

const parsedOpts = await getParsedOpts();

if (process.argv[2] === '--show-arg-name-map') {
  showNames(parsedOpts);
  process.exit(0);
}

const interpreter = createInterpreter(CONFIG.root + '/node_modules/@venicemusic/zli/index.js', process.argv, parsedOpts);
interpreter.preprocess();
await interpreter.execute();
