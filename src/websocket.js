const WebSocket = require('ws');
const { printText } = require('./printer');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('WebSocket server connected.');
  printText('\n\nConnection with printer successfully...\n\n');

  ws.on('close', () => {
    console.log('WebSocket server disconnected.');
  });
});

console.log('WebSocket running in port 8080');