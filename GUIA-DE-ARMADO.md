# Guía de armado — Catálogo Feria (Camino B)

Objetivo: que la dueña tenga **un link de catálogo público** para pasar a clientes y **un panel privado** (con login) para gestionar inventario, costos y ganancias — todo gratis, y accesible desde su iPhone como si fuera una app.

Instagram sigue igual, en paralelo, como vitrine. El link es el catálogo vivo que se actualiza solo al vender.

**Tiempo la primera vez:** 1 a 2 horas. **Costo mensual:** US$0 dentro de los planes gratis.

---

## Antes de empezar: las 3 cuentas gratis

1. **GitHub** (github.com) — para guardar el código.
2. **Supabase** (supabase.com) — la base de datos y las fotos en la nube.
3. **Vercel** (vercel.com) — publica el link. Registrate con la misma cuenta de GitHub para que se conecten solas.

---

## Fase 1 — Base de datos (Supabase)

1. En Supabase, **New project**. Poné un nombre (ej. `feria`), elegí una contraseña de base de datos y guardala. Región: la más cercana (South America si aparece).
2. Cuando termine de crearse, entrá a **SQL Editor → New query**.
3. Abrí el archivo `esquema.sql` que te pasé, **copiá todo**, pegalo y apretá **Run**. Debería decir "Success".
4. **Crear el cajón de fotos:** menú **Storage → New bucket**. Nombre exacto: `fotos`. Marcá la opción **Public bucket**. Create.
5. **Crear el usuario de la dueña:** menú **Authentication → Users → Add user → Create new user**. Poné su email y una contraseña. Ese es el login con el que ella entrará al panel. (No hace falta que sea su email real de siempre; puede ser uno para esto.)
6. **Anotar las 2 claves** (las vas a usar en la Fase 3): menú **Project Settings → API**. Copiá:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key (una clave larga). Esta es segura de usar en el front-end.

---

## Fase 2 — Código

El código ya adaptado (catálogo público + panel con login + subida de fotos a la nube) te lo entrego yo como proyecto listo. Cuando lo tengas:

1. Creá un repositorio nuevo en GitHub (ej. `feria-catalogo`).
2. Subí los archivos del proyecto ahí (por la web de GitHub: **Add file → Upload files**, o con Git si te manejás).

> No pongas las claves de Supabase dentro del código. Van como "variables de entorno" en Vercel (Fase 3). Así nadie las ve en GitHub.

---

## Fase 3 — Publicar el link (Vercel)

1. En Vercel: **Add New → Project → Import** y elegí el repositorio `feria-catalogo`.
2. En **Environment Variables**, agregá estas dos (con los valores de la Fase 1, paso 6):
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu clave anon public
3. **Deploy**. En 1–2 minutos te da un link tipo `https://feria-catalogo.vercel.app`.

Ese link tiene dos partes:
- `…vercel.app/` → **catálogo público** (lo que mandás a clientes).
- `…vercel.app/panel` → **panel de la dueña** (le pide su email y contraseña).

*(Opcional, más adelante: se le puede poner un dominio propio tipo `feriarb.com` desde Vercel.)*

---

## Fase 4 — Ponerlo en el iPhone (sin App Store, sin APK)

En el iPhone de la dueña, con **Safari**:

1. **El panel:** abrí `…vercel.app/panel`, iniciá sesión una vez. Después tocá el botón **Compartir** (el cuadradito con la flecha) → **Agregar a inicio**. Le queda el ícono; ese es su "app de gestión".
2. **El catálogo:** si quiere, hacé lo mismo con `…vercel.app/` para tener el catálogo a mano y mostrarlo en persona.

Se abren a pantalla completa, como una app instalada. Funciona igual en Android, por si algún día cambia de celular.

---

## Fase 5 — Cómo lo usa en el día a día

- **Entra una cartera nueva:** abre su app (el panel) → *Agregar cartera* → sube la foto directo de la cámara/galería, pone marca, modelo, costo y precio de venta. Listo, ya aparece en el catálogo público.
- **La vende (por WhatsApp, como siempre):** en el panel cambia el estado a *Vendida*, anota por cuánto se vendió → el sistema calcula la ganancia y la cartera desaparece del catálogo automáticamente. **Ya no borra nada del Canva ni re-exporta PDF.**
- **Comparte:** manda el link del catálogo a un cliente, o lo tiene en su bio. Instagram lo sigue usando aparte para llegar a más gente.
- **Controla el negocio:** el panel le muestra capital en stock, ganancia del mes y ganancia total. Reemplaza la agenda de papel.

---

## Notas honestas

- **Plan gratis:** alcanza de sobra para una tienda chica. Conviene mirar los límites vigentes de Supabase (filas, almacenamiento, y si el proyecto se "pausa" tras mucha inactividad — se reactiva solo al volver a entrar). Para una tienda con movimiento, no es problema.
- **Seguridad:** los costos y la ganancia viven solo en la tabla protegida; el link público jamás los expone. Guardá bien la contraseña de la dueña y la contraseña de la base de datos.
- **Respaldo:** de vez en cuando, desde Supabase se puede exportar la tabla a CSV, por las dudas.
