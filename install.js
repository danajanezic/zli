#!/usr/bin/env node

import { execSync } from 'child_process';

function run(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

console.log('Installing dependencies...');
run('npm install');

console.log('Running initial configuration...');
run('npx zli --configure');

console.log('Installation complete.');
