# Comandos disponibles

Guía de comandos para desarrollar y desplegar **ScheduleGrid**.

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install

# Reinstalar con lockfile actualizado
pnpm install --no-frozen-lockfile
```

## 🚀 Desarrollo

```bash
# Iniciar servidor de desarrollo (http://localhost:3000)
pnpm dev

# Validar tipos sin compilar
pnpm exec tsc --noEmit
```

## 🏗️ Producción

```bash
# Construir para producción (genera carpeta .next/)
pnpm build

# Iniciar servidor de producción (después de build)
pnpm start

# Construir + validar tipos
pnpm build && pnpm exec tsc --noEmit
```

## 🔍 Validación

```bash
# Comprobar errores de TypeScript
pnpm exec tsc --noEmit

# Construir y detectar errores
pnpm build
```

## 📝 Git

```bash
# Ver estado de cambios
git status

# Ver cambios detallados
git diff

# Agregar cambios
git add .

# Hacer commit
git commit -m "mensaje descriptivo"

# Hacer push
git push

# Combo: agregar + commit + push
git add . && git commit -m "mensaje" && git push
```

## 🌐 Vercel (Despliegue)

```bash
# Ver estado de despliegues
npx vercel list

# Desplegar a producción
npx vercel --prod

# Inspeccionar un despliegue fallido
npx vercel inspect dpl_ID --logs
```

## 📦 Herramientas útiles

```bash
# Ver versión de Node
node --version

# Ver versión de pnpm
pnpm --version

# Limpiar caché de Node
rm -rf node_modules pnpm-lock.yaml

# Reinstalar desde cero
pnpm install
```

## 💡 Flujo típico de desarrollo

```bash
# 1. Instalar dependencias
pnpm install

# 2. Hacer cambios en el código

# 3. Validar tipos
pnpm exec tsc --noEmit

# 4. Probar en desarrollo
pnpm dev

# 5. Agregar cambios a git
git add .

# 6. Hacer commit
git commit -m "feat: descripción de cambios"

# 7. Hacer push
git push

# 8. Vercel despliegue automático
```

## 📱 Estructura de carpetas

```
schedule-maker/
├── app/                  # Configuración de Next.js
├── components/          # Componentes React
├── hooks/              # Hooks personalizados
├── lib/               # Utilidades y lógica de dominio
├── public/            # Archivos estáticos (favicon, etc)
├── package.json       # Dependencias
├── tsconfig.json      # Configuración TypeScript
└── next.config.mjs    # Configuración Next.js
```

---
