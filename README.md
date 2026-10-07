# ScheduleGrid

Una aplicación web moderna para crear, organizar y gestionar horarios universitarios de forma interactiva e intuitiva. Diseñada con una interfaz intuitiva que permite visualizar conflictos de horarios y exportar tu calendario en múltiples formatos.

## ✨ Características

- **Entrada de horas flexible**: Formato 24h (HH:mm) con precisión de minuto (ej: 13:50, 08:15)
- **Grilla visual interactiva**: Visualiza tu horario por días de la semana
- **Detección automática**: Expande la grilla hacia el fin de semana si lo necesitas
- **Colores personalizados**: Cada ramo recibe automáticamente un color único
- **Guardado automático**: Tus horarios se guardan automáticamente en el navegador
- **Múltiples opciones de respaldo**:
  - 📸 **Descargar captura PNG** del horario para compartir
  - 📄 **Descargar respaldo JSON** para guardar tu horario en archivo
  - 📥 **Restaurar desde respaldo** para recuperar horarios guardados
- **Persistencia local**: Recupera tu horario automáticamente al volver a abrir la página

## 🚀 Inicio rápido

### Requisitos
- Node.js 18+ 
- pnpm (o npm/yarn)

### Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd schedule-maker

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📋 Uso

1. **Agregar un ramo**:
   - Haz clic en "Agregar ramo"
   - Ingresa nombre, sala (opcional) y horario
   - Selecciona los días y el color (opcional)
   - Guarda

2. **Editar un ramo**:
   - Haz clic sobre el bloque del ramo en la grilla
   - Modifica los datos
   - Guarda

3. **Eliminar un ramo**:
   - Haz clic sobre el bloque
   - Usa el botón de eliminar

4. **Guardar tu horario**:
   - Haz clic en "Guardar"
   - Elige entre:
     - Descargar como PNG (captura visual)
     - Descargar como JSON (respaldo completo)
     - Restaurar desde un archivo JSON anterior

5. **Limpiar todo**:
   - Haz clic en "Limpiar" para vaciar el horario

## 🛠️ Tecnologías

- **Frontend**: React 19 + TypeScript
- **Framework**: Next.js 16 (Turbopack)
- **Styling**: Tailwind CSS 4 + shadcn components
- **Iconos**: Lucide React
- **Exportación de imágenes**: html-to-image
- **Persistencia**: localStorage

## 📁 Estructura del proyecto

```
schedule-maker/
├── app/                    # Configuración de Next.js
├── components/
│   ├── schedule/          # Componentes principales
│   │   ├── course-form.tsx
│   │   ├── course-dialog.tsx
│   │   ├── schedule-view.tsx
│   │   └── schedule-grid.tsx
│   └── ui/                # Componentes reutilizables
├── hooks/
│   └── use-schedule.ts    # Lógica del estado del horario
├── lib/
│   └── schedule/          # Utilidades de dominio
│       ├── types.ts
│       ├── validation.ts
│       ├── time.ts
│       ├── colors.ts
│       └── constants.ts
└── package.json
```

## 🧪 Desarrollo

```bash
# Validar tipos
pnpm exec tsc --noEmit

# Construir para producción
pnpm build

# Iniciar servidor de producción
pnpm start
```

## 📝 Notas técnicas

- El horario se persiste en `localStorage` con la clave `schedule:v1`
- Los horarios deben estar dentro del rango 08:00 - 22:00
- Soporta horas con minutos personalizados (no requiere intervalos fijos)
- Los bloques superpuestos se distribuyen automáticamente en columnas

## 🔗 Compartir por enlace

El botón **Compartir**, junto a Guardar, crea una dirección corta (`/v/<id>`) con una copia del horario, lista para enviar por WhatsApp. Quien la abre ve el horario en solo lectura y puede copiarlo como suyo.

- Los enlaces se guardan en **Upstash Redis** y caducan a los 90 días sin visitas (cada visita los renueva).
- El id es aleatorio de 10 caracteres y la página lleva `noindex`. Quien creó el enlace puede desactivarlo con «Dejar de compartir».
- La API (`POST /api/share`) valida el horario, limita el tamaño y permite 10 peticiones por minuto por IP.
- La vista previa de WhatsApp se genera en `app/v/[id]/opengraph-image.tsx`.

**Configuración:** instala la integración de Upstash desde el Marketplace de Vercel (define `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`; ver `.env.example`). Sin esas variables, en desarrollo se usa un almacenamiento en memoria y en producción compartir responde 503.

## 👥 Comparar horarios

El botón **Comparar** permite ver tu horario junto al de otras personas y encontrar las horas en que todos están libres.

- Se agrega un horario pegando su enlace compartido, o con **Comparar con el mío** en la página `/v/<id>`. Se pueden comparar hasta 5 a la vez.
- Cada persona tiene su color; los bloques de otras personas son de solo lectura. Se pueden renombrar, ocultar y quitar (con «Deshacer»).
- Las **horas libres en común** se marcan en la grilla («Libres») y la barra indica el mejor hueco. Solo cuentan los días en que alguien tiene clases, y los huecos de al menos 30 minutos dentro de 08:00–22:00.
- Los horarios de otras personas se guardan solo en este dispositivo (`schedule:people:v1`) y son una copia del momento en que se compartieron.

## 📄 Licencia

Proyecto personal. Libre para usar y modificar.

---

**Hecho con ❤️ para estudiantes universitarios**
