/**
 * Public origin of the site, used for canonical links, the sitemap and Open Graph.
 * Vercel exposes the production domain at build time; local development falls back to localhost.
 */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000"

export const SITE_NAME = "Sin Topes"
export const SITE_TITLE = "Sin Topes - Planificador de Horarios"
export const SITE_DESCRIPTION =
  "Arma tu horario universitario sin topes: grilla semanal, enlaces para compartirlo y comparación de horas libres con tus compañeros."
