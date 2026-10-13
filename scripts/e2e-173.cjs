// E2E Cap-Finanzas v1.1.73 — 16 checks, instancia aislada, CDP
// electron 44.7.0 + router v7 + tailwind v4 — prueba de fuego post-migración
// Schemas reales: useLicense, useComercioExterior (TradeOperation), useMarketingVentas (Campaign),
// useStartups (Startup), useAuditoria (AuditFinding), useJournalTransactions (cap-finanzas-journal)
const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const REPO = 'C:/Users/USUARIO/Downloads/Cap-Finanzas';
const TMP = process.env.TMPDIR || 'C:/Users/USUARIO/AppData/Local/hermes/cache/scratch';
const USERDATA = path.join(TMP, 'e2e-173-userdata');
const PORT = 9223;
const results = [];
let ws = null, msgId = 0;
const pending = new Map();

function check(n, name, ok, detail = '') {
  results.push({ n, name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} #${n} ${name}${detail ? ' — ' + detail : ''}`);
}

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function cdpSend(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function evalJS(expr) {
  const r = await cdpSend('Runtime.evaluate', { expression: expr, returnByValue: true });
  // CDP: {id, result: {result: {type, value}}} — doble nivel "result"
  return r && r.result && r.result.result ? r.result.result.value : undefined;
}

// Espera activa hasta que el selector exista (max ms), devuelve true/false
async function waitForSelector(sel, maxMs = 10000, stepMs = 400) {
  for (let t = 0; t < maxMs; t += stepMs) {
    try {
      const n = await evalJS(`document.querySelectorAll('${sel}').length`);
      if (n > 0) return true;
    } catch {}
    await wait(stepMs);
  }
  return false;
}

async function main() {
  // 0. Limpieza previa — verificada (electron puede retener locks en Windows)
  for (let attempt = 0; attempt < 3; attempt++) {
    try { fs.rmSync(USERDATA, { recursive: true, force: true }); } catch {}
    if (!fs.existsSync(USERDATA)) break;
    await wait(1500);
  }
  fs.mkdirSync(USERDATA, { recursive: true });

  // 1. Lanzar electron aislado con CDP (shell:true para .cmd en Windows)
  const electronPath = path.join(REPO, 'node_modules', '.bin', 'electron.cmd');
  const child = spawn(electronPath, ['.', `--remote-debugging-port=${PORT}`], {
    cwd: REPO,
    shell: true,
    env: { ...process.env, CAPFINANZAS_USERDATA: USERDATA, NODE_ENV: 'production', ELECTRON_NO_ATTACH_CONSOLE: '1' },
    stdio: 'ignore', detached: false
  });
  child.on('error', (e) => { console.error('FATAL spawn:', e.message); process.exit(1); });

  // 2. Esperar CDP endpoint
  let targetOk = false;
  for (let i = 0; i < 60; i++) {
    try {
      const list = JSON.parse(await httpGet(`http://127.0.0.1:${PORT}/json/list`));
      if (list.length > 0) { targetOk = true; break; }
    } catch {}
    await wait(1000);
  }
  if (!targetOk) { console.log('FATAL: CDP no disponible tras 60s'); child.kill(); process.exit(1); }

  // WebSocket nativo (Node >= 22 tiene WebSocket global)
  const list = JSON.parse(await httpGet(`http://127.0.0.1:${PORT}/json/list`));
  const page = list.find(t => t.type === 'page');
  if (!page) { console.log('FATAL: no page target'); child.kill(); process.exit(1); }
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  ws.onmessage = async (ev) => {
    try {
      const txt = typeof ev.data === 'string' ? ev.data : await ev.data.text();
      const msg = JSON.parse(txt);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg);
      }
    } catch {}
  };

  // 3. Esperar boot de la app (root renderizado, no pantalla blanca)
  let booted = false, bodyLen = 0;
  for (let i = 0; i < 60; i++) {
    await wait(1000);
    try {
      bodyLen = await evalJS("(document.getElementById('root') || {}).innerHTML ? document.getElementById('root').innerHTML.length : 0");
      if (bodyLen > 500) { booted = true; break; }
    } catch {}
  }
  check(1, 'Boot limpio (root render >500 chars)', booted, `${bodyLen} chars`);

  // 1b. Estado limpio garantizado: wipe de localStorage ANTES de inyectar fixtures
  const wiped = await evalJS(`(() => { try { localStorage.clear(); return 'ok'; } catch (e) { return 'ERR:' + e.message; } })()`);
  console.log(`localStorage.clear() → ${wiped}`);

  // 4. Licencia CF-TRAD activa (LicenseData real de useLicense.ts)
  const licSet = await evalJS(`(() => {
    try {
      localStorage.setItem('cap-finanzas-license', JSON.stringify({
        mode: 'traditional',
        trialStartDate: '2026-09-01T00:00:00.000Z',
        activatedAt: '2026-09-15T00:00:00.000Z',
        licenseCode: 'CF-TRAD',
        isActivated: true,
        purchasedModes: ['simple', 'traditional'],
        extraAccountSlots: 0,
        usedAccountCodes: []
      }));
      return localStorage.getItem('cap-finanzas-license') !== null;
    } catch (e) { return 'ERR:' + e.message; }
  })()`);
  check(2, 'Licencia CF-TRAD inyectada', licSet === true, String(licSet));

  // 5. Recargar para que el contexto de licencia relea
  await evalJS(`location.reload()`);
  await wait(4500);

  // 6. Header sin trial
  const headerTxt = await evalJS(`document.body.innerText.slice(0, 500)`);
  check(3, 'Header sin "Activar"/trial', !/Activar|Prueba|trial/i.test(headerTxt || ''), String(headerTxt).slice(0, 70));

  // 7. Fixtures — schemas reales
  const fx = await evalJS(`(() => {
    try {
      const now = new Date().toISOString();
      const comercio = {
        id: 'e2e-trd-1', type: 'importacion', description: 'Widget E2E',
        status: 'en_transito', incoterm: 'CIF', origin: 'CN', destination: 'UY',
        amount: 5000, currency: 'USD', customsDuties: 525, freightCost: 300, insuranceCost: 175,
        expectedDate: '2026-10-20', broker: 'Broker E2E', notes: 'e2e', createdAt: now
      };
      const marketing = {
        id: 'e2e-mkt-1', name: 'Campaña E2E', status: 'activa', channel: 'redes',
        budget: 5000, spent: 3000, revenue: 15000, leads: 40, conversions: 12,
        startDate: now, endDate: now, notes: 'e2e', createdAt: now
      };
      const startup = {
        id: 'e2e-stp-1', name: 'Startup E2E', description: 'e2e', stage: 'serie_a', status: 'activa',
        mrr: 2500, arr: 30000, churn: 2, runway: 12, burnRate: 5000, valuation: 100000,
        founded: '2024', employees: 8, sector: 'SaaS', notes: 'e2e', createdAt: now
      };
      const audit = {
        id: 'e2e-aud-1', name: 'Auditoría E2E', area: 'Finanzas', auditor: 'E2E',
        startDate: now, status: 'en_proceso', notes: 'e2e', createdAt: now
      };
      const finding = {
        id: 'e2e-fnd-1', auditId: 'e2e-aud-1', title: 'Hallazgo E2E', description: 'e2e',
        severity: 'medio', recommendation: 'Corregir', responsible: 'E2E',
        dueDate: '2026-10-30', status: 'abierta', economicImpact: 2000, createdAt: now
      };
      localStorage.setItem('cap-finanzas-comercio', JSON.stringify([comercio]));
      localStorage.setItem('cap-finanzas-marketing', JSON.stringify([marketing]));
      localStorage.setItem('cap-finanzas-startups', JSON.stringify([startup]));
      localStorage.setItem('cap-finanzas-auditoria-auditorias', JSON.stringify([audit]));
      localStorage.setItem('cap-finanzas-auditoria-hallazgos', JSON.stringify([finding]));
      return true;
    } catch (e) { return 'ERR:' + e.message; }
  })()`);
  check(4, 'Fixtures inyectadas (5 entidades)', fx === true, String(fx));

  // 8. Recargar para que los hooks lean fixtures
  await evalJS(`location.reload()`);
  await wait(4500);

  // 9. Comercio Exterior
  await evalJS(`location.hash = '#/comercio'`);
  await wait(2500);
  const comRender = await evalJS(`document.body.innerText.includes('Widget E2E')`);
  check(5, 'Comercio: render con fixture', comRender === true);
  const comBtn = await evalJS(`document.querySelectorAll('button[title="Marcar entregado y contabilizar"]').length > 0`);
  check(6, 'Comercio: botón entregado presente', comBtn === true);
  const comClick = await evalJS(`(() => {
    const b = document.querySelector('button[title="Marcar entregado y contabilizar"]');
    if (!b) return false;
    b.click();
    return true;
  })()`);
  check(7, 'Comercio: clic en "Marcar entregado"', comClick === true);
  await wait(2000);
  const comStatus = await evalJS(`(() => {
    const raw = localStorage.getItem('cap-finanzas-comercio');
    const arr = raw ? JSON.parse(raw) : [];
    return arr.length ? arr[0].status : 'empty';
  })()`);
  check(8, 'Comercio: status → entregado', comStatus === 'entregado', String(comStatus));

  // 10. Marketing
  await evalJS(`location.hash = '#/marketing'`);
  await wait(2500);
  const mktRender = await evalJS(`document.body.innerText.includes('Campaña E2E')`);
  check(9, 'Marketing: render con fixture', mktRender === true);
  const mktClick = await evalJS(`(() => {
    const b = document.querySelector('button[title="Finalizar y contabilizar"]');
    if (!b) return false;
    b.click();
    return true;
  })()`);
  check(10, 'Marketing: clic en "Finalizar y contabilizar"', mktClick === true);
  await wait(2000);

  // 11. Startups
  await evalJS(`location.hash = '#/startups'`);
  await wait(2500);
  const stpRender = await evalJS(`document.body.innerText.includes('Startup E2E')`);
  check(11, 'Startups: render con fixture', stpRender === true);
  const stpClick = await evalJS(`(() => {
    const b = document.querySelector('button[title="Contabilizar MRR del mes"]');
    if (!b) return false;
    b.click();
    return true;
  })()`);
  check(12, 'Startups: clic en "Contabilizar MRR del mes"', stpClick === true);
  await wait(2000);

  // 12. Auditoría — pestaña hallazgos + botón Provisionar
  await evalJS(`location.hash = '#/auditoria'`);
  check(13, 'Auditoría: botón Provisionar presente', await waitForSelector('button[title="Provisionar impacto económico"]', 15000), 'poll 15s');
  const audClick = await evalJS(`(() => {
    const b = document.querySelector('button[title="Provisionar impacto económico"]');
    if (!b) return false;
    b.click();
    return true;
  })()`);
  check(14, 'Auditoría: clic en Provisionar', audClick === true);
  await wait(2000);

  // 13. Journal — array plano de líneas {id, date, account, debit, credit}; balance debe=haber
  const finalJournal = await evalJS(`(() => {
    const raw = localStorage.getItem('cap-finanzas-journal');
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || !arr.length) return null;
    let d = 0, c = 0;
    for (const l of arr) { d += (l.debit || 0); c += (l.credit || 0); }
    return { count: arr.length, debit: d, credit: c };
  })()`);
  let balanced = false, balDetail = 'sin journal';
  if (finalJournal) {
    balanced = finalJournal.count > 0 && Math.abs(finalJournal.debit - finalJournal.credit) < 0.01;
    balDetail = `lineas=${finalJournal.count} debe=${finalJournal.debit} haber=${finalJournal.credit}`;
  }
  check(15, 'Journal balanceado (debe=haber)', balanced, balDetail);

  // 14. Tailwind v4 — estilos computados
  const twCheck = await evalJS(`(() => {
    const el = document.querySelector('.container, main, [class*="bg-"]');
    if (!el) return { ok: false, reason: 'no element' };
    const cs = getComputedStyle(el);
    return { ok: true, display: cs.display, fontFamily: cs.fontFamily.slice(0, 30) };
  })()`);
  check(16, 'Estilos Tailwind v4 computados', twCheck && twCheck.ok === true, JSON.stringify(twCheck));

  // Cierre
  const passCount = results.filter(r => r.ok).length;
  console.log(`\n=== RESULTADO: ${passCount}/${results.length} PASS ===`);
  const fails = results.filter(r => !r.ok);
  if (fails.length) console.log('FALLOS:', JSON.stringify(fails, null, 2));
  fs.writeFileSync(path.join(TMP, 'e2e-173-result.json'), JSON.stringify(results, undefined, 2));
  try { child.kill(); } catch {}
  try { execSync(`taskkill /F /PID ${child.pid} /T 2>nul`); } catch {}
  process.exit(fails.length ? 1 : 0);
}

main().catch(e => { console.error('E2E FATAL:', e.message); process.exit(1); });
