import { validateComponent } from '../src/validate.js';
import assert from 'node:assert/strict';
assert.ok(validateComponent('const r = await api.getData("sales"); root.textContent = r.length;').ok);
for (const bad of ['fetch("http://x")', 'import x from "y"', 'window.parent.document', 'eval("1")', 'const = ;', '', 'x="</script><img src=x>"']) {
  assert.equal(validateComponent(bad).ok, false, bad);
}
console.log('ok');
