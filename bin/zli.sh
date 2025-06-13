#!/usr/bin/env bash

export USER_SHELL=`finger $USER | grep Shell | cut -d ':' -f3 | xargs`
export CONFIG=`cat .zli.json`

if [[ -z ${PROFILE+x} ]]; then
  ./node_modules/zli/src/index.js "$@"
else
  node --prof ./index.js "$@" &&
  if [[ $PROFILE == 1 ]]; then
    node --prof-process isolate-*-v8.log
  else
    node --prof-process isolate-*-v8.log > processed-v8.log
    vim -c  "silent! /$PROFILE" processed-v8.log
  fi
  rm isolate-*-v8.log
fi
