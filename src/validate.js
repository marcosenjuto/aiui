// Defensa en profundidad: NO es el límite de seguridad (lo es el iframe + CSP).
// Sirve para rechazar pronto código claramente fuera de contrato.

const FORBIDDEN = [
  [/\bimport\b/, 'import'],
  [/\brequire\s*\(/, 'require'],
  [/\bfetch\b/, 'fetch'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bWebSocket\b/, 'WebSocket'],
  [/\bEventSource\b/, 'EventSource'],
  [/\bsendBeacon\b/, 'sendBeacon'],
  [/\beval\b/, 'eval'],
  [/\bFunction\b/, 'Function'],
  [/\bimportScripts\b/, 'importScripts'],
  [/\b(parent|top|opener)\b/, 'parent/top/opener'],
  [/\b(localStorage|sessionStorage|indexedDB|cookie)\b/, 'storage/cookie'],
  [/\bpostMessage\b/, 'postMessage'],
  [/\bWorker\b/, 'Worker'],
];

export const MAX_CODE_LENGTH = 50_000;

export function validateComponent(code) {
  const errors = [];
  if (typeof code !== 'string' || !code.trim()) return { ok: false, errors: ['Código vacío'] };
  if (code.length > MAX_CODE_LENGTH) errors.push('Código demasiado largo');
  for (const [re, name] of FORBIDDEN) if (re.test(code)) errors.push(`Uso no permitido: ${name}`);
  try { new Function('root', 'api', `return (async()=>{${code}\n})`); } // solo sintaxis, no se ejecuta
  catch (e) { errors.push(`Sintaxis inválida: ${e.message}`); }
  return { ok: errors.length === 0, errors };
}
