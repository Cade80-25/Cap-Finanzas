const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9229/json', (res) => {
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    const pages = JSON.parse(body);
    const wsUrl = pages[0].webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({
            journal: localStorage.getItem('cap-finanzas-journal'),
            migrated: localStorage.getItem('cap-finanzas-journal-migrated')
          })`,
          returnByValue: true,
        },
      }));
    });
    ws.on('message', (msg) => {
      const data = JSON.parse(msg);
      if (data.id === 1) {
        const val = data.result?.result?.value;
        if (val) {
          const parsed = JSON.parse(val);
          console.log('journal length:', parsed.journal ? parsed.journal.length : 'null');
          if (parsed.journal) {
            // mostrar primeras 2 transacciones con caracteres crudos
            const arr = JSON.parse(parsed.journal);
            console.log('total tx:', arr.length);
            for (const tx of arr.slice(0, 5)) {
              console.log(JSON.stringify({ d: tx.description, c: tx.creditor, n: tx.notes }));
            }
            // buscar específicamente Devolución y Alimentación
            const dev = arr.find((t) => t.description && t.description.includes('Devoluci'));
            const ali = arr.find((t) => t.description && t.description.includes('Alimentaci'));
            if (dev) console.log('DEVOLUCI raw:', JSON.stringify(dev.description));
            if (ali) console.log('ALIMENTACI raw:', JSON.stringify(ali.description));
          }
        } else {
          console.log('no value, err:', JSON.stringify(data));
        }
        ws.close();
        process.exit(0);
      }
    });
  });
});