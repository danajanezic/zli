$.verbose = false;

export default async function(){
    const {overwrite} = argv;
    const CONFIG_FILE = '.zli.json';

    if (!overwrite) {
        const hasConfig = fs.existsSync(CONFIG_FILE);

        if (hasConfig) {
            process.exit(0);
        }
    }

    const config = {}
    config.root = await question(`Root path for ZLI? (default: ./zli-commands/)`) || './zli-commands/';
    config.commandExecutable = await question(`Name of executable to run ZLI? (default: zli)`) || 'zli';
    const proceed = await question(`Proceed with config: ${JSON.stringify(config,null,4)}? (y/N)`) || 'N';

    if (!proceed.toLocaleLowerCase().startsWith('y')) {
        console.warn('Aborting configuration');
        process.exit(1);
    }

    if(fs.existsSync(config.root)){
        const overwriteRoot = await question(`Root path ${config.root} exists, overwrite? (y/N)`) || 'N';
        if (overwriteRoot.toLocaleLowerCase().startsWith('y')) {
            console.warn('Overwriting...');
            fs.rmSync(config.root, {recursive: true});
            fs.mkdirSync(config.root);
            fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/commands/default-opts.js`, config.root + 'index.js');
            fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/commands/show-globals.js`, config.root + 'show-globals.js');
            fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/commands/globals.md`, config.root + 'globals.md');
        }
    } else {
        fs.mkdirSync(config.root);
        fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/commands/default-opts.js`, config.root + 'index.js');
        fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/commands/show-globals.js`, config.root + 'show-globals.js');
        fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/commands/globals.md`, config.root + 'globals.md');
    }

    if (fs.existsSync(config.commandExecutable)) {
        const overwriteExec = await question(`File ${config.commandExecutable} exists, overwrite? (y/N)`) || 'N';
        if (overwriteExec.toLocaleLowerCase().startsWith('y')) {
            console.warn('Overwriting...');
            fs.rmSync(config.commandExecutable);
            fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/zli.sh`, config.commandExecutable);
        }
    } else {
        fs.copyFileSync(`./node_modules/@venicemusic/zli/bin/zli.sh`, config.commandExecutable);
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
}


