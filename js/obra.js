async function carregarObra() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    window.location.href = 'galeria.html';
    return;
  }

  const { data, error } = await supabase
    .from('pintures')
    .select('*')
    .eq('id', id)
    .single();

  document.getElementById('spinner').style.display = 'none';

  if (error || !data) {
    window.location.href = 'galeria.html';
    return;
  }

  // Omplir contingut
  document.title = `${data.titol} · Els Bosch`;
  document.getElementById('obra-img').src = data.imatge_url || '';
  document.getElementById('obra-img').alt = data.titol;
  document.getElementById('obra-titol').textContent = data.titol;

  if (data.any_obra) {
    document.getElementById('obra-any').textContent = data.any_obra;
    document.getElementById('meta-any').style.display = 'block';
  }
  if (data.tecnica) {
    document.getElementById('obra-tecnica').textContent = capitalitzarObra(data.tecnica);
    document.getElementById('meta-tecnica').style.display = 'block';
  }
  if (data.dimensions) {
    document.getElementById('obra-dimensions').textContent = data.dimensions;
    document.getElementById('meta-dimensions').style.display = 'block';
  }
  if (data.propietat) {
    document.getElementById('obra-propietat').textContent = data.propietat;
    document.getElementById('meta-propietat').style.display = 'block';
  }
  if (data.descripcio) {
    document.getElementById('obra-descripcio').textContent = data.descripcio;
  }

  document.getElementById('obra-container').style.display = 'grid';

  // Botons editar (editors i admins)
  await obtenirSessio();
  if (esEditor()) {
    document.getElementById('btn-editar-zona').style.display = 'block';
  }

  // Navegació anterior / següent
  const { data: totes } = await supabase
    .from('pintures')
    .select('id')
    .order('any_obra', { ascending: true });

  if (totes) {
    const idx = totes.findIndex(p => p.id === id);
    const anterior = document.getElementById('obra-anterior');
    const seguent = document.getElementById('obra-seguent');

    if (idx > 0) {
      anterior.href = `obra.html?id=${totes[idx - 1].id}`;
    } else {
      anterior.style.visibility = 'hidden';
    }

    if (idx < totes.length - 1) {
      seguent.href = `obra.html?id=${totes[idx + 1].id}`;
    } else {
      seguent.style.visibility = 'hidden';
    }
  }
}

function editarObra() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  window.location.href = `admin/index.html?editar=${id}`;
}

function capitalitzarObra(str) {
  const mapa = {
    oli: 'Oli sobre tela',
    aquarella: 'Aquarel·la',
    guaix: 'Guaix',
    dibuix: 'Dibuix',
    altres: 'Altres'
  };
  return mapa[str] || str;
}
