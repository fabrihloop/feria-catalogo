-- ============================================================
--  FERIA — Esquema de base de datos (Supabase / PostgreSQL)
--  Pegá TODO esto en:  Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Tabla principal — datos completos.
--    OJO: precio_compra y precio_venta_real son PRIVADOS (solo la dueña).
create table if not exists public.carteras (
  id                uuid primary key default gen_random_uuid(),
  marca             text not null,
  modelo            text not null,
  descripcion       text default '',
  condicion         text default 'Excelente',
  foto_url          text default '',
  precio_venta      bigint default 0,          -- público
  precio_compra     bigint default 0,          -- PRIVADO (costo)
  estado            text default 'Disponible', -- Disponible | Reservada | Vendida
  fecha_ingreso     date default current_date,
  fecha_venta       date,
  precio_venta_real bigint default 0,          -- PRIVADO (a cuánto se vendió)
  creado            timestamptz default now()
);

-- 2) Activar seguridad por filas (nadie accede si no hay una regla que lo permita).
alter table public.carteras enable row level security;

-- 3) Solo la dueña (usuaria con sesión iniciada) puede leer y editar la tabla completa.
create policy "duena_lee_todo"   on public.carteras for select to authenticated using (true);
create policy "duena_inserta"    on public.carteras for insert to authenticated with check (true);
create policy "duena_actualiza"  on public.carteras for update to authenticated using (true) with check (true);
create policy "duena_borra"      on public.carteras for delete to authenticated using (true);

-- 4) VISTA PÚBLICA — solo columnas seguras. El costo y la ganancia NO están acá.
--    Esto es lo único que ve el catálogo público (el link que manda a clientes).
create or replace view public.catalogo_publico as
  select id, marca, modelo, descripcion, condicion, foto_url, precio_venta, estado, fecha_ingreso
  from public.carteras;

-- 5) Dejar que cualquiera (link público, sin login) pueda leer esa vista.
grant select on public.catalogo_publico to anon;

-- 6) FOTOS (Storage): lectura pública, y subir/editar/borrar solo la dueña.
--    (Igual vas a marcar el bucket "fotos" como público desde el panel; esto refuerza.)
create policy "fotos_lectura_publica" on storage.objects
  for select to anon using (bucket_id = 'fotos');
create policy "fotos_suben_duena" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos');
create policy "fotos_editan_duena" on storage.objects
  for update to authenticated using (bucket_id = 'fotos');
create policy "fotos_borran_duena" on storage.objects
  for delete to authenticated using (bucket_id = 'fotos');

-- Listo. Ahora creá el bucket "fotos" (público) y el usuario de la dueña en Auth.
