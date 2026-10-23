/**
 * Public origin of the site, used for canonical links, the sitemap and Open Graph.
 * Vercel exposes the production domain at build time; local development falls back to localhost.
 */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000"

export const SITE_NAME = "ScheduleGrid"
export const SITE_TITLE = "ScheduleGrid - Planificador de Horarios"
export const SITE_DESCRIPTION =
  "Crea y organiza tu horario universitario con una grilla dinámica, gestión eficiente y colores automáticos."
