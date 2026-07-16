import React, { useState, useEffect, useMemo } from "react";
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
          <h1 className="fx-h1">Carteras de lujo, cuidadosamente seleccionadas</h1>
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
  const waText = encodeURIComponent(
    `Hola! 😊 Me interesa la ${it.marca} ${it.modelo} que vi en el catálogo. ¿Sigue disponible?`
  );
  const waLink = `https://wa.me/${WHATSAPP}?text=${waText}`;
  return (
    <article className={"fx-card" + (vendida ? " sold" : "")}>
      <div className="fx-photo">
        {it.foto_url ? <img src={it.foto_url} alt={`${it.marca} ${it.modelo}`} /> : <Placeholder marca={it.marca} />}
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
