export const OPTS = {
  name: 'show-globals',
  description: 'Display globals',
  options: [
    {
      name: 'docs',
      description: 'Show docs for globals',
      type: OPTION_TYPES.BOOLEAN,
    },
    {
      name: 'list',
      description: 'Show list of all globals',
      type: OPTION_TYPES.BOOLEAN,
    },
  ],
};

useOpts(() => {
  const markdown = Object.keys(global).reduce(
    (a, key) => {
      if (key === '_z') {
        return `
- _z
  ${Object.keys(global._z).reduce((s, vKey) => {
    return s.concat(`
  - ${vKey} (${typeof global._z[vKey]})`);
  }, ``)}
`;
      }
      return a.concat(`
- ${key} (${typeof global[key]})
      `);
    },
    `# Venice CLI Globals
  `
  );

  logMd(markdown);
}, 'list');

await useOpts(async () => {
  const { stdout } = await $`cat ${global.root + '/globals.md'}`;
  await logMd(stdout);
}, 'docs');
