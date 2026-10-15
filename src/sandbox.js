import { validateComponent } from './validate.js';

// El componente corre en un iframe sandbox="allow-scripts" (origen opaco: sin acceso al DOM,
// cookies ni storage del anfitrión) con CSP sin red. El único canal es postMessage -> capacidades.
// Un watchdog por heartbeat destruye el iframe si el hilo se bloquea (bucle infinito).

const CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:";

function buildSrcdoc(code, channel) {
  // Dos scripts inline (sin eval, que el CSP bloquea): primero el puente, luego el código del componente.
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}"></head><body><div id="root"></div>
<script>
(() => {
  const CH = ${JSON.stringify(channel)}, send = (m) => window.parent.postMessage({ ch: CH, ...m }, '*');
  const pending = new Map(); let n = 0;
  const api = { getData: (dataset) => new Promise((resolve, reject) => {
    const id = ++n; pending.set(id, { resolve, reject }); send({ type: 'call', id, name: 'getData', args: { dataset } });
  }) };
  window.addEventListener('message', (e) => {
    const d = e.data; if (!d || d.ch !== CH || d.type !== 'result') return;
    const p = pending.get(d.id); if (!p) return; pending.delete(d.id);
    d.error ? p.reject(new Error(d.error)) : p.resolve(d.value);
  });
  window.addEventListener('error', (e) => send({ type: 'error', message: String(e.message) }));
  setInterval(() => send({ type: 'beat' }), 500);
  window.__aiui = {
    root: document.getElementById('root'), api,
    ready: () => send({ type: 'ready' }),
    fail: (err) => send({ type: 'error', message: String(err) }),
  };
})();
<\/script>
<script>
(function (b) {
  delete window.__aiui;
  (async function (root, api) {
${code}
  })(b.root, b.api).then(b.ready, b.fail);
})(window.__aiui);
<\/script></body></html>`;
}

export function runComponent({ code, container, capabilities = {}, heartbeatMs = 3000, onError = console.error }) {
  const check = validateComponent(code);
  if (!check.ok) throw new Error(check.errors.join('; '));

  const channel = crypto.randomUUID();
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts'); // sin allow-same-origin
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.srcdoc = buildSrcdoc(code, channel);

  let lastBeat = Date.now();
  const watchdog = setInterval(() => {
    if (Date.now() - lastBeat > heartbeatMs) { destroy(); onError(new Error('Componente bloqueado: destruido')); }
  }, 1000);

  async function onMessage(e) {
    if (e.source !== iframe.contentWindow) return;
    const d = e.data; if (!d || d.ch !== channel) return;
    if (d.type === 'beat') lastBeat = Date.now();
    else if (d.type === 'error') onError(new Error(d.message));
    else if (d.type === 'call') {
      const reply = (r) => iframe.contentWindow?.postMessage({ ch: channel, type: 'result', id: d.id, ...r }, '*');
      const fn = Object.hasOwn(capabilities, d.name) ? capabilities[d.name] : null;
      if (!fn) return reply({ error: `Capacidad no permitida: ${d.name}` });
      try { reply({ value: await fn(d.args) }); } catch (err) { reply({ error: String(err.message ?? err) }); }
    }
  }

  function destroy() {
    clearInterval(watchdog);
    window.removeEventListener('message', onMessage);
    iframe.remove();
  }
  window.addEventListener('message', onMessage);
  container.appendChild(iframe);
  return { destroy, iframe };
}
