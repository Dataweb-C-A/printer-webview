const WebSocket = require('ws');
const { printText } = require('./printer');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('WebSocket server connected.');

   ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.text) {
        printText(`[center]Hello World![/center]
[left]This is left-aligned.[/left]
[LINE]
[bold]Bold Text[/bold]
[big]Big Text Here[/big]
[qr]https://example.com[/qr]
[img]BASE64 ENCODE[/img]
[CUT]`, "RONGTA 80mm Series Printer");
        ws.send(JSON.stringify({ status: 'success', message: 'Impresión completada.' }));
      } else {
        ws.send(JSON.stringify({ status: 'error', message: 'Datos inválidos.' }));
      }
    } catch (error) {
      console.error('Error procesando el mensaje:', error.message);
      ws.send(JSON.stringify({ status: 'error', message: 'Error interno del servidor.' }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket server disconnected.');
  });
});

console.log('WebSocket running in port 8080');