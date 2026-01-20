module.exports = {
    apps: [
        {
            name: 'coffee-connect-web',
            script: 'npm',
            args: 'start',
            cwd: './', // Current directory
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        },
        {
            name: 'coffee-connect-bot',
            script: 'npx',
            args: 'tsx bot.ts',
            cwd: './',
            env: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'cloudflared-tunnel',
            script: 'scripts/start-cloudflared.js',
            cwd: './'
        }
    ]
};
