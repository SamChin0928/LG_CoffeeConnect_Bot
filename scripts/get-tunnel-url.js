const http = require('http');

http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const tunnel = json.tunnels.find(t => t.proto === 'https');
            if (tunnel) {
                console.log('NGROK_URL=' + tunnel.public_url);
            } else {
                console.log('No HTTPS tunnel found.');
                console.log(JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error(e);
        }
    });
}).on('error', (err) => {
    console.error('Error connecting to ngrok API:', err.message);
});
