import { createRequire } from 'module';
import { basename, dirname, extname, join, resolve } from 'path';
import url from 'url';
import * as commander from 'commander';
import enquirer from 'enquirer';
import Inflect from 'i';
import * as zx from 'zx';
import { registerCommand } from './command-registration.js';
import { OPTION_TYPES } from '../types/index.js';
import { RUNTIMES } from '../constants/ENVIRONMENTS.js';

import * as optionsParser from './parse-options.js';
import { logo } from '../logo.js';
import assign from 'assign-deep';

const inflect = new Inflect();
const { program } = commander;
const { prompt } = enquirer;

program.on('option:develop', () => {
  global._z.RUNTIME_FLAGS.push(RUNTIMES.DEVELOP);
});

program.on('option:local', () => {
  global._z.RUNTIME_FLAGS.push(RUNTIMES.LOCAL);
});

program.on('option:staging', () => {
  global._z.RUNTIME_FLAGS.push(RUNTIMES.STAGING);
});

program.on('option:prod', () => {
  console.warn(chalk.yellowBright('WARNING: running with production flag toggled'));
  global._z.RUNTIME_FLAGS.push(RUNTIMES.PRODUCTION);
});

program.on('option:verbose', () => {
  $.verbose = true;
});

const less = async (string) => {
  return $.spawn(`echo '${string}' | less -`, {
    stdio: 'inherit',
    detached: true,
    shell: true,
  });
};

/**
 * Checks if the provided object is a function.
 * @param {*} obj - The object to check.
 * @returns {boolean} True if obj is a function, false otherwise.
 */
const isFunc = (obj) => typeof obj === 'function';

/**
 * Executes a callback with a ZLI command context for a given command path.
 * @param {Function} callback - The function to execute with the command.
 * @param {...string} commandPath - The path segments for the command.
 * @returns {Promise<*>} The result of the callback.
 */
const withZliCmd = async (callback, ...commandPath) => {
  await within(async () => {
    const filePath = commandPath[commandPath.length - 1].includes('.js')
      ? [process.cwd(), global.root, ...commandPath]
      : [process.cwd(), global.root, ...commandPath, 'index.js'];

    const cmd = async (args) => importPath(filePath.join('/'), args);
    return callback(cmd);
  });
};

/**
 * Registers global variables and utilities for the ZLI environment.
 * @param {Object} config - Optional configuration object to merge into globals.
 */
export function registerGlobals(config = {}) {
  Object.assign(global, {
    ...config,
    ...zx,
    debug: (...args) => console.log(JSON.stringify(args, null, 4)),
    fmtErrStr: (str) => chalk.red('Error: ') + str,
    die: (message, error) => {
      console.error(fmtErrStr(message));
      if (error) {
        console.error(error);
      }
      process.exit(1);
    },
    ifFunc:
      (func) =>
      (...args) =>
        isFunc(func) ? func(...args) : null,
    withZliCmd,
    OPTION_TYPES,
    RUNTIMES,
    _z: {
      commander,
      program,
      prompt,
      inflect,
      resolve,
      dirname,
      basename,
      extname,
      join,
      importPath,
      less,
      isFunc,
      logo,
      hasValues: (object) => {
        if (!object) return false;
        return Object.keys(object).length > 0;
      },
      RUNTIME_FLAGS: [],
    },
  });
}

/**
 * Dynamically imports and executes a script at the given filepath with provided arguments and command context.
 * @param {string} filepath - The path to the script file.
 * @param {Object} args - Arguments to pass to the script.
 * @param {Object} command - Commander command context.
 * @returns {Promise<void>} Resolves when the script is executed.
 */
async function importPath(filepath, args, command) {
  if (!filepath) {
    program.help();
    process.exit(1);
  }

  let __filename = resolve(filepath);
  let __dirname = dirname(__filename);
  let require = createRequire(filepath);

  const useOpts = (callback, ...argStrings) => {
    const actualArgs = Object.fromEntries(
      Object.entries(args).filter((entry) => {
        const dependentArgs = argStrings.reduce((a, c) => {
          return a.concat(c.split('|'));
        }, []);
        return dependentArgs.includes(entry[0]);
      })
    );

    const otherArgs = Object.fromEntries(
      Object.entries(args).filter((entry) => {
        return !argStrings.includes(entry[0]);
      })
    );

    if (argStrings.length === Object.keys(actualArgs).length) {
      return zx.within(() => callback({ ...actualArgs, ...otherArgs, _: argv._ }));
    }
  };

  /**
 * Creates a function that executes a callback if the current runtime matches any of the provided runtimes.
 * @param {...string} runtimes - Runtime environment names to match.
 * @returns {Function} A function accepting a callback and an optional default handler.
 */
const whenRuntime = (...runtimes) => {
    return (callback, onDefault) => {
      const filtered = runtimes.filter((r) => _z.RUNTIME_FLAGS.includes(r));
      return filtered.length ? ifFunc(callback)(filtered) : ifFunc(onDefault)();
    };
  };

  Object.assign(global, {
    __filename,
    __dirname,
    require,
    useOpts,
    whenRuntime,
    whenLocal: whenRuntime(RUNTIMES.LOCAL),
    whenDevelop: whenRuntime(RUNTIMES.DEVELOP),
    whenStaging: whenRuntime(RUNTIMES.STAGING),
    whenProduction: whenRuntime(RUNTIMES.PRODUCTION),
    whenNonLocal: whenRuntime(RUNTIMES.DEVELOP, RUNTIMES.STAGING, RUNTIMES.PRODUCTION),
    whenPreProd: whenRuntime(RUNTIMES.LOCAL, RUNTIMES.STAGING, RUNTIMES.PRODUCTION),
    ARGS: { ...args, verbose: $.verbose },
    CMD: command,
  });

  await import(url.pathToFileURL(filepath));
}

/**
 * Returns a commander action handler for the CLI, handling option parsing and command execution.
 * @param {Object} OPTS - Options object for the command.
 * @returns {Function} Function that receives a filepath and returns an async action handler.
 */
const defaultCommanderAction = (OPTS) => (filepath) => {
  return async (args, command) => {
    if (
      (!_z.hasValues(args) && typeof OPTS.showHelpWhenNoArgs === 'undefined') ||
      OPTS.showHelpWhenNoArgs
    ) {
      command.help();
      return;
    }

    if (OPTS.requiresRunTime && !_z.RUNTIME_FLAGS.length) {
      if (OPTS.requiresRunTime.default) {
        _z.RUNTIME_FLAGS.push(OPTS.requiresRunTime.default);
      } else {
        console.error(fmtErrStr('Missing required run time flag.'));
        process.exit(1);
      }
    }

    if (OPTS.options) {
      const errors = [];
      try {
        const validationErrors = await ifFunc(OPTS.validate)(args);
        if (_z.hasValues(validationErrors)) {
          errors.push(...validationErrors);
        }
      } catch (e) {
        console.error('\n\n' + fmtErrStr(`could not perform validation on ${filepath}`));
        console.error(e);
        process.exit(1);
      }

      if (_z.hasValues(args)) {
        const requiredOpts = OPTS.options.filter((o) => o.required).map((o) => o.name);
        const argNames = Object.keys(args);
        const missingOpts = requiredOpts.filter((o) => !argNames.includes(o));

        if (missingOpts.length) {
          errors.push(`Missing required argument(s): ${chalk.yellow(missingOpts.join(', '))}`);
        }
      }

      if (_z.hasValues(errors)) {
        console.error(chalk.red('\nERROR:\n'));
        console.error(errors.map((e) => chalk.red('\t' + e)).join('\n'));
        console.error('\n');
        process.exit(1);
      }
    }

    if (isFunc(OPTS.beforeRun)) {
      try {
        const beforeRunArgs = (await OPTS.beforeRun(args)) || {};
        return importPath(filepath, { ...args, ...beforeRunArgs }, command);
      } catch (e) {
        console.error(`
  ${chalk.red(e.message)}

  ${OPTS.filePath}:

        ${OPTS.beforeRun}`);

        process.exit(1);
      }
    } else {
      return importPath(filepath, args, command);
    }
  };
};

global.OPTS = {};

/**
 * Creates an interpreter for running ZLI scripts.
 * @param {string} scriptPath - Path to the script to execute.
 * @param {string[]} argv - Arguments array (defaults to process.argv).
 * @param {Object} coreOpts - Core options to merge with parsed options.
 * @returns {Object} Interpreter with preprocess and execute methods.
 */
export function createInterpreter(scriptPath, argv, coreOpts) {
  const rawArgs = argv || process.argv;
  const firstArg = scriptPath || rawArgs.slice(2).find((a) => !a.startsWith('--'));
  const filepath = resolve(firstArg);
  const parsedOpts = optionsParser.parseAndEvaluateOptions(filepath);

  assign(global.OPTS, coreOpts, parsedOpts);

  return {
    preprocess: () => {
      try {
        registerCommand(program, global.OPTS, defaultCommanderAction);
        program.action(defaultCommanderAction(OPTS)(filepath));
        return { program, OPTS: global.OPTS };
      } catch (e) {
        e.OPTS = global.OPTS;
        die('Preprocessing Error', e);
      }
    },
    execute: async () => {
      program.parse(rawArgs);
      if (!Object.keys(OPTS).length) {
        const finalArgs = isFunc(OPTS.beforeRun) ? await OPTS.beforeRun(rawArgs) : rawArgs;
        return importPath(filepath, finalArgs);
      }
    },
  };
}
