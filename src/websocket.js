const WebSocket = require('ws');
const { printText } = require('./printer');

const wss = new WebSocket.Server({ port: 8080 });

let example_base64 = "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"

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
[img]${example_base64}[/img]
[bar]123456789[/bar]
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