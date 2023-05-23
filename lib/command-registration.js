import { createOptionString } from './naming.js';

export const registerSubcommandsRecursively = (subcmd, { subcommands = [] }, action, program) => {
  subcommands.forEach(c => {
    if (!_z.hasValues(c)) {
      return;
    }
    const firstLetters = [];

    try {
      const { name, description, alias, filePath, options, requiresRunTime } = c;
      const cmd = subcmd.command(name).description(description || `commands pertaining to ${name}-like stuff`);

      if (alias) {
        cmd.alias(alias);
      }

      if (options) {
        options.forEach(o => {
          const { description, defaultValue } = o;
          const argString = createOptionString(o, firstLetters);
          cmd.option(argString, description || '', defaultValue);
          cmd.enablePositionalOptions();
          cmd.passThroughOptions();

          if (typeof action === 'function') {
            cmd.action(action(c)(filePath));
          }
        });
      }

      if (requiresRunTime) {
        if (requiresRunTime.default) {
          cmd.addHelpText(
            'after',
            `
* Command is runtime sensitive, defaults to ${requiresRunTime.default} if no runtime flag provided`
          );
        } else {
          program.addHelpText(
            'after',
            `
* Requires a runtime flag`
          );
        }
      }

      if (typeof action === 'function') {
        cmd.action(action(c)(filePath));
      }

      registerSubcommandsRecursively(cmd, c, action, program);
    } catch (e) {
      console.error(chalk.red(`ERROR: could not register subcommand ${JSON.stringify(c, null, 4)}`));
      throw e;
    }
  });
};

export const registerCommand = (program, OPTS, action) => {
  const { name, alias, description } = OPTS;
  const p = program.name(name).description(description);

  if (alias) {
    p.alias(alias);
  }

  const options = OPTS.options || [];
  const firstLetters = [];

  options.forEach(o => {
    const { description, defaultValue } = o;
    const argString = createOptionString(o, firstLetters);
    p.option(argString, description, defaultValue);

    if (typeof action === 'function') {
      p.action(action(OPTS)(o.filePath));
    }
  });

  p.enablePositionalOptions();
  p.passThroughOptions();
  registerSubcommandsRecursively(p, OPTS, action, program);
};
