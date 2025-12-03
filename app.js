(function () {

  const usuario = JSON.parse(localStorage.getItem("logado"));
  if (!usuario) {
    window.location.href = "login.html"; 
  }

  const STORAGE_KEY = "bc_appointments_v1";

  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }
  function createEl(tag, attrs = {}, txt = "") {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (txt) el.textContent = txt;
    return el;
  }

  function marcarErro(input, mensagem) {
    if (!input) return;
    input.classList.add("campo-erro");
    let span = input.nextElementSibling;
    if (!span || span.className !== "msg-erro") {
      span = createEl("span", { class: "msg-erro" });
      input.parentNode && input.parentNode.insertBefore(span, input.nextSibling);
    }
    span.textContent = mensagem;
  }
  function limparErro(input) {
    if (!input) return;
    input.classList.remove("campo-erro");
    const span = input.nextElementSibling;
    if (span && span.className === "msg-erro") span.textContent = "";
  }
  function validarObrigatorio(input) {
    if (!input || input.value.trim() === "") {
      marcarErro(input, "Campo obrigatório");
      return false;
    }
    limparErro(input);
    return true;
  }
  function validarDataNaoPassada(input) {
    if (!input) return false;
    if (!input.value) {
      marcarErro(input, "Data inválida");
      return false;
    }
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const escolhida = new Date(input.value);
    escolhida.setHours(0, 0, 0, 0);
    if (isNaN(escolhida.getTime()) || escolhida < hoje) {
      marcarErro(input, "Data inválida ou passada");
      return false;
    }
    limparErro(input);
    return true;
  }
  function validarHora(input) {
    if (!input || !input.value) {
      marcarErro(input, "Horário obrigatório");
      return false;
    }
    limparErro(input);
    return true;
  }
  function escapeHtml(s) {
    if (s == null) return "";
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[m]));
  }

  function salvarAgendamento(obj) {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    arr.push(obj);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function atualizarTabelaAgendamentos() {
    const tbody = qs("#appointmentsTable tbody") || qs("#appointmentsTableBody") || null;
    if (!tbody) return;

    tbody.innerHTML = "";
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    arr.forEach(a => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(a.paciente)}</td>
        <td>${escapeHtml(a.profissional)}</td>
        <td>${escapeHtml(a.data)}</td>
        <td>${escapeHtml(a.hora)}</td>
        <td>${escapeHtml(a.servico)}</td>
        <td>
          <button class="btn ghost btn-edit" data-id="${a.id}">Editar</button>
          <button class="btn ghost btn-delete" data-id="${a.id}">Excluir</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function ensureAppointmentForm() {
    let form = qs("#appointmentForm");
    if (form) return form;

    form = createEl("div", {
      id: "appointmentForm",
      style: "display:none; position:fixed; left:50%; top:20%; transform:translateX(-50%); z-index:9999; background:#fff; padding:18px; box-shadow:0 6px 18px rgba(0,0,0,0.12); border-radius:8px; width:320px;"
    });

    form.innerHTML = `
      <h3 style="margin-top:0">Novo Agendamento</h3>
      <label style="display:block; margin-bottom:8px">Paciente *<br><input id="apptPaciente" class="input" maxlength="60" /></label>
      <label style="display:block; margin-bottom:8px">Profissional *<br><input id="apptProfissional" class="input" maxlength="60" /></label>
      <label style="display:block; margin-bottom:8px">Data *<br><input type="date" id="apptData" class="input" /></label>
      <label style="display:block; margin-bottom:8px">Horário *<br><input type="time" id="apptHora" class="input" /></label>
      <label style="display:block; margin-bottom:8px">Serviço *<br><input id="apptServico" class="input" maxlength="60" /></label>
      <div style="display:flex; gap:8px; margin-top:10px; justify-content:flex-end">
        <button id="cancelAppointment" class="btn ghost">Cancelar</button>
        <button id="saveAppointment" class="btn">Salvar</button>
      </div>
      <div id="msgAgendamentoSucesso" class="msg-success" style="display:none; margin-top:10px; padding:8px; border-radius:6px;"></div>
    `;
    document.body.appendChild(form);

    const styleId = "dynamic-appointment-styles";
    if (!qs("#" + styleId)) {
      const style = createEl("style", { id: styleId });
      style.textContent = `
        .campo-erro { border: 2px solid #ff3b3b !important; }
        .msg-erro { color: #ff3b3b; font-size:12px; display:block; margin-top:6px; }
        .msg-success { background:#4caf50; color:#fff; padding:8px; border-radius:6px; }
      `;
      document.head.appendChild(style);
    }

    return form;
  }

  function findNovoButton() {
    const byId = qs("#openAppointmentNew");
    if (byId) return byId;

    const btns = qsa("button, a");
    const found = btns.find(b => (b.textContent || "").trim() === "+ Novo" || (b.textContent || "").trim().toLowerCase() === "+ novo");
    if (found) return found;

    const plusBtn = btns.find(b => (b.textContent || "").includes("+"));
    if (plusBtn) return plusBtn;

    return null;
  }

  function mostrarUsuarioLogado() {
    const span = qs("#userDisplay");
    if (span && usuario) {
      span.textContent = usuario.nome || usuario.email || "Usuário";
    }
  }

  function init() {
    try {
      mostrarUsuarioLogado();
      const btn = findNovoButton();
      const form = ensureAppointmentForm();

      const inputPaciente = qs("#apptPaciente");
      const inputProf = qs("#apptProfissional");
      const inputData = qs("#apptData");
      const inputHora = qs("#apptHora");
      const btnSalvar = qs("#saveAppointment");
      const btnCancelar = qs("#cancelAppointment");
      const msgSucesso = qs("#msgAgendamentoSucesso");
      const inputServico = qs("#apptServico") || qs("#apptServiço");

      if (btn) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          form.style.display = "block";
          msgSucesso.style.display = "none";
          setTimeout(() => inputPaciente && inputPaciente.focus(), 80);
        });
      }

      btnCancelar && btnCancelar.addEventListener("click", (ev) => {
        ev.preventDefault();
        form.style.display = "none";
        [inputPaciente, inputProf, inputData, inputHora, inputServico].forEach(i => i && (i.value = "", limparErro(i)));
        msgSucesso.style.display = "none";
      });

      btnSalvar && btnSalvar.addEventListener("click", (ev) => {
        ev.preventDefault();
        let valido = true;
        if (!validarObrigatorio(inputPaciente)) valido = false;
        if (!validarObrigatorio(inputProf)) valido = false;
        if (!validarDataNaoPassada(inputData)) valido = false;
        if (!validarHora(inputHora)) valido = false;
        if (!validarObrigatorio(inputServico)) valido = false;
        if (!valido) return;

        const novo = {
          id: Date.now().toString(),
          paciente: inputPaciente.value.trim(),
          profissional: inputProf.value.trim(),
          data: inputData.value,
          hora: inputHora.value,
          servico: inputServico ? inputServico.value.trim() : ""
        };

        salvarAgendamento(novo);

        msgSucesso.textContent = "Agendamento criado com sucesso!";
        msgSucesso.style.display = "block";

        [inputPaciente, inputProf, inputData, inputHora, inputServico].forEach(i => { if (i) i.value = ""; limparErro(i); });

        atualizarTabelaAgendamentos();

        setTimeout(() => form.style.display = "none", 1200);
      });

      document.addEventListener("click", function (e) {
        const del = e.target.closest(".btn-delete");
        if (del) {
          const id = del.getAttribute("data-id");
          if (!id) return;
          let arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          arr = arr.filter(x => x.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
          atualizarTabelaAgendamentos();
          return;
        }
        const ed = e.target.closest(".btn-edit");
        if (ed) {
          const id = ed.getAttribute("data-id");
          if (!id) return;
          const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
          const item = arr.find(x => x.id === id);
          if (!item) return;
          ensureAppointmentForm().style.display = "block";
          qs("#apptPaciente").value = item.paciente;
          qs("#apptProfissional").value = item.profissional;
          qs("#apptData").value = item.data;
          qs("#apptHora").value = item.hora;
          (qs("#apptServico") || qs("#apptServiço")).value = item.servico || "";
          const newArr = arr.filter(x => x.id !== id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newArr));
          atualizarTabelaAgendamentos();
        }
      });

      atualizarTabelaAgendamentos();
    } catch (err) {
      console.error("Erro ao inicializar módulo de agendamentos:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
