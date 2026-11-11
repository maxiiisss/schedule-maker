# Sin Topes

Planificador de horarios semanales para estudiantes universitarios. En Chile, un «tope» es el choque entre dos ramos que caen a la misma hora: la idea es armar la semana sin ninguno. Pones tus ramos en una grilla, la guardas en tu dispositivo, la compartes con un enlace corto y la comparas con la de tus compañeros para encontrar las horas en que todos están libres.

**En producción:** <https://schedule-maker-gray.vercel.app>

## ✨ Qué puedes hacer

**Armar tu horario**
- Agregar ramos con nombre, sala, horario, días y color. Cada ramo puede tener varios horarios (por ejemplo, cátedra y laboratorio): elige el ramo con los chips de arriba del formulario.
- Escribir las horas en formato 24 h con precisión de minuto. En el celular basta con `1030`, `930` o `9`: se convierten solas en `10:30`, `09:30` y `09:00`.
- Cualquier hora del día (00:00 a 23:59). La grilla muestra de 08:00 a 22:00 y se amplía sola para incluir los ramos fuera de ese rango.
- Ver la semana completa o un solo día, con o sin fin de semana. La grilla marca el día de hoy y la hora actual.
- Los ramos que se superponen se reparten lado a lado.
- Resaltar un ramo para ver todos sus bloques, y deshacer cuando eliminas un ramo o limpias el horario.

**Guardar**
- Se guarda solo en el navegador y se recupera al volver.
- Descargar una **captura PNG**, un **respaldo JSON**, o restaurar desde un respaldo.

**Compartir**
- El botón **Compartir** crea un enlace corto (`/v/<id>`) listo para WhatsApp, con vista previa. Se puede ponerle un nombre al horario («Primer semestre 2026») y desactivar el enlace cuando quieras.
- Quien abre el enlace ve el horario en solo lectura y puede **agregarlo al suyo** (suma los ramos sin borrar los que ya tiene y omite los repetidos), **compararlo** con el suyo o **reemplazar** el suyo. Sirve también para pasar tu horario del computador al celular.

**Comparar**
- Con **Comparar** ves tu horario junto al de hasta 5 personas, cada una con su color, y la grilla marca las **horas libres en común** y el mejor hueco. Cada horario se puede renombrar, ocultar y quitar.

**En el celular**
- Encabezado de una fila, menús emergentes, botón flotante para agregar ramo y hojas inferiores que se cierran arrastrando.
- Funciona también en horizontal, sin zoom accidental y sin que la página se mueva detrás de una hoja abierta.

## 🚀 Inicio rápido

### Requisitos
- Node.js 20.9 o superior
- pnpm (también funciona con npm)

### Instalación

```bash
git clone https://github.com/maxiiisss/schedule-maker.git
cd schedule-maker

pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). No necesitas configurar nada para probar la app: sin variables de entorno, compartir usa un almacenamiento en memoria que se borra al reiniciar.

## 🧪 Desarrollo

```bash
pnpm exec tsc --noEmit   # revisar tipos
pnpm build               # construir para producción
pnpm start               # servir la versión construida
```

El proyecto no tiene un linter ni pruebas automáticas: la revisión es `tsc` y `pnpm build`. Más comandos en [COMMANDS.md](COMMANDS.md).

## 🌐 Compartir por enlace (Upstash Redis)

Los enlaces se guardan en **Upstash Redis**. Para que funcionen fuera de tu computador:

1. Instala la integración de **Upstash** desde el Marketplace de Vercel, en el proyecto. Define `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (ver [.env.example](.env.example)). Márcalas para Production y Preview.
2. Vuelve a desplegar: las variables nuevas no se aplican a despliegues ya hechos.

Sin esas variables, en desarrollo se usa memoria y en producción `POST /api/share` responde 503 (el resto de la app funciona).

Cómo se comporta:
- Caducan a los **90 días sin visitas** (cada visita los renueva).
- El id es aleatorio de 10 caracteres y las páginas llevan `noindex`. Quien creó el enlace guarda un token secreto en su navegador para poder desactivarlo; en el servidor solo queda su hash.
- La API valida el horario con las mismas reglas del formulario, limita el tamaño (60 ramos, textos de 80 caracteres) y permite 10 peticiones por minuto por IP.
- La vista previa de cada enlace se genera en `app/v/[id]/opengraph-image.tsx`, y la de la página principal en `app/opengraph-image.tsx`.

## 🛠️ Tecnologías

- **Next.js 16** (App Router, Turbopack), **React 19** y **TypeScript**
- **Tailwind CSS 4** y componentes basados en shadcn / Base UI
- **Lucide React** para los íconos
- **html-to-image** para la captura PNG
- **Upstash Redis** (`@upstash/redis`, `@upstash/ratelimit`) para los enlaces compartidos
- **Vercel** para el despliegue

## 📁 Estructura

```
app/
├── page.tsx, layout.tsx          # Página principal y metadatos
├── v/[id]/                       # Página pública de un horario compartido (+ vista previa)
├── api/share/                    # Crear, leer y desactivar enlaces
├── not-found.tsx                 # 404 propio
├── icon.svg, apple-icon.png, favicon.ico, opengraph-image.tsx, robots.ts, sitemap.ts
components/
├── schedule/                     # Grilla, bloques, formulario, diálogos, menús y modal
├── share/                        # Panel para compartir y vista de solo lectura
├── compare/                      # Diálogo y barra para comparar horarios
└── ui/                           # Botón base
hooks/                            # Estado del horario, vista, personas, hora actual, bloqueo de scroll
lib/
├── schedule/                     # Dominio: tipos, validación, tiempo, colores, comparación, mezcla
└── share/                        # Esquema, ids, almacenamiento (Upstash) y cliente de la API
```

## 📝 Notas técnicas

- **Qué se guarda en el navegador** (`localStorage`): `schedule:v1` (tu horario), `schedule:view:v1` (vista elegida), `schedule:people:v1` (horarios que comparas), `schedule:share:v1` y `schedule:share-title` (tu último enlace). Nada de esto sale del dispositivo, salvo el horario que decides compartir.
- **Horas:** un ramo debe terminar el mismo día que empieza. Las horas libres en común cuentan solo en los días en que alguien tiene clases, con huecos de al menos 30 minutos.
- **Los horarios que comparas son una copia** del momento en que se compartieron. Si alguien cambia el suyo, hay que agregar su enlace nuevo.
- **Sin cuentas:** no hay usuarios ni servidor propio de datos más allá de los enlaces compartidos.
- **Zoom desactivado en celulares a propósito** (pellizco y doble toque). Reduce la accesibilidad para quien necesita ampliar la página; se revierte en `app/layout.tsx`.
- La dirección pública del sitio (canonical, `sitemap.xml`, vista previa) sale de `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel define solo; en local se usa `http://localhost:3000`.

## 🌿 Ramas y publicación

- `develop` es la rama de trabajo y `main` es lo que está desplegado en producción.
- Cada cambio va en una rama propia hacia `develop`; para publicar se abre un PR de `develop` a `main`.
- El código, los nombres de rama y los comentarios van en inglés; los textos de la interfaz están en español.

## 📄 Licencia

Proyecto personal. Libre para usar y modificar.
