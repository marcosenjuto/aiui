# aiui

Componentes de UI generados por IA en la máquina del cliente. Sin npm de terceros, sin dependencias.

Flujo: proveedor (Chrome Prompt API / OpenRouter / Ollama) → validador → iframe sandbox → capacidades explícitas.

- El modelo solo devuelve texto; no tiene herramientas ni red.
- El iframe (`sandbox="allow-scripts"` + CSP `default-src 'none'`) bloquea red y acceso al anfitrión. El validador es solo defensa en profundidad.
- Los datos llegan solo vía `api.getData(dataset)`, validado por el anfitrión.
- Watchdog por heartbeat destruye componentes bloqueados. Límite de memoria: pendiente (requeriría proceso/worker aparte).
- Claves de API: las introduce el usuario; nunca van en la librería.

Demo: `python3 -m http.server` y abrir `index.html`. Test: `npm test`.
