// Rols: admin | editor | viewer
let usuariActual = null;
let rolActual = null;

async function obtenirSessio() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  usuariActual = session.user;

  const { data: rolData } = await supabase
    .from('usuari_rols')
    .select('rol, aprovat')
    .eq('user_id', usuariActual.id)
    .single();

  if (rolData && rolData.aprovat) {
    rolActual = rolData.rol;
  } else {
    rolActual = null;
  }

  return session;
}

async function inicialitzarNav() {
  const session = await obtenirSessio();
  const navDreta = document.getElementById('nav-dreta');
  if (!navDreta) return;

  if (session && usuariActual) {
    const foto = usuariActual.user_metadata?.avatar_url || '';
    const nom = usuariActual.user_metadata?.full_name || usuariActual.email;
    const esAdmin = rolActual === 'admin';
    const esEditor = rolActual === 'admin' || rolActual === 'editor';

    navDreta.innerHTML = `
      ${foto ? `<img class="nav-user-img" src="${foto}" alt="${nom}" />` : ''}
      <span class="nav-user-nom">${nom.split(' ')[0]}</span>
      ${esEditor ? `<a href="${esAdmin ? '/admin/index.html' : '../admin/index.html'}" class="btn-nav">Admin</a>` : ''}
      <button class="btn-nav" onclick="logout()">Sortir</button>
    `;
  } else {
    navDreta.innerHTML = `<a href="login.html" class="btn-nav">Accedir</a>`;
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/index.html';
}

function esAdmin() { return rolActual === 'admin'; }
function esEditor() { return rolActual === 'admin' || rolActual === 'editor'; }
function esPotVeure() { return rolActual !== null; }

async function requirirLogin() {
  const session = await obtenirSessio();
  if (!session) {
    window.location.href = '/login.html';
    return false;
  }
  if (!esPotVeure()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}
