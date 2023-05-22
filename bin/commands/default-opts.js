export const OPTS = {
    name: 'ZLI',
    description: 'Zsh CLI',
    options: [
        {
            name: 'verbose',
            description: 'Like spam? This is for you.',
            type: OPTION_TYPES.BOOLEAN,
        },
        {
            name: 'local',
            description: 'set development runtime',
            type: OPTION_TYPES.BOOLEAN,
        },
        {
            name: 'develop',
            description: 'set develop runtime',
            type: OPTION_TYPES.BOOLEAN,
        },
        {
            name: 'staging',
            description: 'set staging runtime',
            type: OPTION_TYPES.BOOLEAN,
        },
        {
            name: 'prod',
            description: 'set prod runtime',
            type: OPTION_TYPES.BOOLEAN,
        },
    ],
};
