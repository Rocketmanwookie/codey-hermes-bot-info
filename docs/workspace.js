const KEY = 'codey-chief-architect-workspace-v1';
const blankProject = () => ({ id: crypto.randomUUID(), name: 'Untitled project', objective: '', status: 'Discovery', architecture: '', constraints: '', requirements: [], tasks: [], decisions: [], tests: [] });
let store = JSON.parse(localStorage.getItem(KEY) || 'null') || { projects: [blankProject()], active: null };
if (!store.active) store.active = store.projects[0].id;
const $ = (selector) => document.querySelector(selector);
const current = () => store.projects.find(project => project.id === store.active);
const save = () => { localStorage.setItem(KEY, JSON.stringify(store)); render(); };
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));

function render() {
  const project = current();
  $('#project-select').innerHTML = store.projects.map(p => `<option value="${p.id}" ${p.id === project.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  $('#project-title').textContent = project.name;
  $('#name-input').value = project.name; $('#objective-input').value = project.objective; $('#status-input').value = project.status;
  $('#architecture-input').value = project.architecture; $('#constraints-input').value = project.constraints;
  const done = project.tasks.filter(task => task.status === 'Complete').length;
  $('#stats').innerHTML = [[project.requirements.length,'Requirements'],[project.tasks.length,'Task contracts'],[done,'Tasks complete'],[project.decisions.length,'Decisions']].map(([n,label]) => `<div class="stat"><strong>${n}</strong><span>${label}</span></div>`).join('');
  $('#next-move').textContent = nextMove(project);
  renderItems('requirements', project.requirements, requirementItem);
  renderItems('tasks', project.tasks, taskItem);
  renderItems('decisions', project.decisions, decisionItem);
  renderItems('tests', project.tests, testItem);
  $('#handoff-output').textContent = handoff(project);
}
function nextMove(p) { if (!p.objective) return 'Capture the objective and constraints, then define the architecture before implementation begins.'; if (!p.architecture) return 'Define the architecture, module boundaries, and constraints before delegating implementation.'; if (!p.tasks.length) return 'Turn the approved architecture into bounded task contracts with clear verification.'; if (!p.tests.length) return 'Create verification requirements before implementation is considered complete.'; return `Continue ${p.status.toLowerCase()} while reviewing each task against the architecture and acceptance criteria.`; }
function renderItems(type, items, formatter) { const root = $(`#${type}-list`); root.innerHTML = items.length ? items.map((item, index) => formatter(item, index)).join('') : `<div class="card"><h2>No ${type} yet</h2><p class="lede">Add the first item to make this project traceable and ready to coordinate.</p></div>`; }
function actionButtons(type,index) { return `<div class="item-actions"><button class="secondary edit-item" data-type="${type}" data-index="${index}">Edit</button><button class="secondary delete delete-item" data-type="${type}" data-index="${index}">Delete</button></div>`; }
function requirementItem(item,i) { return `<article class="item"><h2>${esc(item.title)}</h2><p>${esc(item.detail)}</p><div class="tags"><span class="tag">${esc(item.priority)} priority</span><span class="tag">${esc(item.status)}</span></div>${actionButtons('requirements',i)}</article>`; }
function taskItem(item,i) { return `<article class="item"><h2>${esc(item.objective)}</h2><p>${esc(item.context)}</p><div class="tags"><span class="tag">${esc(item.owner)}</span><span class="tag">${esc(item.status)}</span><span class="tag">${esc(item.acceptance || 'Acceptance criteria pending')}</span></div>${actionButtons('tasks',i)}</article>`; }
function decisionItem(item,i) { return `<article class="item"><h2>${esc(item.title)}</h2><p><strong>Decision:</strong> ${esc(item.decision)}\n\n<strong>Rationale:</strong> ${esc(item.rationale)}</p><div class="tags"><span class="tag">${esc(item.status)}</span></div>${actionButtons('decisions',i)}</article>`; }
function testItem(item,i) { return `<article class="item"><h2>${esc(item.title)}</h2><p>${esc(item.detail)}</p><div class="tags"><span class="tag">${esc(item.level)}</span><span class="tag">${esc(item.status)}</span></div>${actionButtons('tests',i)}</article>`; }
function handoff(p) { return `CODEY — DEVELOPMENT HANDOFF\n\nPROJECT: ${p.name}\nSTATUS: ${p.status}\n\nOBJECTIVE\n${p.objective || 'Not yet defined.'}\n\nARCHITECTURE\n${p.architecture || 'Not yet defined.'}\n\nCONSTRAINTS & STANDARDS\n${p.constraints || 'Not yet defined.'}\n\nREQUIREMENTS\n${p.requirements.length ? p.requirements.map((r,i)=>`${i+1}. [${r.priority}] ${r.title} — ${r.detail}`).join('\n') : 'None recorded.'}\n\nTASK CONTRACTS\n${p.tasks.length ? p.tasks.map((t,i)=>`${i+1}. ${t.objective}\n   Owner: ${t.owner}; Status: ${t.status}\n   Context: ${t.context}\n   Acceptance criteria: ${t.acceptance}`).join('\n') : 'None recorded.'}\n\nDECISIONS\n${p.decisions.length ? p.decisions.map((d,i)=>`${i+1}. ${d.title}: ${d.decision} (${d.status})`).join('\n') : 'None recorded.'}\n\nVERIFICATION\n${p.tests.length ? p.tests.map((t,i)=>`${i+1}. [${t.level}] ${t.title}: ${t.detail}`).join('\n') : 'None recorded.'}`; }

const schemas = {
  requirements: { title:'Requirement', detail:'Details', priority:['Priority','Must','Should','Could'], status:['Status','Proposed','Approved','Implemented','Verified'] },
  tasks: { objective:'Objective', context:'Context', owner:'Owner / assigned agent', acceptance:'Acceptance criteria', status:['Status','Planned','In progress','Review','Complete','Blocked'] },
  decisions: { title:'ADR title', decision:'Decision', rationale:'Rationale and tradeoffs', status:['Status','Proposed','Accepted','Superseded'] },
  tests: { title:'Test requirement', detail:'Scope and acceptance criteria', level:['Level','Unit','Integration','System','Acceptance','Security'], status:['Status','Planned','Implemented','Passed','Blocked'] }
};
let editState = null;
function openEditor(type, index = null) {
  editState = {type,index}; const existing = index === null ? {} : current()[type][index];
  $('#editor-title').textContent = index === null ? `Add ${type.slice(0,-1)}` : `Edit ${type.slice(0,-1)}`;
  $('#editor-fields').innerHTML = Object.entries(schemas[type]).map(([key, label]) => Array.isArray(label) ? `<label>${label[0]}<select name="${key}">${label.slice(1).map(v=>`<option ${existing[key]===v?'selected':''}>${v}</option>`).join('')}</select></label>` : `<label>${label}<textarea name="${key}" required>${esc(existing[key] || '')}</textarea></label>`).join('');
  $('#editor').showModal();
}
document.addEventListener('click', event => {
  const nav = event.target.closest('.nav'); if (nav) { document.querySelectorAll('.nav,.view').forEach(el=>el.classList.remove('active')); nav.classList.add('active'); $(`#${nav.dataset.view}`).classList.add('active'); }
  const add = event.target.closest('[data-add]'); if (add) openEditor(add.dataset.add);
  const edit = event.target.closest('.edit-item'); if (edit) openEditor(edit.dataset.type, Number(edit.dataset.index));
  const del = event.target.closest('.delete-item'); if (del && confirm('Delete this item?')) { current()[del.dataset.type].splice(Number(del.dataset.index),1); save(); }
});
$('#editor-form').addEventListener('submit', event => { if (event.submitter.value === 'cancel') return; event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); const list = current()[editState.type]; if (editState.index === null) list.push(values); else list[editState.index] = values; $('#editor').close(); save(); });
$('#project-select').addEventListener('change', e => { store.active=e.target.value; save(); });
$('#new-project').addEventListener('click', () => { const p=blankProject(); store.projects.push(p); store.active=p.id; save(); });
$('#save-overview').addEventListener('click', () => { const p=current(); p.name=$('#name-input').value.trim()||'Untitled project'; p.objective=$('#objective-input').value.trim(); p.status=$('#status-input').value; save(); });
$('#save-architecture').addEventListener('click', () => { const p=current(); p.architecture=$('#architecture-input').value.trim(); p.constraints=$('#constraints-input').value.trim(); save(); });
$('#copy-handoff').addEventListener('click', async () => { await navigator.clipboard.writeText($('#handoff-output').textContent); $('#copy-handoff').textContent='Copied'; setTimeout(()=>$('#copy-handoff').textContent='Copy handoff',1500); });
$('#export-project').addEventListener('click', () => { const blob=new Blob([JSON.stringify(current(),null,2)],{type:'application/json'}); const link=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`${current().name.toLowerCase().replace(/[^a-z0-9]+/g,'-')||'codey-project'}.json`}); link.click(); URL.revokeObjectURL(link.href); });
render();
