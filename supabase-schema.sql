-- Executar al SQL Editor de Supabase

-- Taula de pintures
create table pintures (
  id uuid primary key default gen_random_uuid(),
  titol text not null,
  any_obra text,
  tecnica text,
  dimensions text,
  propietat text,
  descripcio text,
  imatge_url text,
  afegida_per uuid references auth.users(id),
  afegida_el timestamptz default now()
);

-- Taula de rols d'usuari
create table usuari_rols (
  user_id uuid references auth.users(id) primary key,
  email text not null,
  nom text,
  rol text check (rol in ('admin', 'editor', 'viewer')) default 'viewer',
  aprovat boolean default false,
  creat_el timestamptz default now()
);

-- Crear automàticament un registre de rol quan un usuari fa login per primera vegada
create or replace function gestionar_nou_usuari()
returns trigger as $$
begin
  insert into public.usuari_rols (user_id, email, nom, rol, aprovat)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'viewer',
    false
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure gestionar_nou_usuari();

-- Polítiques de seguretat (RLS)
alter table pintures enable row level security;
alter table usuari_rols enable row level security;

-- Pintures: tothom pot veure (públic)
create policy "Pintures visibles per tothom"
  on pintures for select using (true);

-- Pintures: editors i admins poden inserir/actualitzar
create policy "Editors poden afegir pintures"
  on pintures for insert
  with check (
    exists (
      select 1 from usuari_rols
      where user_id = auth.uid()
      and rol in ('admin', 'editor')
      and aprovat = true
    )
  );

create policy "Editors poden actualitzar pintures"
  on pintures for update
  using (
    exists (
      select 1 from usuari_rols
      where user_id = auth.uid()
      and rol in ('admin', 'editor')
      and aprovat = true
    )
  );

-- Pintures: només admins poden eliminar
create policy "Admins poden eliminar pintures"
  on pintures for delete
  using (
    exists (
      select 1 from usuari_rols
      where user_id = auth.uid()
      and rol = 'admin'
      and aprovat = true
    )
  );

-- Rols: cada usuari veu el seu propi registre
create policy "Usuaris veuen el seu rol"
  on usuari_rols for select
  using (user_id = auth.uid());

-- Rols: admins veuen tots els usuaris
create policy "Admins veuen tots els usuaris"
  on usuari_rols for select
  using (
    exists (
      select 1 from usuari_rols
      where user_id = auth.uid()
      and rol = 'admin'
      and aprovat = true
    )
  );

-- Rols: admins poden actualitzar rols
create policy "Admins poden canviar rols"
  on usuari_rols for update
  using (
    exists (
      select 1 from usuari_rols
      where user_id = auth.uid()
      and rol = 'admin'
      and aprovat = true
    )
  );

-- Storage bucket per imatges (executar per separat si cal)
-- insert into storage.buckets (id, name, public) values ('pintures', 'pintures', true);
