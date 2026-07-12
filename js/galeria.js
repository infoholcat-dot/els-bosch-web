let totesPintures = [];

async function carregarGaleria() {
  const { data, error } = await supabase
    .from('pintures')
    .select('id, titol, any_obra, tecnica, imatge_url')
    .order('any_obra', { ascending: true });

  document.getElementById('spinner').style.display = 'none';

  if (error || !data) {
    document.getElementById('buit').style.display = 'block';
    document.getElementById('buit').textContent = 'Error carregant la col·lecció.';
    return;
  }

  totesPintures = data;
  renderitzarGaleria(totesPintures);
}

function renderitzarGaleria(pintures) {
  const grid = document.getElementById('galeria-grid');
  const buit = document.getElementById('buit');
  const recompte = document.getElementById('recompte');

  if (!pintures.length) {
    grid.style.display = 'none';
    buit.style.display = 'block';
    if (recompte) recompte.textContent = '';
    return;
  }

  if (recompte) {
    recompte.textContent = `${pintures.length} obra${pintures.length !== 1 ? 'es' : ''}`;
  }

  grid.innerHTML = pintures.map(p => `
    <a class="pintura-card" href="obra.html?id=${p.id}">
      <img
        class="pintura-card-img"
        src="${p.imatge_url || ''}"
        alt="${p.titol}"
        loading="lazy"
        onerror="this.style.background='#f4f4f4'"
      />
      <div>
        <h3>${p.titol}</h3>
        <p class="meta">
          ${p.any_obra ? p.any_obra : ''}
          ${p.any_obra && p.tecnica ? ' · ' : ''}
          ${p.tecnica ? capitalitzar(p.tecnica) : ''}
        </p>
      </div>
    </a>
  `).join('');

  grid.style.display = 'grid';
  buit.style.display = 'none';
}

function filtrarGaleria(filtre) {
  if (filtre === 'tot') {
    renderitzarGaleria(totesPintures);
  } else {
    renderitzarGaleria(totesPintures.filter(p => p.tecnica === filtre));
  }
}

function capitalitzar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
