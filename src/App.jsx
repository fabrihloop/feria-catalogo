import React from "react";
import { configOK } from "./supabase.js";
import Catalogo from "./Catalogo.jsx";
import Panel from "./Panel.jsx";

export default function App() {
  if (!configOK) return <ConfigMissing />;
  const path = window.location.pathname.replace(/\/+$/, "");
  const esPanel = path === "/panel";
  return <div className="fx-root">{esPanel ? <Panel /> : <Catalogo />}</div>;
}

function ConfigMissing() {
  return (
    <div className="fx-root">
      <div style={{ maxWidth: 520, margin: "80px auto", padding: 28, textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>Falta la configuración</h2>
        <p style={{ color: "#7A7168" }}>
          Agregá las variables <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en Vercel
          (Project → Settings → Environment Variables) y volvé a desplegar.
        </p>
      </div>
    </div>
  );
}
