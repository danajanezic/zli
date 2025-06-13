#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const __dirname = process.cwd();

const CONFIG_FILE = '.zli.json';

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

export default async function main() {
  const overwrite = process.argv.includes('--overwrite');
  const confirm = process.argv.includes('--confirm');
  const argRoot = getArg('--root');
  const argExec = getArg('--executable');

  if (!overwrite) {
    const hasConfig = fs.existsSync(CONFIG_FILE);
    if (hasConfig) {
      process.exit(0);
    }
  }

  const config = {};
  let commandRoot = argRoot;
  const defaultCommandRoot = 'zli_commands';
  
  if (!commandRoot) {
    commandRoot = (await ask(`Root path for ZLI? (default: ${defaultCommandRoot})`)) || defaultCommandRoot;
  }
  config.root = path.join(__dirname, commandRoot, '/');

  let commandExecutable = argExec;
  if (!commandExecutable) {
    commandExecutable = (await ask(`Name of executable to run ZLI? (default: zli)`)) || 'zli';
  }
  config.commandExecutable = commandExecutable;

  let proceed = 'N';
  if (confirm) {
    proceed = 'y';
  } else {
    proceed = (await ask(`Proceed with config: ${JSON.stringify(config, null, 4)}? (y/N)`)) || 'N';
  }

  if (!proceed.toLocaleLowerCase().startsWith('y')) {
    console.warn('Aborting configuration');
    process.exit(1);
  }

  if (fs.existsSync(config.root)) {
    const overwriteRoot =
      (await question(`Root path ${config.root} exists, overwrite? (y/N)`)) || 'N';
    if (overwriteRoot.toLocaleLowerCase().startsWith('y')) {
      console.warn('Overwriting...');
      fs.rmSync(config.root, { recursive: true });
      fs.mkdirSync(config.root);
      fs.copyFileSync(
        `./node_modules/zli/bin/commands/default-opts.js`,
        config.root + '/index.js'
      );
      fs.copyFileSync(
        `./node_modules/zli/bin/commands/show-globals.js`,
        config.root + '/show-globals.js'
      );
      fs.copyFileSync(
        `./node_modules/zli/bin/commands/globals.md`,
        config.root + '/globals.md'
      );
    }
  } else {
    fs.mkdirSync(config.root);
    fs.copyFileSync(
      `./node_modules/zli/bin/commands/default-opts.js`,
      config.root + '/index.js'
    );
    fs.copyFileSync(
      `./node_modules/zli/bin/commands/show-globals.js`,
      config.root + '/show-globals.js'
    );
    fs.copyFileSync(
      `./node_modules/zli/bin/commands/globals.md`,
      config.root + '/globals.md'
    );
  }

  if (fs.existsSync(config.commandExecutable)) {
    const overwriteExec =
      (await question(`File ${config.commandExecutable} exists, overwrite? (y/N)`)) || 'N';
    if (overwriteExec.toLocaleLowerCase().startsWith('y')) {
      console.warn('Overwriting...');
      fs.rmSync(config.commandExecutable);
      fs.copyFileSync(`./node_modules/zli/bin/zli.sh`, config.commandExecutable);
    }
  } else {
    fs.copyFileSync(`./node_modules/zli/bin/zli.sh`, config.commandExecutable);
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
}
