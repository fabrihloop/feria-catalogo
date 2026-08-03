import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase, TIENDA, WHATSAPP } from "./supabase.js";
import { gs } from "./helpers.js";

/* Portada con foto — sólo en celular (hasta 720px de ancho).
   En pantallas grandes se mantiene el hero tipográfico de siempre. */
const estiloPortada = `
@media (max-width: 720px) {
  .fx-cat .fx-hero {
    position: relative;
    margin: -44px -28px 30px;
    padding: 0 20px;
    aspect-ratio: 4 / 5;
    min-height: 420px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: center;
    background-image:
      linear-gradient(to bottom, rgba(0,0,0,.30) 0%, rgba(0,0,0,.46) 50%, rgba(0,0,0,.48) 100%),
      url('/portada-movil.jpg');
    background-size: cover;
    background-position: center;
  }
  .fx-cat .fx-hero .fx-eyebrow { color: #E9D8B2; }
  .fx-cat .fx-hero .fx-h1 {
    color: #FFFFFF;
    font-size: clamp(42px, 13vw, 60px);
    font-weight: 600;
    line-height: 1.0;
    letter-spacing: -.015em;
    margin: 14px 0 12px;
    text-shadow: 0 2px 18px rgba(0,0,0,.35);
  }
  .fx-cat .fx-hero .fx-sub { color: #EEE8DE; }
}
`;

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marca, setMarca] = useState("Todas");
  const [ocultarVendidas, setOcultarVendidas] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("catalogo_publico")
        .select("*")
        .order("fecha_ingreso", { ascending: false });
      if (!error && data) setItems(data);
      setLoading(false);
    })();
  }, []);

  const marcas = useMemo(
    () => ["Todas", ...Array.from(new Set(items.map((i) => i.marca))).sort()],
    [items]
  );

  const vis = items
    .filter((i) => marca === "Todas" || i.marca === marca)
    .filter((i) => !(ocultarVendidas && i.estado === "Vendida"))
    .sort((a, b) => (a.estado === "Vendida") - (b.estado === "Vendida"));

  return (
    <>
      <style>{estiloPortada}</style>

      <header className="fx-top">
        <Brand />
      </header>

      <main className="fx-cat">
        <div className="fx-hero">
          <span className="fx-eyebrow">Piezas únicas · originales</span>
          <h1 className="fx-h1">Luxury preloved bags</h1>
          <p className="fx-sub">Consultá disponibilidad directo por WhatsApp.</p>
        </div>

        {loading ? (
          <div className="fx-empty">Cargando catálogo…</div>
        ) : (
          <>
            <div className="fx-filters">
              <div className="fx-chips">
                {marcas.map((m) => (
                  <button key={m} className={"fx-chip" + (marca === m ? " on" : "")} onClick={() => setMarca(m)}>
                    {m}
                  </button>
                ))}
              </div>
              <label className="fx-toggle">
                <input type="checkbox" checked={!ocultarVendidas} onChange={(e) => setOcultarVendidas(!e.target.checked)} />
                <span>Mostrar vendidas</span>
              </label>
            </div>

            <div className="fx-grid">
              {vis.map((i) => (
                <Card key={i.id} it={i} />
              ))}
            </div>
            {vis.length === 0 && <div className="fx-empty">No hay carteras en esta selección.</div>}
          </>
        )}
      </main>

      <footer className="fx-foot">{TIENDA} · piezas originales · delivery & pickup</footer>
    </>
  );
}

function Card({ it }) {
  const vendida = it.estado === "Vendida";
  const reservada = it.estado === "Reservada";
  const fotos = Array.isArray(it.fotos) && it.fotos.length ? it.fotos : it.foto_url ? [it.foto_url] : [];
  const total = fotos.length;
  const [idx, setIdx] = useState(0);
  const touchX = useRef(null);
  const ir = (n) => setIdx((n + total) % total);

  const waText = encodeURIComponent(
    `Hola! 😊 Me interesa la ${it.marca} ${it.modelo} que vi en el catálogo. ¿Sigue disponible?`
  );
  const waLink = `https://wa.me/${WHATSAPP}?text=${waText}`;

  return (
    <article className={"fx-card" + (vendida ? " sold" : "")}>
      <div
        className="fx-photo"
        style={{ position: "relative" }}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current == null || total < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) ir(idx + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        {total > 0 ? (
          <img src={fotos[idx]} alt={`${it.marca} ${it.modelo}`} />
        ) : (
          <Placeholder marca={it.marca} />
        )}

        {total > 1 && (
          <>
            <button type="button" aria-label="Anterior" onClick={() => ir(idx - 1)} style={navBtn("left")}>‹</button>
            <button type="button" aria-label="Siguiente" onClick={() => ir(idx + 1)} style={navBtn("right")}>›</button>
            <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
              {fotos.map((_, k) => (
                <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: k === idx ? "#fff" : "rgba(255,255,255,.5)", boxShadow: "0 0 3px rgba(0,0,0,.45)" }} />
              ))}
            </div>
          </>
        )}

        {vendida && <span className="fx-stamp" style={selloAgotado}>Agotado</span>}
        {reservada && <span className="fx-badge res">Reservada</span>}
      </div>

      <div className="fx-body">
        <span className="fx-eyebrow sm">{it.marca}</span>
        <h3 className="fx-model">{it.modelo}</h3>
        <p className="fx-desc">{it.descripcion}</p>
        {it.condicion && (
          <div className="fx-meta">
            <span className="fx-cond">{it.condicion}</span>
          </div>
        )}
        <div className="fx-priceRow">
          <span className="fx-price">{gs(it.precio_venta)}</span>
          {vendida ? (
            <span className="fx-state vendida">No disponible</span>
          ) : (
            <a className="fx-wa" href={waLink} target="_blank" rel="noreferrer">Consultar</a>
          )}
        </div>
      </div>
    </article>
  );
}

/* Sello "Agotado": horizontal (sin inclinación) y más chico que el original */
const selloAgotado = {
  transform: "translate(-50%,-50%)",
  fontSize: 19,
  letterSpacing: ".2em",
  borderWidth: 2,
  padding: "5px 16px",
  whiteSpace: "nowrap",
};

function navBtn(side) {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 6,
    width: 30, height: 30, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,.85)", color: "#222", fontSize: 18, lineHeight: "28px",
    cursor: "pointer", padding: 0,
  };
}

function Brand({ subtitle }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="fx-brand">
      {broken ? (
        <span className="fx-mono">RB</span>
      ) : (
        <img src="/logotienda.png" alt={TIENDA} style={{ height: 46, width: "auto", display: "block" }} onError={() => setBroken(true)} />
      )}
      {subtitle && <span className="fx-brandtext">{subtitle}</span>}
    </div>
  );
}

function Placeholder({ marca }) {
  return (
    <div className="fx-ph">
      <svg viewBox="0 0 64 64" width="46" height="46" aria-hidden>
        <path d="M14 26h36l-3 26H17L14 26z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M24 26v-4a8 8 0 0 1 16 0v4" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span>{marca}</span>
    </div>
  );
}
