import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase, TIENDA, WHATSAPP } from "./supabase.js";
import { gs } from "./helpers.js";

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
      <header className="fx-top">
        <Brand />
      </header>

      <main className="fx-cat">
        <div className="fx-hero">
          <span className="fx-eyebrow">Piezas únicas · originales</span>
          <h1 className="fx-h1">Luxury preloved bags</h1>
          <p className="fx-sub">Cada cartera es una sola. Consultá disponibilidad directo por WhatsApp.</p>
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
  const [abierto, setAbierto] = useState(false);
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
          <img src={fotos[idx]} alt={`${it.marca} ${it.modelo}`} onClick={() => setAbierto(true)} style={{ cursor: "zoom-in" }} />
        ) : (
          <Placeholder marca={it.marca} />
        )}

        {total > 1 && (
          <>
            <button type="button" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); ir(idx - 1); }} style={navBtn("left")}>‹</button>
            <button type="button" aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); ir(idx + 1); }} style={navBtn("right")}>›</button>
            <div style={{ position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", gap: 6, justifyContent: "center" }}>
              {fotos.map((_, k) => (
                <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: k === idx ? "#fff" : "rgba(255,255,255,.5)", boxShadow: "0 0 3px rgba(0,0,0,.45)" }} />
              ))}
            </div>
          </>
        )}

        {vendida && <span className="fx-stamp">Vendida</span>}
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

      {abierto && <Visor fotos={fotos} inicio={idx} titulo={`${it.marca} ${it.modelo}`} onClose={() => setAbierto(false)} />}
    </article>
  );
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
function navBtn(side) {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 6,
    width: 30, height: 30, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,.85)", color: "#222", fontSize: 18, lineHeight: "28px",
    cursor: "pointer", padding: 0,
  };
}

function visorBtn(side) {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)", [side]: 10,
    width: 44, height: 44, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,.16)", color: "#fff", fontSize: 26, cursor: "pointer", padding: 0,
  };
}

function Visor({ fotos, inicio = 0, titulo, onClose }) {
  const [idx, setIdx] = useState(inicio);
  const total = fotos.length;
  const touchX = useRef(null);
  const ir = (n) => setIdx((n + total) % total);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((v) => (v + 1) % total);
      if (e.key === "ArrowLeft") setIdx((v) => (v - 1 + total) % total);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [total, onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,13,11,.94)", zIndex: 90, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <button type="button" onClick={onClose} aria-label="Cerrar" style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "#fff", fontSize: 26, cursor: "pointer" }}>✕</button>

      <img
        src={fotos[idx]}
        alt={titulo}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current == null || total < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) ir(idx + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
        style={{ maxWidth: "94vw", maxHeight: "78vh", objectFit: "contain", borderRadius: 8 }}
      />

      {total > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); ir(idx - 1); }} aria-label="Anterior" style={visorBtn("left")}>‹</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); ir(idx + 1); }} aria-label="Siguiente" style={visorBtn("right")}>›</button>
        </>
      )}

      <div style={{ color: "#f2ece2", marginTop: 14, fontSize: 13, letterSpacing: ".03em" }}>
        {titulo}{total > 1 ? ` · ${idx + 1}/${total}` : ""}
      </div>
    </div>
  );
}
