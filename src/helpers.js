export const gs = (n) => "₲ " + new Intl.NumberFormat("es-PY").format(Math.round(n || 0));

export const monthKey = (iso) => (iso ? String(iso).slice(0, 7) : "");
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const fmtDate = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const CONDICIONES = ["Nueva con etiqueta", "Como nueva", "Excelente", "Muy buena", "Buena"];
export const ESTADOS = ["Disponible", "Reservada", "Vendida"];

// Comprime y redimensiona la foto antes de subirla (para no gastar almacenamiento).
export function compressImage(file, maxSize = 1000, quality = 0.72) {
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
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
