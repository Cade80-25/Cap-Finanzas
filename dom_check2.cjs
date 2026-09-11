const http = require('http');

http.get('http://127.0.0.1:9230/json/list', (res) => {
  let b = '';
  res.on('data', (c) => (b += c));
  res.on('end', () => {
    const pages = JSON.parse(b);
    const page = pages.find((p) => p.type === 'page');
    const ws = new (require('ws'))(page.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            // capturar todo el texto visible del DOM
            const body = document.body.innerText;
            const lines = body.split('\\n').filter(l => l.trim());
            // buscar líneas con Educación/Tecnología/Matrícula/Música (o sus versiones corruptas)
            const matches = lines.filter(l => /Educaci|Tecnolog|Matr|Música|M%sica|M.sica/i.test(l));
            const hx = (s) => Array.from(s).map(c => c.codePointAt(0).toString(16)).join(' ');
            return {
              matchedLines: matches.map(m => ({ text: m, hex: hx(m) })),
            };
          })()`,
          returnByValue: true,
        },
      }));
    });
    ws.on('message', (msg) => {
      const d = JSON.parse(msg);
      if (d.id === 1) {
        console.log(JSON.stringify(d.result?.result?.value, null, 2));
        ws.close();
        process.exit(0);
      }
    });
  });
});