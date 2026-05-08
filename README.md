# Plataforma de Capacitaciones SyH

Sistema web para la gestión y evaluación de capacitaciones en Seguridad e Higiene. Los administradores crean cuestionarios, asignan trabajadores por empresa, y los trabajadores rinden desde cualquier dispositivo mediante un enlace QR.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 (Composition API), Vite, TailwindCSS v4 |
| Backend | Node.js, Express |
| ORM | Prisma |
| BD Local | SQLite |
| BD Producción | MySQL |
| Autenticación | JWT (admin 24h, worker 2h) |
| QR | Librería `qrcode` |

## Estructura del Proyecto

```
proyecto_capacitaciones/
├── client/                  # Frontend Vue 3 + Vite
│   └── src/
│       ├── assets/          # Estilos globales (TailwindCSS)
│       ├── components/      # Componentes reutilizables
│       ├── composables/     # API client (axios)
│       ├── router/          # Configuración de rutas
│       ├── stores/          # Pinia stores
│       └── views/           # Vistas (admin/ y worker/)
├── server/                  # Backend Express
│   └── src/
│       ├── controllers/     # Lógica de negocio
│       ├── middleware/      # Autenticación JWT
│       ├── routes/          # Definición de rutas
│       └── utils/           # Prisma client
├── package.json             # Scripts raíz
└── plan.md                  # Documentación del desarrollo
```

## Requisitos

- Node.js 18+
- npm 9+

## Configuración Inicial

### 1. Variables de Entorno

Crear `server/.env`:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="admin123"
JWT_SECRET="capacitaciones-secret-key-change-in-production"
PORT=3000
```

Para MySQL en producción:

```env
DATABASE_URL="mysql://usuario:password@host:3306/capacitaciones"
```

### 2. Instalar Dependencias

```bash
# Desde la raíz del proyecto (instala client/ y server/ automáticamente)
npm install
```

### 3. Inicializar Base de Datos

```bash
npm run db:generate
npm run db:push
```

### 4. Ejecutar en Desarrollo

```bash
# Inicia backend (puerto 3000) y frontend (puerto 5173) concurrentemente
npm run dev
```

Abrir [http://localhost:5173](http://localhost:5173) y navegar a `/admin/login` con la contraseña definida en `ADMIN_PASSWORD`.

## Scripts Disponibles

| Script | Descripción |
|--------|------------|
| `npm run dev` | Inicia backend y frontend en modo desarrollo |
| `npm run build` | Compila el frontend para producción |
| `npm run start` | Inicia el servidor en producción (requiere build previo) |
| `npm run db:push` | Sincroniza el esquema de Prisma con la BD |
| `npm run db:generate` | Genera el cliente Prisma |

## Funcionalidades Principales

- **Panel Administrador**: Dashboard con métricas, CRUD de empresas, trabajadores y cuestionarios
- **Carga por CSV**: Importación masiva de trabajadores y preguntas (CSV y DOCX)
- **Cuestionarios**: Tipo multiple choice y verdadero/falso, con porcentaje de aprobación configurable
- **Intentos Ilimitados**: Opción para permitir reintentos sin límite
- **Acceso por QR**: Cada cuestionario genera un QR único para acceso de trabajadores
- **Modo Trabajador**: Login por DNI, una pregunta por pantalla, diseño mobile-first
- **Resultados**: Visualización de aprobados/desaprobados por cuestionario
- **Constancia**: Generación de certificado en PNG descargable
- **Búsqueda y Paginación**: Búsqueda con debounce en empresas, trabajadores y cuestionarios + scroll infinito

## Deploy

El proyecto está preparado para deploy como servicio único en Render o Railway.

Build command:
```bash
cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate
```

Start command:
```bash
cd server && npx prisma db push && node src/app.js
```
