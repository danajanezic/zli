#! /usr/bin/env zx
import doConfigure from '../@venicemusic/zli/bin/configure.js';

const {configure} = argv;

if (configure) {
    await doConfigure();
}
