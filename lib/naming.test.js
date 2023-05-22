'use strict';
import test from 'ava';
import { determineShortFlagLetter, createOptionString } from './naming.js';
import { OPTION_TYPES } from '../types/index.js';

const desc = sub => `CLI NAMING CONVENTIONS - ` + sub;

const ALPHA = 'alpha';
const BETA = 'beta';
const GAMMA = 'gamma';

test(desc('Can determine best string for an option flag'), t => {
  const firstLetters = ['a', 'A', 'b'];

  t.is(determineShortFlagLetter(ALPHA, firstLetters), ALPHA);
  t.is(determineShortFlagLetter(BETA, firstLetters), 'B');
  t.is(determineShortFlagLetter(GAMMA, firstLetters), 'g');

  firstLetters.push('g');
  t.is(determineShortFlagLetter(GAMMA, firstLetters), 'G');

  firstLetters.push('G');
  t.is(determineShortFlagLetter(GAMMA, firstLetters), GAMMA);

  firstLetters.push(GAMMA);
  const error = t.throws(() => determineShortFlagLetter(GAMMA, firstLetters));
  t.is(error.message, `All easily calculable short flags for ${GAMMA} already used!`);
});

test(desc('Can create option strings for simple strings for commander'), t => {
  const optAlpha = {
    name: ALPHA,
    type: OPTION_TYPES.INPUT,
  };

  const optAlpha2 = {
    name: ALPHA + '2',
    type: OPTION_TYPES.BOOLEAN,
  };

  const optAlpha3 = {
    name: ALPHA + '3',
    type: OPTION_TYPES.PASSWORD,
  };

  const firstLetters = [];

  const optAlphaStr = createOptionString(optAlpha, firstLetters);
  const optAlpha2Str = createOptionString(optAlpha2, firstLetters);
  const optAlpha3Str = createOptionString(optAlpha3, firstLetters);

  t.is(optAlphaStr, '-a, --alpha <alpha>');
  t.is(optAlpha2Str, '-A, --alpha2');
  t.is(optAlpha3Str, '-alpha3, --alpha3 [password]');
});
