/* ===== CeRBERO - Rubrica.js (completo, tema da storage.js, vCard fixed) ===== */

/* ---------- STORAGE ---------- */
const STORAGE_KEY = 'cerbero_contacts';
let contacts = [];
let editingId = null;

/* ---------- MODAL UTILS (tema gestito da storage.js) ---------- */
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
function showConfirmModal(title, text, onConfirm) {
  const modal = document.getElementById('confirm-modal');
  const titleEl = modal.querySelector('.modal-title');
  const textEl  = modal.querySelector('#confirm-text');
  const okBtn   = modal.querySelector('#confirm-ok');
  titleEl.textContent = title;
  textEl.textContent  = text;
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', () => { onConfirm(); closeModal('confirm-modal'); });
  openModal('confirm-modal');
}

/* ---------- STORAGE HELPERS ---------- */
function loadContacts() {
  contacts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

/* ---------- RENDER ---------- */
function renderContacts(filterText = '') {
  const container = document.getElementById('contacts-container');
  const empty = document.getElementById('empty-state');
  let list = contacts.filter(c => c && c.id && (c.name || c.surname));
  if (filterText) {
    const f = filterText.toLowerCase();
    list = list.filter(c =>
      `${c.name} ${c.surname} ${c.company} ${c.email} ${c.phone} ${c.notes}`.toLowerCase().includes(f)
    );
  }
  list.sort((a, b) => `${a.surname || ''} ${a.name || ''}`.localeCompare(`${b.surname || ''} ${b.name || ''}`));
  container.innerHTML = list.map(c => `
    <div class="contact-card" onclick="openEditModal(${c.id})">
      <div class="contact-name">${c.name || ''} ${c.surname || ''}</div>
      ${c.company ? `<div class="contact-company">${c.company}</div>` : ''}
      ${c.phone ? `<div class="contact-detail"><i class="fa-solid fa-phone"></i>${c.phone}</div>` : ''}
      ${c.email ? `<div class="contact-detail"><i class="fa-solid fa-envelope"></i>${c.email}</div>` : ''}
    </div>
  `).join('');
  empty.style.display = list.length ? 'none' : 'block';
}

/* ---------- EVENT BINDING ---------- */
function bindEvents() {
  /* search */
  const search = document.getElementById('searchInput');
  const clear  = document.getElementById('clearSearch');
  search.addEventListener('input', () => {
    clear.style.display = search.value ? 'block' : 'none';
    renderContacts(search.value);
  });
  clear.addEventListener('click', () => { search.value = ''; renderContacts(); });

  /* buttons */
  document.getElementById('new-contact-btn').addEventListener('click', () => openEditModal());
  document.getElementById('import-btn').addEventListener('click', () => document.getElementById('import-file').click());
  document.getElementById('export-btn').addEventListener('click', exportVCF);
  document.getElementById('print-btn').addEventListener('click', printContacts);
  document.getElementById('delete-all-btn').addEventListener('click', deleteAll);
  document.getElementById('import-file').addEventListener('change', importVCF);

  /* info – il tema è già inizializzato da storage.js */
  document.getElementById('info-btn').addEventListener('click', () => openModal('info-modal'));
}

/* ---------- CRUD ---------- */
function openEditModal(id = null) {
  editingId = id;
  const form = document.getElementById('contact-form');
  form.reset();
  document.getElementById('contact-id').value = id || '';
  document.getElementById('contact-modal-title').textContent = id ? 'Modifica Contatto' : 'Nuovo Contatto';
  document.getElementById('delete-contact-btn').style.display = id ? 'inline-flex' : 'none';
  if (id) {
    const c = contacts.find(c => c.id === id);
    ['name', 'surname', 'company', 'email', 'phone', 'notes'].forEach(k => {
      document.getElementById(`contact-${k}`).value = c[k] || '';
    });
  }
  openModal('contact-modal');
}

function saveContact() {
  const data = {
    name:    document.getElementById('contact-name').value.trim(),
    surname: document.getElementById('contact-surname').value.trim(),
    company: document.getElementById('contact-company').value.trim(),
    email:   document.getElementById('contact-email').value.trim(),
    phone:   document.getElementById('contact-phone').value.trim(),
    notes:   document.getElementById('contact-notes').value.trim()
  };
  if (!data.name && !data.surname) { alert('Nome o cognome obbligatori'); return; }
  if (editingId) {
    const idx = contacts.findIndex(c => c.id === editingId);
    contacts[idx] = { ...contacts[idx], ...data };
  } else {
    contacts.push({ ...data, id: Date.now() });
  }
  saveContacts();
  renderContacts();
  closeModal('contact-modal');
}

function deleteContact() {
  contacts = contacts.filter(c => c.id !== editingId);
  saveContacts();
  renderContacts();
  closeModal('contact-modal');
}

function deleteAll() {
  showConfirmModal('Eliminare TUTTI i contatti?', 'L\'azione è irreversibile.', () => {
    contacts = [];
    saveContacts();
    renderContacts();
  });
}

/* ---------- IMPORT / EXPORT ---------- */
function importVCF(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const vcards = reader.result.split('BEGIN:VCARD').slice(1);
    let imported = 0;
    vcards.forEach(raw => {
      const contact = parseVCard('BEGIN:VCARD' + raw);
      if (contact && (contact.name || contact.surname)) {
        contacts.push({ ...contact, id: Date.now() + imported++ });
      }
    });
    if (imported) {
      saveContacts();
      renderContacts();
      showMessage(`${imported} contatto/i importati`, 'success');
    } else {
      showMessage('Nessun contatto valido trovato', 'warning');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

function exportVCF() {
  const vcf = contacts.map(c => {
    let out = 'BEGIN:VCARD\nVERSION:3.0\n';
    out += `N:${c.surname || ''};${c.name || ''};;;\n`;
    out += `FN:${c.name || ''} ${c.surname || ''}\n`;
    if (c.phone) out += `TEL:${c.phone}\n`;
    if (c.email) out += `EMAIL:${c.email}\n`;
    if (c.company) out += `ORG:${c.company}\n`;
    if (c.notes) out += `NOTE:${c.notes}\n`;
    out += 'END:VCARD\n';
    return out;
  }).join('');
  download('cerbero_contatti.vcf', vcf, 'text/vcard');
}

function printContacts() {
  const win = window.open('', '_blank');
  win.document.write('<html><head><title>Rubrica</title></head><body>');
  contacts.forEach(c => {
    win.document.write(`<h3>${c.name} ${c.surname}</h3>`);
    if (c.company) win.document.write(`<p><b>Azienda:</b> ${c.company}</p>`);
    if (c.phone) win.document.write(`<p><b>Tel:</b> ${c.phone}</p>`);
    if (c.email) win.document.write(`<p><b>Email:</b> ${c.email}</p>`);
    if (c.notes) win.document.write(`<p><b>Note:</b> ${c.notes}</p>`);
    win.document.write('<hr>');
  });
  win.document.write('</body></html>');
  win.document.close();
  win.print();
}

/* ---------- PARSER VCARD ROBUSTO ---------- */
function parseVCard(str) {
  const lines = str.split(/\r?\n/);
  let contact = { name: '', surname: '', company: '', email: '', phone: '', notes: '' };
  let currentKey = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (currentKey) contact[currentKey] += line.trim();
      continue;
    }

    const [head, ...valueParts] = line.split(':');
    if (!head) continue;
    const value = valueParts.join(':').replace(/\\,/g, ',').replace(/\\;/g, ';');

    const key = head.split(';')[0].toUpperCase();
    switch (key) {
      case 'N':
        const parts = value.split(';');
        contact.surname = parts[0] || '';
        contact.name    = parts[1] || '';
        break;
      case 'FN':
        const [n, ...s] = value.trim().split(' ');
        contact.name   = n || '';
        contact.surname = s.join(' ') || '';
        break;
      case 'ORG':
        contact.company = value.split(';')[0];
        break;
      case 'EMAIL':
        contact.email = value;
        break;
      case 'TEL':
        contact.phone = value.replace(/[^+\d]/g, '');
        break;
      case 'NOTE':
        contact.notes = value;
        break;
    }
    currentKey = null;
  }

  return (contact.name || contact.surname) ? contact : null;
}

/* ---------- DOWNLOAD HELPER ---------- */
function download(filename, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init(); // Inizializza il tema
  loadContacts();
  renderContacts();
  bindEvents();
});