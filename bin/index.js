#! /usr/bin/env node
import doConfigure from './configure.js';

const configure = process.argv.includes('--configure');

if (configure) {
  await doConfigure();
}
