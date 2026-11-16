// Fails if any data entry lacks provenance, or cites a source that is not registered.
// Every object carrying a number must have exactly one of: src, defined, assumption.
import * as D from '../js/data.js';

const problems = [];
let checked = 0;
const used = new Set();

function visit(node, path) {
  if (Array.isArray(node)) return node.forEach((n, i) => visit(n, `${path}[${n && n.id ? n.id : i}]`));
  if (!node || typeof node !== 'object') return;
  const hasNumber = Object.entries(node).some(([k, v]) => typeof v === 'number' || (k === 'fit' && v && typeof v === 'object'));
  if (hasNumber) {
    checked++;
    const tags = ['src', 'defined', 'assumption'].filter((t) => node[t]);
    if (tags.length !== 1) problems.push(`${path}: needs exactly one of src / defined / assumption (has ${tags.length ? tags.join(', ') : 'none'})`);
    if (node.src) { used.add(node.src); if (!D.SOURCES[node.src]) problems.push(`${path}: unknown source "${node.src}"`); }
    return;
  }
  for (const [k, v] of Object.entries(node)) visit(v, `${path}.${k}`);
}

for (const [name, value] of Object.entries(D)) if (name !== 'SOURCES' && name !== 'SEGMENTS') visit(value, name);
for (const [id, m] of Object.entries(D.REAL_MISSIONS)) { used.add(m.src); if (!D.SOURCES[m.src]) problems.push(`REAL_MISSIONS.${id}: unknown source`); }
for (const o of D.OBJECTIVES) for (const id of o.missions) if (!D.REAL_MISSIONS[id]) problems.push(`OBJECTIVES.${o.id}: unknown mission ${id}`);
for (const [id, s] of Object.entries(D.SOURCES)) for (const f of ['title', 'publisher', 'url', 'usedFor']) if (!s[f]) problems.push(`SOURCES.${id}: missing ${f}`);

if (problems.length) { console.error('Source check FAILED:\n' + problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
console.log(`Source check passed: ${checked} data entries tagged, ${Object.keys(D.SOURCES).length} sources registered, ${used.size} cited by data.`);
