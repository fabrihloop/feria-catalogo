import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables, la app muestra un aviso en vez de romperse.
export const configOK = Boolean(url && key);
export const supabase = configOK ? createClient(url, key) : null;

export const TIENDA = import.meta.env.VITE_TIENDA || "Feria de carteras de lujo";
export const WHATSAPP = import.meta.env.VITE_WHATSAPP || "595981000000";
