import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase, TIENDA } from "./supabase.js";
import { gs, monthKey, todayISO, CONDICIONES, ESTADOS } from "./helpers.js";

export default function Panel() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="fx-empty" style={{ paddingTop: 80 }}>Cargando…</div>;
  if (!session) return <Login />;
  return <Admin onLogout={() => supabase.auth.signOut()} />;
}

/* ---------------- Login ---------------- */
function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const entrar = async () => {
    setErr(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
    if (error) setErr("Email o contraseña incorrectos.");
    setBusy(false);
  };

  return (
    <>
      <header className="fx-top">
        <Brand />
      </header>
      <div className="fx-gate">
        <div className="fx-gatecard">
          <span className="fx-mono big">RB</span>
          <h2>Panel privado</h2>
          <p>Ingresá con tu email y contraseña.</p>
          <input className="fx-input" type="email" placeholder="Email" autoComplete="username"
            value={email} onChange={(e) => { setErr(""); setEmail(e.target.value); }} />
          <input className="fx-input" type="password" placeholder="Contraseña" autoComplete="current-password"
            value={pass} onChange={(e) => { setErr(""); setPass(e.target.value); }}
            onKeyDown={(e) => e.key === "Enter" && entrar()} />
          {err && <span className="fx-err">{err}</span>}
          <button className="fx-btn primary" disabled={busy} onClick={entrar}>{busy ? "Entrando…" : "Entrar"}</button>
        </div>
      </div>
    </>
  );
}

/* ---------------- Admin ---------------- */
function Admin({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selling, setSelling] = useState(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState("Todas");

  const load = async () => {
    const { data, error } = await supabase.from("carteras").select("*").order("creado", { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const now = new Date().toISOString().slice(0, 7);
  const stats = useMemo(() => {
    const disp = items.filter((i) => i.estado === "Disponible");
    const resv = items.filter((i) => i.estado === "Reservada");
    const vend = items.filter((i) => i.estado === "Vendida");
    const capital = [...disp, ...resv].reduce((s, i) => s + (i.precio_compra || 0), 0);
    const valorStock = disp.reduce((s, i) => s + (i.precio_venta || 0), 0);
    const ganTotal = vend.reduce((s, i) => s + ((i.precio_venta_real || 0) - (i.precio_compra || 0)), 0);
    const ganMes = vend.filter((i) => monthKey(i.fecha_venta) === now)
      .reduce((s, i) => s + ((i.precio_venta_real || 0) - (i.precio_compra || 0)), 0);
    const margenes = vend.map((i) => (i.precio_compra ? ((i.precio_venta_real - i.precio_compra) / i.precio_compra) * 100 : 0));
    const margenProm = margenes.length ? margenes.reduce((a, b) => a + b, 0) / margenes.length : 0;
    return { disp: disp.length, resv: resv.length, vend: vend.length, capital, valorStock, ganTotal, ganMes, margenProm };
  }, [items, now]);

  const rows = items
    .filter((i) => f === "Todas" || i.estado === f)
    .filter((i) => `${i.marca} ${i.modelo} ${i.descripcion}`.toLowerCase().includes(q.toLowerCase()));

  const save = async (d) => {
    const payload = {
      marca: d.marca, modelo: d.modelo, descripcion: d.descripcion, condicion: d.condicion,
      foto_url: d.foto_url, precio_venta: Number(d.precio_venta) || 0, precio_compra: Number(d.precio_compra) || 0,
      estado: d.estado, fecha_ingreso: d.fecha_ingreso || todayISO(),
    };
    let error;
    if (d.id) ({ error } = await supabase.from("carteras").update(payload).eq("id", d.id));
    else ({ error } = await supabase.from("carteras").insert(payload));
    if (error) { alert("No se pudo guardar: " + error.message); return; }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm("¿Eliminar esta cartera del inventario?")) return;
    await supabase.from("carteras").delete().eq("id", id);
    load();
  };

  const setEstado = async (id, estado) => {
    const extra = estado !== "Vendida" ? { precio_venta_real: 0, fecha_venta: null } : {};
    await supabase.from("carteras").update({ estado, ...extra }).eq("id", id);
    load();
  };

  const confirmSale = async (id, ventaReal, fecha) => {
    await supabase.from("carteras").update({ estado: "Vendida", precio_venta_real: Number(ventaReal) || 0, fecha_venta: fecha }).eq("id", id);
    setSelling(null);
    load();
  };

  return (
    <>
      <header className="fx-top">
        <Brand subtitle="Panel" />
        <button className="fx-btn ghost" onClick={onLogout}>Cerrar sesión</button>
      </header>

      <main className="fx-admin">
        <div className="fx-dash">
          <Stat label="Disponibles" value={stats.disp} accent />
          <Stat label="Reservadas" value={stats.resv} />
          <Stat label="Vendidas" value={stats.vend} />
          <Stat label="Capital en stock" value={gs(stats.capital)} money />
          <Stat label="Valor del stock (venta)" value={gs(stats.valorStock)} money />
          <Stat label="Ganancia del mes" value={gs(stats.ganMes)} money hi />
          <Stat label="Ganancia total" value={gs(stats.ganTotal)} money hi />
          <Stat label="Margen promedio" value={Math.round(stats.margenProm) + "%"} />
        </div>

        <div className="fx-actions">
          <button className="fx-btn primary" onClick={() => setEditing({})}>+ Agregar cartera</button>
          <input className="fx-search" placeholder="Buscar marca o modelo…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="fx-select" value={f} onChange={(e) => setF(e.target.value)}>
            {["Todas", ...ESTADOS].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="fx-empty sm">Cargando inventario…</div>
        ) : (
          <div className="fx-table">
            <div className="fx-tr fx-th">
              <span>Cartera</span><span>Estado</span><span className="r">Costo</span><span className="r">Venta</span><span className="r">Ganancia</span><span className="r">Acciones</span>
            </div>
            {rows.map((i) => {
              const gan = i.estado === "Vendida"
                ? (i.precio_venta_real || 0) - (i.precio_compra || 0)
                : (i.precio_venta || 0) - (i.precio_compra || 0);
              return (
                <div className="fx-tr" key={i.id}>
                  <span className="fx-cell-name">
                    <strong>{i.marca}</strong> {i.modelo}
                    <em>{i.descripcion}{i.condicion ? ` · ${i.condicion}` : ""}</em>
                  </span>
                  <span>
                    <select className={"fx-estado " + i.estado.toLowerCase()} value={i.estado}
                      onChange={(e) => (e.target.value === "Vendida" ? setSelling(i) : setEstado(i.id, e.target.value))}>
                      {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </span>
                  <span className="r muted">{gs(i.precio_compra)}</span>
                  <span className="r">{i.estado === "Vendida" ? gs(i.precio_venta_real) : gs(i.precio_venta)}</span>
                  <span className={"r " + (gan >= 0 ? "pos" : "neg")}>
                    {i.estado === "Vendida" ? gs(gan) : <span className="est">est. {gs(gan)}</span>}
                  </span>
                  <span className="r fx-rowbtns">
                    <button className="fx-mini" onClick={() => setEditing(i)}>Editar</button>
                    <button className="fx-mini del" onClick={() => remove(i.id)}>✕</button>
                  </span>
                </div>
              );
            })}
            {rows.length === 0 && <div className="fx-empty sm">Sin resultados. Agregá tu primera cartera.</div>}
          </div>
        )}

        {editing && <ItemForm base={editing} onSave={save} onClose={() => setEditing(null)} />}
        {selling && <SellForm it={selling} onConfirm={confirmSale} onClose={() => setSelling(null)} />}
      </main>
    </>
  );
}

function Stat({ label, value, money, hi, accent }) {
  return (
    <div className={"fx-stat" + (hi ? " hi" : "") + (accent ? " accent" : "")}>
      <span className="fx-stat-l">{label}</span>
      <span className={"fx-stat-v" + (money ? " money" : "")}>{value}</span>
    </div>
  );
}

/* ---------------- Formularios ---------------- */
function ItemForm({ base, onSave, onClose }) {
  const [d, setD] = useState({
    id: base.id, marca: base.marca || "", modelo: base.modelo || "", descripcion: base.descripcion || "",
    condicion: base.condicion || "Excelente", foto_url: base.foto_url || "",
    precio_compra: base.precio_compra || "", precio_venta: base.precio_venta || "",
    estado: base.estado || "Disponible", fecha_ingreso: base.fecha_ingreso || todayISO(),
  });
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const ok = d.marca && d.modelo && d.precio_venta;
  return (
    <Modal title={base.id ? "Editar cartera" : "Agregar cartera"} onClose={onClose}>
      <div className="fx-form">
        <Field label="Marca"><input className="fx-input" value={d.marca} onChange={(e) => set("marca", e.target.value)} placeholder="Saint Laurent" /></Field>
        <Field label="Modelo"><input className="fx-input" value={d.modelo} onChange={(e) => set("modelo", e.target.value)} placeholder="Le 5 à 7 Hobo" /></Field>
        <Field label="Descripción (color, material)" full><input className="fx-input" value={d.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Cuero negro · herrajes dorados" /></Field>
        <Field label="Condición"><select className="fx-input" value={d.condicion} onChange={(e) => set("condicion", e.target.value)}>{CONDICIONES.map((c) => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Estado"><select className="fx-input" value={d.estado} onChange={(e) => set("estado", e.target.value)}>{ESTADOS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Precio de compra (costo)"><input className="fx-input" type="number" value={d.precio_compra} onChange={(e) => set("precio_compra", e.target.value)} placeholder="0" /></Field>
        <Field label="Precio de venta (público)"><input className="fx-input" type="number" value={d.precio_venta} onChange={(e) => set("precio_venta", e.target.value)} placeholder="0" /></Field>
        <Field label="Foto de la cartera" full><ImagePicker value={d.foto_url} onChange={(v) => set("foto_url", v)} /></Field>
      </div>
      <div className="fx-modalbtns">
        <button className="fx-btn ghost" onClick={onClose}>Cancelar</button>
        <button className="fx-btn primary" disabled={!ok} onClick={() => onSave(d)}>Guardar</button>
      </div>
    </Modal>
  );
}

function SellForm({ it, onConfirm, onClose }) {
  const [real, setReal] = useState(it.precio_venta || "");
  const [fecha, setFecha] = useState(todayISO());
  const gan = Number(real || 0) - (it.precio_compra || 0);
  return (
    <Modal title="Registrar venta" onClose={onClose}>
      <p className="fx-sellinfo"><strong>{it.marca}</strong> {it.modelo}</p>
      <div className="fx-form">
        <Field label="¿Por cuánto se vendió?"><input className="fx-input" type="number" value={real} onChange={(e) => setReal(e.target.value)} /></Field>
        <Field label="Fecha de venta"><input className="fx-input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
      </div>
      <div className={"fx-ganbox " + (gan >= 0 ? "pos" : "neg")}>
        Ganancia: <strong>{gs(gan)}</strong> <span>(costo {gs(it.precio_compra)})</span>
      </div>
      <div className="fx-modalbtns">
        <button className="fx-btn ghost" onClick={onClose}>Cancelar</button>
        <button className="fx-btn primary" onClick={() => onConfirm(it.id, real, fecha)}>Marcar como vendida</button>
      </div>
    </Modal>
  );
}

/* Comprime la foto y la deja lista como imagen para guardar junto con la cartera.
   (No usa Supabase Storage: la imagen viaja con los datos, por el mismo camino que ya funciona.) */
function comprimirAFoto(file, maxSize = 820, quality = 0.68) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        else if (height >= width && height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImagePicker({ value, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(""); setBusy(true);
    try {
      const foto = await comprimirAFoto(file);
      onChange(foto);
    } catch {
      setErr("No se pudo procesar la foto. Probá con otra.");
    }
    setBusy(false);
  };

  return (
    <div className="fx-imgpick">
      {value ? (
        <div className="fx-imgprev">
          <img src={value} alt="Vista previa" />
          <div className="fx-imgprev-btns">
            <button type="button" className="fx-mini" onClick={() => inputRef.current?.click()}>Cambiar foto</button>
            <button type="button" className="fx-mini del" onClick={() => onChange("")}>Quitar</button>
          </div>
        </div>
      ) : (
        <button type="button" className="fx-drop" onClick={() => inputRef.current?.click()} disabled={busy}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l5-4 4 3 3-2 4 3" />
          </svg>
          <span>{busy ? "Procesando foto…" : "Subir foto o tomar con la cámara"}</span>
          <em>JPG o PNG · se optimiza automáticamente</em>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pick} />
      {err && <span className="fx-err">{err}</span>}
    </div>
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

function Field({ label, children, full }) {
  return <label className={"fx-field" + (full ? " full" : "")}><span>{label}</span>{children}</label>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fx-overlay" onClick={onClose}>
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fx-modalhead"><h3>{title}</h3><button className="fx-x" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}
