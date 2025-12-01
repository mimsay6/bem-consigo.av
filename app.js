// Js Bem-Consigo — site ofc

const LS_PROF = 'bc_professionals_v1';
const LS_PAT = 'bc_patients_v1';
const LS_APPT = 'bc_appointments_v1';

const sampleProfessionals = [
  { id: 'p1', name: 'Dr. João Silva', specialty: 'Clínico Geral', phone: '(11) 99999-0001' },
  { id: 'p2', name: 'Dra. Maria Costa', specialty: 'Psicóloga', phone: '(11) 99999-0002' },
  { id: 'p3', name: 'Dra. Ana Pereira', specialty: 'Fisioterapeuta', phone: '(11) 99999-0003' }
];

const samplePatients = [
  { id: 'u1', name: 'Lucas Almeida', cpf: '11122233344', phone: '(11) 99999-1001', notes: 'Possui plano X' },
  { id: 'u2', name: 'Mariana Rocha', cpf: '22233344455', phone: '(11) 99999-1002', notes: 'Retorno' }
];

const todayISO = new Date().toISOString().slice(0, 10);

const sampleAppointments = [
  { id: genId(), patientId: 'u1', professionalId: 'p1', service: 'Consulta inicial', date: todayISO, time: '09:30', status: 'pending', notes: 'Primeira consulta' },
  { id: genId(), patientId: 'u2', professionalId: 'p2', service: 'Terapia', date: todayISO, time: '14:00', status: 'confirmed', notes: 'Retorno mensal' }
];

function saveLS(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function loadLS(key, fallback) { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }

let professionals = loadLS(LS_PROF, sampleProfessionals);
let patients = loadLS(LS_PAT, samplePatients);
let appointments = loadLS(LS_APPT, sampleAppointments);

saveLS(LS_PROF, professionals);
saveLS(LS_PAT, patients);
saveLS(LS_APPT, appointments);

const elems = {
  mainMenu: document.getElementById('mainMenu'),
  views: document.querySelectorAll('.view-section'),
  openNewBtn: document.getElementById('openNewBtn'),
  openPatientNew: document.getElementById('openPatientNew'),
  openProfessionalNew: document.getElementById('openProfessionalNew'),
  modal: document.getElementById('modal'),
  modalForm: document.getElementById('modalForm'),
  modalFields: document.getElementById('modalFields'),
  modalTitle: document.getElementById('modalTitle'),
  cancelBtn: document.getElementById('cancelBtn'),
  saveBtn: document.getElementById('saveBtn'),
  loading: document.getElementById('loading'),
  searchInput: document.getElementById('search'),
  statusFilter: document.getElementById('statusFilter'),
  serviceFilter: document.getElementById('serviceFilter'),
  filterProfessional: document.getElementById('filterProfessional'),
  filterDate: document.getElementById('filterDate'),
  filterDateInline: document.getElementById('filterDateInline'),
  clearFilters: document.getElementById('clearFilters'),
  exportCsv: document.getElementById('exportCsv'),
  printBtn: document.getElementById('printBtn'),
  appointmentsTableBody: document.querySelector('#appointmentsTable tbody'),
  patientsTableBody: document.querySelector('#patientsTable tbody'),
  professionalsTableBody: document.querySelector('#professionalsTable tbody'),
  searchCpf: document.getElementById('searchCpf'),
  totalAppts: document.getElementById('totalAppts'),
  pendingAppts: document.getElementById('pendingAppts'),
  confirmedAppts: document.getElementById('confirmedAppts'),
  cancelledAppts: document.getElementById('cancelledAppts')
};

let currentModal = { type: null, mode: 'new', id: null };

function genId() { return 'id_' + Math.random().toString(36).slice(2, 9); }
function formatDate(d) { if (!d) return ''; return d.split('-').reverse().join('/'); }
function statusPill(status) { if (status === 'pending') return '<span class="pill pending">Pendente</span>'; if (status === 'confirmed') return '<span class="pill confirmed">Confirmado</span>'; return '<span class="pill cancelled">Cancelado</span>'; }
function getProfessional(id) { return professionals.find(p => p.id === id) || null; }
function getPatient(id) { return patients.find(p => p.id === id) || null; }
function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function showLoading(show = true) { elems.loading.style.display = show ? 'flex' : 'none'; }

elems.mainMenu.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  const view = li.dataset.view;
  setActiveView(view);
});

function setActiveView(view) {
  document.querySelectorAll('#mainMenu li').forEach(li => li.classList.toggle('active', li.dataset.view === view));
  elems.views.forEach(s => s.style.display = s.id === 'view-' + view ? '' : 'none');
  if (view === 'agenda') renderAppointments();
  if (view === 'pacientes') renderPatients();
  if (view === 'profissionais') renderProfessionals();
  if (view === 'relatorios') renderReports();
}

setActiveView('agenda');

function populateProfessionalsSelects() {
  const sel = elems.filterProfessional;
  sel.innerHTML = '<option value="">Todos os profissionais</option>';
  professionals.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name + (p.specialty ? ' — ' + p.specialty : '');
    sel.appendChild(opt);
  });

  const services = [...new Set(appointments.map(a => a.service).filter(Boolean)
    .concat(['Terapia', 'Nutrição', 'Psicologia', 'Consulta Geral', 'Fisioterapia']))];

  elems.serviceFilter.innerHTML = '<option value="">Todos os serviços</option>';

  services.forEach(s => {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s;
    elems.serviceFilter.appendChild(o);
  });
}

function renderAppointments() {
  populateProfessionalsSelects();
  const q = (elems.searchInput.value || '').toLowerCase();
  const status = elems.statusFilter.value;
  const prof = elems.filterProfessional.value;
  const dateFilterVal = elems.filterDate.value || elems.filterDateInline.value;

  let list = [...appointments];
  elems.appointmentsTableBody.innerHTML = '';

  if (q) list = list.filter(a => {
    const pat = getPatient(a.patientId);
    const profObj = getProfessional(a.professionalId);
    return (pat && pat.name.toLowerCase().includes(q)) ||
           (profObj && profObj.name.toLowerCase().includes(q)) ||
           (a.service || '').toLowerCase().includes(q) ||
           (a.notes || '').toLowerCase().includes(q);
  });

  if (status) list = list.filter(a => a.status === status);
  if (prof) list = list.filter(a => a.professionalId === prof);
  if (dateFilterVal) list = list.filter(a => a.date === dateFilterVal);

  list.sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')));

  if (list.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="7" style="text-align:center;padding:24px;color:#6b7280">Nenhum agendamento encontrado</td>';
    elems.appointmentsTableBody.appendChild(tr);
  } else {
    list.forEach(a => {
      const tr = document.createElement('tr');
      const pat = getPatient(a.patientId) || { name: '—' };
      const profObj = getProfessional(a.professionalId) || { name: '—', specialty: '' };

      tr.innerHTML = `
        <td><strong>${formatDate(a.date)} ${a.time || ''}</strong><small>${a.date}</small></td>
        <td>${escapeHtml(pat.name)}</td>
        <td>${escapeHtml(profObj.name)}<small>${escapeHtml(profObj.specialty)}</small></td>
        <td>${escapeHtml(a.service || '—')}</td>
        <td>${statusPill(a.status)}</td>
        <td>${escapeHtml(a.notes || '')}</td>
        <td class="actions">
          <button class="btn ghost" data-action="toggle" data-id="${a.id}">Estado</button>
          <button class="btn ghost" data-action="edit" data-id="${a.id}">Editar</button>
          <button class="btn ghost" data-action="delete" data-id="${a.id}">Excluir</button>
        </td>
      `;

      elems.appointmentsTableBody.appendChild(tr);
    });

    elems.appointmentsTableBody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === 'edit') openAppointmentModal('edit', id);
        if (action === 'delete') deleteAppointment(id);
        if (action === 'toggle') toggleStatus(id);
      });
    });
  }
}

function openAppointmentModal(mode = 'new', id = null) {
  currentModal = { type: 'appointment', mode, id };
  elems.modalTitle.textContent = mode === 'new' ? 'Novo agendamento' : 'Editar agendamento';
  elems.modalFields.innerHTML = '';

  const patientInput = document.createElement('input');
  patientInput.className = 'input';
  patientInput.name = 'patientName';
  patientInput.placeholder = 'Digite o nome do paciente';
  patientInput.required = true;

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.className = 'input';
  dateInput.name = 'date';
  dateInput.required = true;

  const timeInput = document.createElement('input');
  timeInput.type = 'time';
  timeInput.className = 'input';
  timeInput.name = 'time';
  timeInput.required = true;

  const serviceInput = document.createElement('input');
  serviceInput.className = 'input';
  serviceInput.name = 'service';
  serviceInput.placeholder = 'Ex: Consulta psicológica, retorno clínico';

  const notesInput = document.createElement('textarea');
  notesInput.className = 'input';
  notesInput.name = 'notes';
  notesInput.rows = 3;

  const statusSelect = document.createElement('select');
  statusSelect.className = 'input';
  statusSelect.name = 'status';

  ['pending', 'confirmed', 'cancelled'].forEach(s => {
    const o = document.createElement('option');
    o.value = s;
    o.textContent = s === 'pending' ? 'Pendente' : s === 'confirmed' ? 'Confirmado' : 'Cancelado';
    statusSelect.appendChild(o);
  });

  const divGrid1 = document.createElement('div');
  divGrid1.className = 'grid-2';

  const professionalSelect = document.createElement('select');
  professionalSelect.className = 'input';
  professionalSelect.name = 'professionalId';
  professionalSelect.required = true;

  professionals.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name + (p.specialty ? ' — ' + p.specialty : '');
    professionalSelect.appendChild(o);
  });

  divGrid1.appendChild(patientInput);
  divGrid1.appendChild(professionalSelect);
  elems.modalFields.appendChild(divGrid1);

  const divGrid2 = document.createElement('div');
  divGrid2.className = 'grid-2';

  const lblDate = document.createElement('label');
  lblDate.textContent = 'Data';
  lblDate.appendChild(dateInput);

  const lblTime = document.createElement('label');
  lblTime.textContent = 'Hora';
  lblTime.appendChild(timeInput);

  divGrid2.appendChild(lblDate);
  divGrid2.appendChild(lblTime);
  elems.modalFields.appendChild(divGrid2);

  const lblService = document.createElement('label');
  lblService.textContent = 'Serviço';
  lblService.appendChild(serviceInput);
  elems.modalFields.appendChild(lblService);

  const lblNotes = document.createElement('label');
  lblNotes.textContent = 'Observações';
  lblNotes.appendChild(notesInput);
  elems.modalFields.appendChild(lblNotes);

  if (mode === 'edit') {
    const lblStatus = document.createElement('label');
    lblStatus.textContent = 'Status';
    lblStatus.appendChild(statusSelect);
    elems.modalFields.appendChild(lblStatus);
  }

  if (mode === 'edit' && id) {
    const ap = appointments.find(a => a.id === id);
    if (ap) {
      professionalSelect.value = ap.professionalId;
      dateInput.value = ap.date;
      timeInput.value = ap.time;
      serviceInput.value = ap.service;
      notesInput.value = ap.notes || '';
      statusSelect.value = ap.status;
    }
  } else {
    dateInput.value = todayISO;
    timeInput.value = '09:00';
  }

  openModal();
}

function saveAppointmentFromModal(ev) {
  ev.preventDefault();

  const f = new FormData(elems.modalForm);
  if (currentModal.type !== 'appointment') return;

  const patientName = f.get('patientName').trim();

  // PROCURAR PACIENTE JÁ CADASTRADO PELO NOME
  let patient = patients.find(p => 
    p.name.toLowerCase() === patientName.toLowerCase()
  );

  // SE NÃO EXISTE, CRIAR AUTOMATICAMENTE UM NOVO PACIENTE
  if (!patient) {
    patient = {
      id: genId(),
      name: patientName,
      cpf: "",
      phone: "",
      notes: ""
    };
    patients.push(patient);
    saveLS(LS_PAT, patients);
    renderPatients();
  }

  const data = {
    patientId: patient.id, 
    professionalId: f.get('professionalId'),
    date: f.get('date'),
    time: f.get('time'),
    service: f.get('service'),
    notes: f.get('notes'),
    status: f.get('status') || 'pending'
  };

  if (!data.date) return alert('Escolha uma data.');
  if (!data.time) return alert('Escolha uma hora.');
  if (!data.professionalId) return alert('Selecione um profissional.');

  if (currentModal.mode === 'new') {
    const newAp = Object.assign({ id: genId() }, data);
    appointments.push(newAp);
  } else {
    const idx = appointments.findIndex(a => a.id === currentModal.id);
    if (idx === -1) return alert('Agendamento não encontrado.');
    appointments[idx] = Object.assign(appointments[idx], data);
  }

  saveLS(LS_APPT, appointments);
  closeModal();
  renderAppointments();
  renderReports();
  populateProfessionalsSelects();
}
function deleteAppointment(id) {
if (!confirm('Excluir este agendamento?')) return;
appointments = appointments.filter(a => a.id !== id);
saveLS(LS_APPT, appointments);
renderAppointments();
renderReports();
}

function toggleStatus(id) {
  const ap = appointments.find(a => a.id === id);
  if (!ap) return;
  const order = ['pending', 'confirmed', 'cancelled'];
  ap.status = order[(order.indexOf(ap.status) + 1) % order.length];
  saveLS(LS_APPT, appointments);
  renderAppointments();
  renderReports();
}

function renderPatients() {
  elems.patientsTableBody.innerHTML = '';
  if (patients.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="text-align:center;padding:24px;color:#6b7280">Nenhum paciente cadastrado</td>';
    elems.patientsTableBody.appendChild(tr);
    return;
  }

  patients.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(formatCPF(p.cpf))}</td>
      <td>${escapeHtml(p.phone || '')}</td>
      <td>${escapeHtml(p.notes || '')}</td>
      <td class="actions">
        <button class="btn ghost" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn ghost" data-action="delete" data-id="${p.id}">Excluir</button>
      </td>
    `;
    elems.patientsTableBody.appendChild(tr);
  });

  elems.patientsTableBody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openPatientModal('edit', id);
      if (action === 'delete') deletePatient(id);
    });
  });
}

function openPatientModal(mode = 'new', id = null) {
  currentModal = { type: 'patient', mode, id };
  elems.modalTitle.textContent = mode === 'new' ? 'Novo paciente' : 'Editar paciente';
  elems.modalFields.innerHTML = '';

  const nameInput = document.createElement('input');
  nameInput.className = 'input';
  nameInput.name = 'name';
  nameInput.required = true;

  const cpfInput = document.createElement('input');
  cpfInput.className = 'input';
  cpfInput.name = 'cpf';
  cpfInput.placeholder = 'Apenas números (ex: 12345678901)';
  cpfInput.maxLength = 11;

  const phoneInput = document.createElement('input');
  phoneInput.className = 'input';
  phoneInput.name = 'phone';

  const notesInput = document.createElement('textarea');
  notesInput.className = 'input';
  notesInput.name = 'notes';
  notesInput.rows = 3;

  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.appendChild(nameInput);
  grid.appendChild(cpfInput);

  elems.modalFields.appendChild(grid);
  elems.modalFields.appendChild(phoneInput);
  elems.modalFields.appendChild(notesInput);

  if (mode === 'edit' && id) {
    const p = patients.find(x => x.id === id);
    if (p) {
      nameInput.value = p.name;
      cpfInput.value = p.cpf;
      phoneInput.value = p.phone;
      notesInput.value = p.notes;
    }
  }

  openModal();
}

function savePatientFromModal(ev) {
  ev.preventDefault();
  const f = new FormData(elems.modalForm);
  if (currentModal.type !== 'patient') return;

  const data = {
    name: f.get('name'),
    cpf: (f.get('cpf') || '').replace(/\D/g, ''),
    phone: f.get('phone'),
    notes: f.get('notes')
  };

  if (!data.name) return alert('Nome é obrigatório.');
  if (data.cpf && !/^\d{11}$/.test(data.cpf)) return alert('CPF inválido. Use 11 dígitos.');

  if (currentModal.mode === 'new') {
    if (data.cpf && patients.some(p => p.cpf === data.cpf)) return alert('CPF já cadastrado.');
    const newP = Object.assign({ id: genId() }, data);
    patients.push(newP);
  } else {
    const idx = patients.findIndex(p => p.id === currentModal.id);
    if (idx === -1) return alert('Paciente não encontrado.');
    patients[idx] = Object.assign(patients[idx], data);
  }

  saveLS(LS_PAT, patients);
  closeModal();
  renderPatients();
  renderAppointments();
}

function deletePatient(id) {
  if (!confirm('Excluir este paciente? Todos os agendamentos relacionados permanecerão sem paciente.')) return;
  patients = patients.filter(p => p.id !== id);
  appointments = appointments.map(a => a.patientId === id ? Object.assign(a, { patientId: null }) : a);
  saveLS(LS_PAT, patients);
  saveLS(LS_APPT, appointments);
  renderPatients();
  renderAppointments();
}

function renderProfessionals() {
  elems.professionalsTableBody.innerHTML = '';
  if (professionals.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4" style="text-align:center;padding:24px;color:#6b7280">Nenhum profissional cadastrado</td>';
    elems.professionalsTableBody.appendChild(tr);
    return;
  }

  professionals.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.specialty || '')}</td>
      <td>${escapeHtml(p.phone || '')}</td>
      <td class="actions">
        <button class="btn ghost" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn ghost" data-action="delete" data-id="${p.id}">Excluir</button>
      </td>
    `;
    elems.professionalsTableBody.appendChild(tr);
  });

  elems.professionalsTableBody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openProfessionalModal('edit', id);
      if (action === 'delete') deleteProfessional(id);
    });
  });
}

function openProfessionalModal(mode = 'new', id = null) {
  currentModal = { type: 'professional', mode, id };
  elems.modalTitle.textContent = mode === 'new' ? 'Novo profissional' : 'Editar profissional';
  elems.modalFields.innerHTML = '';

  const nameInput = document.createElement('input');
  nameInput.className = 'input';
  nameInput.name = 'name';
  nameInput.required = true;

  const specialtyInput = document.createElement('input');
  specialtyInput.className = 'input';
  specialtyInput.name = 'specialty';

  const phoneInput = document.createElement('input');
  phoneInput.className = 'input';
  phoneInput.name = 'phone';

  const grid = document.createElement('div');
  grid.className = 'grid-2';
  grid.appendChild(nameInput);
  grid.appendChild(specialtyInput);

  elems.modalFields.appendChild(grid);
  elems.modalFields.appendChild(phoneInput);

  if (mode === 'edit' && id) {
    const p = professionals.find(x => x.id === id);
    if (p) {
      nameInput.value = p.name;
      specialtyInput.value = p.specialty;
      phoneInput.value = p.phone;
    }
  }

  openModal();
}
function openModal() {
  elems.modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const f = elems.modal.querySelector('.input');
    if (f) f.focus();
  }, 80);
}

function closeModal() {
  elems.modal.style.display = 'none';
  document.body.style.overflow = 'auto';
  currentModal = { type: null, mode: 'new', id: null };
  elems.modalForm.reset();
  elems.modalFields.innerHTML = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && elems.modal.style.display === 'flex') closeModal();
});

elems.cancelBtn.addEventListener('click', e => {
  e.preventDefault();
  closeModal();
});

elems.modalForm.addEventListener('submit', e => {
  if (currentModal.type === 'appointment') return saveAppointmentFromModal(e);
  if (currentModal.type === 'patient') return savePatientFromModal(e);
  if (currentModal.type === 'professional') return saveProfessionalFromModal(e);
});

elems.openNewBtn.addEventListener('click', () => openAppointmentModal('new', null));
elems.openPatientNew.addEventListener('click', () => openPatientModal('new', null));
elems.openProfessionalNew.addEventListener('click', () => openProfessionalModal('new', null));

[
  elems.searchInput,
  elems.statusFilter,
  elems.serviceFilter,
  elems.filterProfessional,
  elems.filterDate,
  elems.filterDateInline
].forEach(el => {
  if (el) el.addEventListener('input', () => renderAppointments());
});

elems.clearFilters.addEventListener('click', () => {
  elems.searchInput.value = '';
  elems.statusFilter.value = '';
  elems.serviceFilter.value = '';
  elems.filterProfessional.value = '';
  elems.filterDate.value = '';
  elems.filterDateInline.value = '';
  renderAppointments();
});

elems.searchCpf.addEventListener('input', e => {
  const q = (e.target.value || '').replace(/\D/g, '');
  if (!q) {
    renderPatients();
    return;
  }

  const found = patients.filter(p => p.cpf && p.cpf.includes(q));
  elems.patientsTableBody.innerHTML = '';

  if (found.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" style="text-align:center;padding:24px;color:#6b7280">Nenhum paciente encontrado</td>';
    elems.patientsTableBody.appendChild(tr);
    return;
  }

  found.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(formatCPF(p.cpf))}</td>
      <td>${escapeHtml(p.phone || '')}</td>
      <td>${escapeHtml(p.notes || '')}</td>
      <td class="actions">
        <button class="btn ghost" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn ghost" data-action="delete" data-id="${p.id}">Excluir</button>
      </td>
    `;
    elems.patientsTableBody.appendChild(tr);
  });

  elems.patientsTableBody.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit') openPatientModal('edit', id);
      if (action === 'delete') deletePatient(id);
    });
  });
});

elems.exportCsv.addEventListener('click', exportCsvCurrent);
elems.printBtn.addEventListener('click', () => window.print());

function init() {
  showLoading(true);
  setTimeout(() => {
    showLoading(false);
    populateProfessionalsSelects();
    renderAppointments();
    renderPatients();
    renderProfessionals();
    renderReports();
  }, 300);
}

init();
