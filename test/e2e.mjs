import { createRequire } from 'module';
const { chromium } = createRequire(process.env.PW_MODULES || '/node-tools/node_modules/')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const cases = { valid: 'const r = await api.getData("sales"); root.textContent="filas:"+r.length', infinite: 'while(true){}', hostAccess: 'try{ root.textContent = String(window["par"+"ent"].document.title) }catch(e){ root.textContent="SecurityError:"+e.name }' };
for (const [name, code] of Object.entries(cases)) {
  const p = await b.newPage(); await p.goto('http://localhost:8123/index.html');
  const r = await p.evaluate(async (code) => {
    const { runComponent } = await import('/src/index.js'); const t0 = Date.now(); const ev = [];
    let ticks = 0; const iv = setInterval(() => ticks++, 100);
    const h = runComponent({ code, container: document.body, capabilities: { getData: async () => [1,2] }, heartbeatMs: 2000, onError: e => ev.push([e.message, Date.now()-t0]) });
    await new Promise(r => setTimeout(r, 5000)); clearInterval(iv);
    return { ev, hostTicks: ticks, alive: document.contains(h.iframe) };
  }, code);
  const f = p.frames().find(f => f !== p.mainFrame());
  const text = f ? await f.evaluate(() => document.body.innerText).catch(() => '(frame colgado)') : '(destruido)';
  console.log(name, JSON.stringify(r), 'texto:', text); await p.close();
}
await b.close();
