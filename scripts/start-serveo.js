const { spawn } = require('child_process');

console.log('Starting Serveo Tunnel on port 3001...');

// ssh -R 80:localhost:3001 serveo.net
const ssh = spawn('ssh', ['-o', 'StrictHostKeyChecking=no', '-R', '80:localhost:3001', 'serveo.net']);

ssh.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`STDOUT: ${output}`);
    // Parse URL from output: "Forwarding HTTP traffic from https://reso.serveo.net"
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.serveo\.net/);
    if (match) {
        console.log('TUNNEL_URL=' + match[0]);
    }
});

ssh.stderr.on('data', (data) => {
    // Serveo often prints the URL to stderr
    const output = data.toString();
    console.log(`STDERR: ${output}`);
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.serveo\.net/);
    if (match) {
        console.log('TUNNEL_URL=' + match[0]);
    }
});

ssh.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
});

// Keep alive
setInterval(() => { }, 1000 * 60 * 60);
