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

## 📄 Licencia

Proyecto personal. Libre para usar y modificar.

---

**Hecho con ❤️ para estudiantes universitarios**
