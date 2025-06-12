#!/usr/bin/env node

import { registerGlobals, createInterpreter } from './lib/interpreter.js';
import { $, ProcessOutput } from 'zx';
import * as optionsParser from './lib/parse-options.js';

await (async function main() {
  registerGlobals();
  $.verbose = argv.verbose;
  _z.program.configureOutput({
    writeOut: (str) => {
      console.log(chalk.green(str));
    },
    writeErr: (str) => {
      console.error(chalk.red(`${str}`));
    },
  });

  const extensions = fs.existsSync(global.root + '/opts-extensions.js')
    ? await import(global.root + '/opts-extensions.js')
    : {};

  try {
    const scriptName = argv._[0];
    const defaultOptions = optionsParser.parseAndEvaluateOptions('./cli/commands/index.js');
    const interpreter = createInterpreter(scriptName, process.argv.slice(1), {
      ...defaultOptions,
      ...extensions,
    });
    interpreter.preprocess();
    await interpreter.execute();
  } catch (p) {
    if (p instanceof ProcessOutput) {
      console.error(fmtErrStr(p.message));
      return (process.exitCode = 1);
    } else {
      throw p;
    }
  }
})();
