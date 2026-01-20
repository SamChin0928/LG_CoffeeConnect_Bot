const ngrok = require('ngrok');

(async function () {
    try {
        const url = await ngrok.connect({
            addr: 3000,
            // authtoken: '...' // user might need to provide this if session expires
        });
        console.log('NGROK_URL=' + url);

        // Keep alive
        setInterval(() => { }, 1000 * 60 * 60);
    } catch (error) {
        console.error('Error starting ngrok:', error);
        process.exit(1);
    }
})();
