async function inicialitzarAdmin() {
  const session = await obtenirSessio();

  if (!session || !esEditor()) {
    window.location.href = '../login.html';
    return;
  }

  if (esAdmin()) {
    document.getElementById('link-usuaris').style.display = 'block';
  }

  // Si venim d'editar una obra
  const params = new URLSearchParams(window.location.search);
  if (params.get('editar')) {
    carregarObraPerEditar(params.get('editar'));
  }
}

function mostrarPanell(nom) {
  ['afegir', 'pintures', 'usuaris'].forEach(p => {
    document.getElementById(`panell-${p}`).style.display = 'none';
  });
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('actiu'));

  document.getElementById(`panell-${nom}`).style.display = 'block';
  event.currentTarget.classList.add('actiu');

  if (nom === 'pintures') carregarTaulaObres();
  if (nom === 'usuaris') carregarTaulaUsuaris();
}

// ── FORMULARI AFEGIR / EDITAR ──

let idEditant = null;

function previsualitzar(input) {
  const fitxer = input.files[0];
  if (!fitxer) return;
  const url = URL.createObjectURL(fitxer);
  const preview = document.getElementById('preview-img');
  preview.src = url;
  preview.style.display = 'block';
}

async function guardarPintura() {
  const btn = document.getElementById('btn-guardar');
  const msg = document.getElementById('msg-afegir');
  msg.innerHTML = '';
  btn.disabled = true;
  btn.textContent = 'Guardant...';

  const titol = document.getElementById('titol').value.trim();
  if (!titol) {
    mostrarMissatge(msg, 'El títol és obligatori.', 'error');
    btn.disabled = false;
    btn.textContent = 'Guardar pintura';
    return;
  }

  let imatgeUrl = null;
  const fitxer = document.getElementById('input-imatge').files[0];

  if (fitxer) {
    const nomFitxer = `${Date.now()}_${fitxer.name.replace(/\s/g, '_')}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pintures')
      .upload(nomFitxer, fitxer);

    if (uploadError) {
      mostrarMissatge(msg, `Error pujant la imatge: ${uploadError.message}`, 'error');
      btn.disabled = false;
      btn.textContent = 'Guardar pintura';
      return;
    }

    const { data: urlData } = supabase.storage.from('pintures').getPublicUrl(nomFitxer);
    imatgeUrl = urlData.publicUrl;
  }

  const dades = {
    titol,
    any_obra: document.getElementById('any-obra').value.trim() || null,
    tecnica: document.getElementById('tecnica').value || null,
    dimensions: document.getElementById('dimensions').value.trim() || null,
    propietat: document.getElementById('propietat').value.trim() || null,
    descripcio: document.getElementById('descripcio').value.trim() || null,
    ...(imatgeUrl && { imatge_url: imatgeUrl })
  };

  let error;
  if (idEditant) {
    ({ error } = await supabase.from('pintures').update(dades).eq('id', idEditant));
  } else {
    ({ error } = await supabase.from('pintures').insert([dades]));
  }

  if (error) {
    mostrarMissatge(msg, `Error: ${error.message}`, 'error');
  } else {
    mostrarMissatge(msg, idEditant ? 'Obra actualitzada correctament.' : 'Pintura afegida correctament.', 'ok');
    if (!idEditant) netejarFormulari();
  }

  btn.disabled = false;
  btn.textContent = 'Guardar pintura';
}

function netejarFormulari() {
  idEditant = null;
  ['titol', 'any-obra', 'dimensions', 'propietat', 'descripcio'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('tecnica').value = '';
  document.getElementById('input-imatge').value = '';
  document.getElementById('preview-img').style.display = 'none';
}

async function carregarObraPerEditar(id) {
  const { data } = await supabase.from('pintures').select('*').eq('id', id).single();
  if (!data) return;

  idEditant = id;
  document.getElementById('titol').value = data.titol || '';
  document.getElementById('any-obra').value = data.any_obra || '';
  document.getElementById('tecnica').value = data.tecnica || '';
  document.getElementById('dimensions').value = data.dimensions || '';
  document.getElementById('propietat').value = data.propietat || '';
  document.getElementById('descripcio').value = data.descripcio || '';

  if (data.imatge_url) {
    const preview = document.getElementById('preview-img');
    preview.src = data.imatge_url;
    preview.style.display = 'block';
  }

  document.getElementById('btn-guardar').textContent = 'Actualitzar obra';
}

// ── TAULA OBRES ──

async function carregarTaulaObres() {
  const spinner = document.getElementById('spinner-pintures');
  const taula = document.getElementById('taula-pintures');
  spinner.style.display = 'block';
  taula.style.display = 'none';

  const { data } = await supabase
    .from('pintures')
    .select('id, titol, any_obra, tecnica, imatge_url')
    .order('any_obra', { ascending: true });

  spinner.style.display = 'none';

  if (!data || !data.length) {
    document.getElementById('cos-taula-pintures').innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:#6b6b6b;padding:2rem;">No hi ha pintures.</td></tr>';
    taula.style.display = 'table';
    return;
  }

  document.getElementById('cos-taula-pintures').innerHTML = data.map(p => `
    <tr>
      <td><img src="${p.imatge_url || ''}" style="width:60px;height:45px;object-fit:cover;" /></td>
      <td>${p.titol}</td>
      <td>${p.any_obra || '—'}</td>
      <td>${p.tecnica || '—'}</td>
      <td>
        <a href="index.html?editar=${p.id}" style="font-size:0.8rem;color:#6b6b6b;margin-right:1rem;">Editar</a>
        <button onclick="eliminarPintura('${p.id}', this)" style="font-size:0.8rem;color:#8b0000;background:none;border:none;cursor:pointer;">Eliminar</button>
      </td>
    </tr>
  `).join('');

  taula.style.display = 'table';
}

async function eliminarPintura(id, btn) {
  if (!confirm('Segur que vols eliminar aquesta pintura? No es pot desfer.')) return;
  btn.textContent = '...';
  await supabase.from('pintures').delete().eq('id', id);
  carregarTaulaObres();
}

// ── TAULA USUARIS (admin) ──

async function carregarTaulaUsuaris() {
  if (!esAdmin()) return;

  const spinner = document.getElementById('spinner-usuaris');
  const taula = document.getElementById('taula-usuaris');
  spinner.style.display = 'block';
  taula.style.display = 'none';

  const { data } = await supabase
    .from('usuari_rols')
    .select('user_id, email, nom, rol, aprovat')
    .order('creat_el', { ascending: false });

  spinner.style.display = 'none';

  if (!data || !data.length) {
    document.getElementById('cos-taula-usuaris').innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:#6b6b6b;padding:2rem;">Cap usuari registrat.</td></tr>';
    taula.style.display = 'table';
    return;
  }

  document.getElementById('cos-taula-usuaris').innerHTML = data.map(u => `
    <tr>
      <td>${u.nom || '—'}</td>
      <td>${u.email}</td>
      <td>
        <select class="rol-select" onchange="canviarRol('${u.user_id}', this.value)">
          <option value="viewer" ${u.rol === 'viewer' ? 'selected' : ''}>Viewer</option>
          <option value="editor" ${u.rol === 'editor' ? 'selected' : ''}>Editor</option>
          <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td>
        ${u.aprovat
          ? '<span style="color:#3a6b3a;font-size:0.8rem;">Aprovat</span>'
          : `<button onclick="aprovarUsuari('${u.user_id}', this)" style="font-size:0.78rem;background:var(--negre);color:white;border:none;padding:0.3rem 0.8rem;cursor:pointer;">Aprovar</button>`
        }
      </td>
    </tr>
  `).join('');

  taula.style.display = 'table';
}

async function canviarRol(userId, nouRol) {
  await supabase.from('usuari_rols').update({ rol: nouRol }).eq('user_id', userId);
}

async function aprovarUsuari(userId, btn) {
  btn.textContent = '...';
  await supabase.from('usuari_rols').update({ aprovat: true }).eq('user_id', userId);
  carregarTaulaUsuaris();
}

// ── UTILS ──

function mostrarMissatge(el, text, tipus) {
  el.className = tipus === 'ok' ? 'missatge-ok' : 'missatge-error';
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
