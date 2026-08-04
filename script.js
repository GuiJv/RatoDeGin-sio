// ── CONFIG ──
let CFG = {};
// ── WORKOUTS ──
let workouts = [];


function loadConfig() {
  const raw = localStorage.getItem('gymduo_config');
  if (raw) {
    CFG = JSON.parse(raw);
    applyNames();
    document.getElementById('config-overlay').classList.add('hidden');
    loadWorkouts();
  }
}

function saveConfig() {
  const sheetId = document.getElementById('cfg-sheet-id').value.trim();
  const p1 = document.getElementById('cfg-p1').value.trim();
  const p2 = document.getElementById('cfg-p2').value.trim();
  const script = document.getElementById('cfg-script').value.trim();
  const currentPerson = document.getElementById('cfg-role').value;
  if (!sheetId || !p1 || !p2 || !script || !currentPerson) {
    showToast('Preencha todos os campos!'); return;
  }
  CFG = { sheetId, p1, p2, script , currentPerson };
  localStorage.setItem('gymduo_config', JSON.stringify(CFG));
  applyNames();
  document.getElementById('config-overlay').classList.add('hidden');
  loadWorkouts();
}

function showConfig() {
  if (CFG.sheetId) {
    document.getElementById('cfg-sheet-id').value = CFG.sheetId;
    document.getElementById('cfg-p1').value = CFG.p1;
    document.getElementById('cfg-p2').value = CFG.p2;
    document.getElementById('cfg-script').value = CFG.script;
  }
  document.getElementById('config-overlay').classList.remove('hidden');
}

function applyNames() {
  document.getElementById('name-p1').textContent = CFG.p1;
  document.getElementById('name-p2').textContent = CFG.p2;
  document.getElementById('opt-p1').textContent = CFG.p1;
  document.getElementById('opt-p2').textContent = CFG.p2;
}


async function loadWorkouts() {
  const feed = document.getElementById('feed');
  feed.innerHTML = '<div class="spinner"><span class="dot-pulse">Carregando</span></div>';

  try {
    const url = `https://docs.google.com/spreadsheets/d/${CFG.sheetId}/gviz/tq?tqx=out:json&sheet=Treinos`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/)[1]);
    const rows = json.table.rows || [];
    workouts = rows.map((r, i) => ({
      id: r.c[0]?.v || i,
      person: r.c[1]?.v || '',
      type: r.c[2]?.v || 'outro',
      title: r.c[3]?.v || '',
      duration: r.c[4]?.v || '',
      feeling: r.c[5]?.v || '',
      notes: r.c[6]?.v || '',
      photo: r.c[7]?.v || '',
      date: r.c[8]?.v || '',
    })).reverse();
    renderFeed();
    updateStreaks();
  } catch(e) {
    console.log(e);
    feed.innerHTML = '<div class="empty-state"><span class="big">SEM DADOS</span>Erro ao carregar. Verifique o ID da planilha e se ela está pública.</div>';
  }
}

function renderFeed() {
  const feed = document.getElementById('feed');
  if (!workouts.length) {
    feed.innerHTML = '<div class="empty-state"><span class="big">VAZIO</span>Nenhum treino ainda.<br>Registrem o primeiro! 💪</div>';
    return;
  }
  feed.innerHTML = workouts.map((w, i) => cardHTML(w, i)).join('');
}

function cardHTML(w, i) {
  const isPerson1 = w.person === CFG.p1;
  const avatarClass = isPerson1 ? 'p1' : 'p2';
  const initial = (w.person || '?')[0].toUpperCase();
  const dateStr = w.date ? new Date(w.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' }) : '';
  const person = isPerson1 ?  '1': '2';
  return ` <div class="workout-card" id="card-${i}">
    <div class="card-header">
      <div class="avatar ${avatarClass}">${initial}</div>
      <div class="card-meta">
        <div class="who">${w.person}</div>
        <div class="when">${dateStr}</div>
      </div>
    </div>
    <div class="card-body">
      ${w.title ? `<div class="card-title">${w.title}</div>` : ''}
      ${w.photo ? `<img class="card-photo" src="${w.photo}" alt="Progresso" onclick="openLightbox('${w.photo}')" loading="lazy">` : ''}
    </div>
    <div class="card-footer">
      ${CFG.currentPerson !== person ? `
        <div class="emoji-picker" id="picker-wrap-${i}" onclick="togglePicker(${i})">
        ${w.feeling ? `
          <div class="reaction-container">${w.feeling}</div>
          ` : '☺︎'}
        </div>
        <div class="emoji-popup" id="popup-${i}"><emoji-picker emoji-version="15.0"></emoji-picker></div>`
       : w.feeling ? `<div class="reaction-container">${w.feeling}</div>` :  ''}
      <button class="delete-btn" onclick="deleteWorkout(${i})">✕</button>
    </div>
  </div>`;
}

function togglePicker(i) {
  const popup = document.getElementById(`popup-${i}`);

  const isOpen = popup.classList.toggle('open');

  if (isOpen) {
    // adiciona listener para clique fora
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    function handleClickOutside(event) {
      const pickerWrap = document.getElementById(`picker-wrap-${i}`);

      // se clicou dentro do popup ou no botão, ignora
      if (popup.contains(event.target) || pickerWrap.contains(event.target)) {
        return;
      }

      popup.classList.remove('open');
      document.removeEventListener('click', handleClickOutside);
    }
  }
}



function updateStreaks() {
  const count = (name) => workouts.filter(w => w.person === name).length;
  document.getElementById('streak-count-p1').textContent = count(CFG.p1);
  document.getElementById('streak-count-p2').textContent = count(CFG.p2);
}

// ── CLOUDINARY ──
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'preset_1');

  const res = await fetch(`https://api.cloudinary.com/v1_1/do9ncusv9/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Falha no upload da foto');
  }

  const data = await res.json();
  return data.secure_url;
}

// ── SUBMIT ──
async function submitWorkout() {
  const person = document.getElementById('f-person').value === 'p1' ? CFG.p1 : CFG.p2;
  const title = document.getElementById('f-title').value.trim();
  const photoFile = document.getElementById('f-photo').files[0];

  if (!title) { showToast('Descreva o treino!'); return; }

  const btn = document.querySelector('.btn-submit');
  btn.textContent = 'SALVANDO...';
  btn.disabled = true;

  try {
    let photoUrl = '';
    if (photoFile) {
      btn.textContent = 'ENVIANDO FOTO...';
      photoUrl = await uploadToCloudinary(photoFile);
    }

    // type/duration/notes mantidos vazios só pra bater com as colunas da planilha (ver Apps Script no README)
    const payload = { person, type: '', title, duration: '', feeling: '', notes: '', photo: photoUrl, date: new Date().toISOString() };

    await fetch(CFG.script, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });

    showToast('Treino salvo! 💪');
    closeModal();
    clearForm();
    setTimeout(loadWorkouts, 1500);
  } catch(e) {
    console.log(e);
    showToast(e.message === 'Falha no upload da foto' ? 'Erro ao enviar foto. Tente novamente.' : 'Erro ao salvar. Tente novamente.');
  }

  btn.textContent = 'SALVAR TREINO';
  btn.disabled = false;
}

// ── DELETE ──
async function deleteWorkout(i) {
  if (!confirm('Excluir este treino?')) return;
  const w = workouts[i];
  try {
    await fetch(CFG.script + '?action=delete&id=' + encodeURIComponent(w.id), {
      method: 'GET', mode: 'no-cors'
    });
    showToast('Treino excluído');
    setTimeout(loadWorkouts, 1000);
  } catch(e) {
    showToast('Erro ao excluir');
  }
}

// ── UI ──
function openModal() {
  document.getElementById('modal').classList.add('open');
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}
function closeModalBackdrop(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}
function clearForm() {
  ['f-title'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-photo').value = '';
  document.getElementById('placeholder').style.display = 'block';
  document.getElementById('preview-wrap').style.display = 'none';
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('placeholder').style.display = 'none';
    document.getElementById('preview-wrap').style.display = 'block';
    document.getElementById('preview-img').src = e.target.result;
    document.getElementById('file-name').textContent = file.name;
  };
  reader.readAsDataURL(file);
}

function removeFile(e) {
  e.stopPropagation();
  document.getElementById('f-photo').value = '';
  document.getElementById('placeholder').style.display = 'block';
  document.getElementById('preview-wrap').style.display = 'none';
}

function react(id, emoji) {
  fetch(CFG.script, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'updateEmoji', id, emoji })
  })
  .then(() => loadWorkouts())
  .catch(() => showToast('Erro ao reagir'));
}

document.addEventListener('emoji-click', (event) => {
  const item = event.target.closest('.emoji-popup');
  if (!item) return;
  const idx = parseInt(item.id.replace('popup-', ''), 10);
  const w = workouts[idx];
  if (!w) return;
  react(w.id, event.detail.unicode);
});

// ── INIT ──
loadConfig();
