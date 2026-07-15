# Feria — Catálogo de carteras de lujo

Catálogo público + panel privado de inventario y ganancias. Hecho con React + Vite + Supabase. Gratis de hostear.

- **`/`** → catálogo público (el link que se manda a clientes). No pide login.
- **`/panel`** → panel de la dueña (pide email y contraseña). Ahí carga carteras, sube fotos, marca vendidas y ve ganancias.

## Puesta en marcha (resumen)

1. **Supabase:** crear proyecto → SQL Editor → pegar `esquema.sql` → Run. Crear bucket público `fotos`. Crear el usuario de la dueña en Authentication → Users.
2. **GitHub:** subir este proyecto a un repositorio.
3. **Vercel:** importar el repo y cargar las variables de entorno (ver `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_TIENDA` (opcional)
   - `VITE_WHATSAPP` (número con código de país, solo dígitos)
4. **Deploy.** Sale el link. En el iPhone: Safari → Compartir → *Agregar a inicio*.

La guía detallada paso a paso está en el archivo `GUIA-DE-ARMADO.md`.

## Desarrollo local (opcional)

```bash
npm install
cp .env.example .env    # y completá tus valores
npm run dev
```

## Seguridad

Los costos y las ganancias viven solo en la tabla protegida `carteras` (requiere login). El catálogo público lee únicamente la vista `catalogo_publico`, que no incluye ni el costo ni la ganancia.
