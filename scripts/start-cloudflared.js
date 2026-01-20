const { spawn } = require('child_process');

console.log('Starting Cloudflare Tunnel on port 3001...');

// ./cloudflared tunnel --url http://localhost:3001
const tunnel = spawn('./cloudflared', ['tunnel', '--url', 'http://localhost:3001']);

tunnel.stdout.on('data', (data) => {
    console.log(`STDOUT: ${data}`);
});

tunnel.stderr.on('data', (data) => {
    const output = data.toString();
    console.log(`STDERR: ${output}`);
    // Regex for Cloudflare Quick Tunnel URL: https://<random>.trycloudflare.com
    const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
        console.log('TUNNEL_URL=' + match[0]);
    }
});

tunnel.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

// Keep alive
setInterval(() => { }, 1000 * 60 * 60);
