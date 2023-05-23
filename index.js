#! /usr/bin/env node
import { createInterpreter, registerGlobals } from './lib/interpreter.js';
import { parseOptsToString } from './lib/parse-options.js';
import{ $ } from 'zx';
import { logo } from './logo.js';
import stringify from 'code-stringify';
import { PerformanceObserver, performance } from 'node:perf_hooks';

const CONFIG = JSON.parse(process.env.CONFIG);

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

const commandStrs = await globby([`${CONFIG.root}/**.js`, `${CONFIG.root}/**/*.js`, `!${CONFIG.root}/**/node_modules`]);

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

const CACHE_FILE = `${__dirname}/.zli.cache.js`;

async function getParsedOpts() {
  if (fs.existsSync(CACHE_FILE) && process.argv[2] !== '--write-cache') {
    const cache = await import(`${CACHE_FILE}`);
    return cache.default;
  } else {
    return commandStrs.reduce(
        (a, c) => {
          const parts = c.split('/').slice(2);
          const script = _z.resolve(__dirname, c);

          const opts = parseOptsToString(script);
          const asCode = new Function(`const subs = ${opts}; return subs`)();

          if (!_z.hasValues(asCode)) {
            return a;
          }

          return populateSubcommands(a, parts, asCode);
        },
        { subcommands: [] }
    );
  }
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

if (process.argv[2] === '--write-cache') {
  fs.writeFileSync(CACHE_FILE, `export default ${stringify(parsedOpts)};`, { flag: 'w' });
  process.exit(0);
}

const interpreter = createInterpreter(__dirname + '/node_modules/zli/index.js', process.argv, parsedOpts);
interpreter.preprocess();
await interpreter.execute();
