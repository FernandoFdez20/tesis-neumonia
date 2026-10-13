/**
 * URLs de archivos del backend (/uploads).
 *
 * El backend exige sesión también para las radiografías, pero el navegador no
 * envía la cabecera Authorization en `<img src>` ni en `<a href>`. Por eso el
 * token viaja como parámetro de consulta, que es la única forma de que
 * <img> pueda verlo.
 */

export function baseArchivos(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) return apiUrl.replace("/api/v1", "")
  return "http://localhost:8000"
}

/** Ruta de /uploads lista para usarse en un `src`, con el token incluido. */
export function urlConToken(ruta: string): string {
  const token = localStorage.getItem("token")
  const url = `${baseArchivos()}${ruta}`
  if (!token) return url
  return `${url}${ruta.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
}