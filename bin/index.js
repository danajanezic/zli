#! /usr/bin/env zx
import doConfigure from '../zli/bin/configure.js';

const {configure} = argv;

if (configure) {
    await doConfigure();
}
