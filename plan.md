# Plan — Plataforma de Capacitaciones en Seguridad e Higiene

## Arquitectura General (Monolito)

```
┌─────────────────────────────────────────────────┐
│                   Express Server                │
│  ┌───────────────────────────────────────────┐  │
│  │  /api/*  →  Controllers  →  Prisma → MySQL │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  /*  →  sirve client/dist/index.html      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

En **producción**, Express sirve los archivos estáticos compilados de Vue (`client/dist/`).
En **desarrollo**, Vite sirve el frontend con HMR y Express corre como API independiente.

---

## 1. Esquema Relacional (MySQL + Prisma ORM)

### Diagrama de Entidades

```
Empresa ──┬── Trabajador
          └── Cuestionario ──┬── Pregunta ──┬── Opcion
                             │              └── Respuesta
                             └── Intento ────── Respuesta
```

### Tablas

**empresas**
| Columna     | Tipo         | Constraint     |
|-------------|--------------|----------------|
| id          | INT          | PK, AUTO_INC   |
| nombre      | VARCHAR(255) | NOT NULL       |
| created_at  | DATETIME     | DEFAULT NOW()  |
| updated_at  | DATETIME     | ON UPDATE      |

**trabajadores**
| Columna        | Tipo         | Constraint          |
|----------------|--------------|---------------------|
| id             | INT          | PK, AUTO_INC        |
| nombre_completo| VARCHAR(255) | NOT NULL            |
| dni            | VARCHAR(20)  | UNIQUE, NOT NULL    |
| empresa_id     | INT          | FK → empresas.id    |
| created_at     | DATETIME     | DEFAULT NOW()       |
| updated_at     | DATETIME     | ON UPDATE           |

**cuestionarios**
| Columna              | Tipo         | Constraint          |
|----------------------|--------------|---------------------|
| id                   | INT          | PK, AUTO_INC        |
| titulo               | VARCHAR(255) | NOT NULL            |
| descripcion          | TEXT         | NULLABLE            |
| porcentaje_aprobacion| DECIMAL(5,2) | NOT NULL            |
| intentos_permitidos  | INT          | DEFAULT 1           |
| url_token            | VARCHAR(36)  | UNIQUE, DEFAULT UUID|
| empresa_id           | INT          | FK → empresas.id    |
| activo               | BOOLEAN      | DEFAULT TRUE        |
| created_at           | DATETIME     | DEFAULT NOW()       |
| updated_at           | DATETIME     | ON UPDATE           |

**preguntas**
| Columna        | Tipo         | Constraint              |
|----------------|--------------|-------------------------|
| id             | INT          | PK, AUTO_INC            |
| cuestionario_id| INT          | FK → cuestionarios.id   |
| texto          | TEXT         | NOT NULL                |
| tipo           | ENUM('MC','TF')| NOT NULL              |
| orden          | INT          | DEFAULT 0               |
| created_at     | DATETIME     | DEFAULT NOW()           |

- `MC` = Multiple Choice, `TF` = True/False

**opciones**
| Columna     | Tipo         | Constraint            |
|-------------|--------------|-----------------------|
| id          | INT          | PK, AUTO_INC          |
| pregunta_id | INT          | FK → preguntas.id     |
| texto       | VARCHAR(255) | NOT NULL              |
| es_correcta | BOOLEAN      | NOT NULL              |
| created_at  | DATETIME     | DEFAULT NOW()         |

**intentos**
| Columna        | Tipo         | Constraint              |
|----------------|--------------|-------------------------|
| id             | INT          | PK, AUTO_INC            |
| trabajador_id  | INT          | FK → trabajadores.id    |
| cuestionario_id| INT          | FK → cuestionarios.id   |
| puntaje        | DECIMAL(5,2) | NULLABLE (hasta corregir)|
| aprobado       | BOOLEAN      | NULLABLE                |
| created_at     | DATETIME     | DEFAULT NOW()           |

**respuestas**
| Columna    | Tipo     | Constraint            |
|------------|----------|-----------------------|
| id         | INT      | PK, AUTO_INC          |
| intento_id | INT      | FK → intentos.id      |
| pregunta_id| INT      | FK → preguntas.id     |
| opcion_id  | INT      | FK → opciones.id      |
| created_at | DATETIME | DEFAULT NOW()         |

### Reglas de negocio en BD

- `trabajadores.dni` es **único** en toda la plataforma (no solo por empresa).
- `cuestionarios.url_token` es UUID v4 generado automáticamente.
- El puntaje se calcula en backend al cerrar el intento: `(correctas / total) * 100`.
- `intentos.aprobado` se setea comparando `puntaje >= porcentaje_aprobacion`.

---

## 2. Diseño de la API REST

### Base URL: `/api`

### Autenticación Admin (`/api/admin/auth`)

| Método | Ruta            | Body                          | Respuesta                     | Auth |
|--------|-----------------|-------------------------------|-------------------------------|------|
| POST   | /admin/auth/login | `{ password }`              | `{ token }`                   | No   |
| GET    | /admin/auth/me  | —                             | `{ admin: true }`             | JWT  |

El admin se autentica con una **contraseña maestra** definida en `ADMIN_PASSWORD` (env). Se usa JWT con expiración de 24h.

### Empresas (`/api/admin/empresas`)

| Método | Ruta          | Body             | Respuesta                | Auth |
|--------|---------------|------------------|--------------------------|------|
| GET    | /empresas     | —                | `[ { id, nombre, ... } ]`| JWT  |
| POST   | /empresas     | `{ nombre }`     | `{ id, nombre }`         | JWT  |
| PUT    | /empresas/:id | `{ nombre }`     | `{ id, nombre }`         | JWT  |
| DELETE | /empresas/:id | —                | `{ ok: true }`           | JWT  |

### Trabajadores (`/api/admin/empresas/:eid/trabajadores`)

| Método | Ruta                          | Body                             | Respuesta                     | Auth |
|--------|-------------------------------|----------------------------------|-------------------------------|------|
| GET    | /empresas/:eid/trabajadores   | —                                | `[ { id, nombre, dni } ]`    | JWT  |
| POST   | /empresas/:eid/trabajadores   | `{ nombreCompleto, dni }`        | `{ id, nombreCompleto, dni }`| JWT  |
| POST   | /empresas/:eid/trabajadores/bulk | `{ trabajadores: [{ nombreCompleto, dni }] }` | `{ count }` | JWT |
| DELETE | /trabajadores/:id             | —                                | `{ ok: true }`               | JWT  |

### Cuestionarios (`/api/admin/cuestionarios`)

| Método | Ruta                     | Body                                          | Respuesta                    | Auth |
|--------|--------------------------|-----------------------------------------------|------------------------------|------|
| GET    | /cuestionarios           | —                                             | `[ { id, titulo, ... } ]`   | JWT  |
| POST   | /cuestionarios           | `{ titulo, descripcion, porcentajeAprobacion, intentosPermitidos, empresaId, preguntas: [...] }` | `{ id, urlToken }` | JWT |
| GET    | /cuestionarios/:id       | —                                             | `{ id, titulo, preguntas }`  | JWT  |
| PUT    | /cuestionarios/:id       | `{ titulo, descripcion, ... }`                | `{ id, ... }`                | JWT  |
| DELETE | /cuestionarios/:id       | —                                             | `{ ok: true }`               | JWT  |
| GET    | /cuestionarios/:id/resultados | —                                         | `[ { trabajador, intentos, estado } ]` | JWT |
| GET    | /cuestionarios/:id/qr    | —                                             | `{ svg }` o redirige a PNG   | JWT  |

**Estructura de `preguntas` en POST/PUT:**
```json
{
  "preguntas": [
    {
      "texto": "¿...?",
      "tipo": "MC",
      "orden": 1,
      "opciones": [
        { "texto": "Opción A", "esCorrecta": true },
        { "texto": "Opción B", "esCorrecta": false }
      ]
    }
  ]
}
```

### Worker (público — `/api/c/:token`)

| Método | Ruta                   | Body         | Respuesta                              |
|--------|------------------------|--------------|----------------------------------------|
| GET    | /c/:token              | —            | `{ titulo, descripcion, empresa }`     |
| POST   | /c/:token/login        | `{ dni }`    | `{ workerToken, nombre, intentosRestantes }` |
| GET    | /c/:token/preguntas    | —            | `[ { id, texto, tipo, opciones: [{id, texto}] } ]` |
| POST   | /c/:token/intento      | `{ respuestas: [{ preguntaId, opcionId }] }` | `{ puntaje, aprobado, totalCorrectas, totalPreguntas }` |

**Flujo Worker:**
1. GET /c/:token → muestra pantalla de bienvenida
2. POST /c/:token/login → valida DNI contra la empresa del cuestionario, devuelve `workerToken` (JWT corto, 1h)
3. GET /c/:token/preguntas (header: `Authorization: Bearer <workerToken>`) → devuelve preguntas **sin** la respuesta correcta
4. POST /c/:token/intento (header: `Authorization: Bearer <workerToken>`) → evalúa, guarda, devuelve resultado

**Control de intentos:** en el paso 2, se cuenta `WHERE trabajador_id = X AND cuestionario_id = Y`. Si `count >= intentos_permitidos`, se responde con `{ error: "LIMITE_ALCANZADO", mensaje: "..." }`.

---

## 3. Estructura de Carpetas

```
proyecto_capacitaciones/
│
├── client/                          # Frontend Vue 3 + Vite
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   │   └── main.css             # Directivas Tailwind
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminSidebar.vue
│   │   │   │   ├── DashboardCard.vue
│   │   │   │   └── DataTable.vue
│   │   │   └── worker/
│   │   │       ├── ProgressBar.vue
│   │   │       ├── QuestionCard.vue
│   │   │       └── ResultCard.vue
│   │   ├── composables/
│   │   │   ├── useApi.js
│   │   │   └── useAuth.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── stores/
│   │   │   └── auth.js              # Pinia store
│   │   ├── views/
│   │   │   ├── admin/
│   │   │   │   ├── LoginView.vue
│   │   │   │   ├── DashboardView.vue
│   │   │   │   ├── EmpresasView.vue
│   │   │   │   ├── TrabajadoresView.vue
│   │   │   │   ├── CuestionariosView.vue
│   │   │   │   ├── CuestionarioFormView.vue
│   │   │   │   └── ResultadosView.vue
│   │   │   └── worker/
│   │   │       ├── HomeView.vue       # Bienvenida + login DNI
│   │   │       ├── QuizView.vue       # Una pregunta por pantalla
│   │   │       └── ResultView.vue     # Resultado final
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── server/                          # Backend Express
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── empresaController.js
│   │   │   ├── trabajadorController.js
│   │   │   ├── cuestionarioController.js
│   │   │   ├── intentoController.js
│   │   │   └── qrController.js
│   │   ├── middleware/
│   │   │   ├── adminAuth.js
│   │   │   └── workerAuth.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── admin.js
│   │   │   └── worker.js
│   │   └── app.js                   # Entry point
│   ├── .env                         # DATABASE_URL, ADMIN_PASSWORD, JWT_SECRET
│   └── package.json
│
├── package.json                     # Scripts raíz (build, start, dev)
├── .gitignore
├── plan.md
└── README.md
```

---

## 4. Comandos de Ejecución

### Desarrollo

```bash
# Terminal 1 — Backend (Express con nodemon, puerto 3001)
cd server
npm install
npx prisma generate
npx prisma db push              # Sincroniza esquema con MySQL
npm run dev                      # nodemon src/app.js

# Terminal 2 — Frontend (Vite con HMR, puerto 5173)
cd client
npm install
npm run dev                      # vite
```

El frontend en dev apunta a `http://localhost:3001/api` (configurado en `vite.config.js` con proxy).

### Producción (Render / Railway)

**Build Command:**
```bash
cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate
```

**Start Command:**
```bash
cd server && npx prisma db push && node src/app.js
```

**Variables de entorno requeridas:**
| Variable          | Descripción                          |
|-------------------|--------------------------------------|
| `DATABASE_URL`    | `mysql://user:pass@host:3306/dbname` |
| `ADMIN_PASSWORD`  | Contraseña maestra del panel admin   |
| `JWT_SECRET`      | Secreto para firmar JWT              |
| `NODE_ENV`        | `production`                         |
| `PORT`            | Puerto del servidor (default: 3000)  |

### Flujo de archivos estáticos en producción

En `server/src/app.js`:
```js
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}
```

---

## 5. Diseño UI/UX (TailwindCSS)

### Paleta de colores

| Uso                | Clase Tailwind       | Hex       |
|--------------------|----------------------|-----------|
| Fondos corporativos| `bg-slate-900/800`   | #0f172a / #1e293b |
| Sidebar nav        | `bg-slate-800`       | #1e293b   |
| Superficies tarjeta| `bg-white` / `bg-slate-50` | —    |
| Texto principal    | `text-slate-900`     | #0f172a   |
| Texto secundario   | `text-slate-500`     | #64748b   |
| Aprobado           | `text-emerald-600` / `bg-emerald-100` | #059669 / #d1fae5 |
| Desaprobado        | `text-red-500` / `bg-red-100`         | #ef4444 / #fee2e2 |
| Acento (botones)   | `bg-blue-600`        | #2563eb   |

### Layout Admin (Desktop-First)

```
┌──────────────────────────────────────────────────┐
│ Sidebar (w-64)        │  Main Content            │
│ bg-slate-800          │  p-6                     │
│ ┌──────────────────┐  │  ┌────────────────────┐  │
│ │ Logo / Título    │  │  │ Page Title         │  │
│ │──────────────────│  │  │                    │  │
│ │ ◎ Dashboard      │  │  │ ┌────┐ ┌────┐     │  │
│ │ ◎ Empresas       │  │  │ │Card│ │Card│     │  │
│ │ ◎ Trabajadores   │  │  │ └────┘ └────┘     │  │
│ │ ◎ Cuestionarios  │  │  │                    │  │
│ │                  │  │  │ ┌────────────────┐ │  │
│ │ ─────────────────│  │  │ │    Table       │ │  │
│ │ ⚙ Cerrar Sesión  │  │  │ └────────────────┘ │  │
│ └──────────────────┘  │  └────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### Layout Worker (Mobile-First)

```
┌──────────────────────┐
│ Pantalla completa     │
│ min-h-screen, flex,   │
│ items-center, p-4     │
│                       │
│  ┌──────────────────┐ │
│  │  Bienvenida       │ │
│  │  Título cuestion. │ │
│  │                   │ │
│  │  [DNI input]      │ │  ← type="tel", text-2xl
│  │                   │ │
│  │  [Comenzar]       │ │  ← w-full, py-4, text-xl
│  └──────────────────┘ │
│                       │
│  (Por pregunta)       │
│  ┌──────────────────┐ │
│  │ Pregunta 3/10     │ │
│  │ ████████░░░░ 70%  │ │  ← ProgressBar
│  │                   │ │
│  │ ¿Texto pregunta?  │ │  ← text-lg font-semibold
│  │                   │ │
│  │ [▢ Opción A]      │ │  ← w-full, py-3, text-left
│  │ [▢ Opción B]      │ │
│  │ [▢ Opción C]      │ │
│  │                   │ │
│  │ [Siguiente →]     │ │  ← w-full, py-4
│  └──────────────────┘ │
└──────────────────────┘
```

---

## 6. Árbol de Componentes Vue

```
App.vue
├── AdminLayout.vue (v-if="ruta /admin/*")
│   ├── AdminSidebar.vue
│   └── <router-view>
│       ├── AdminLoginView.vue
│       ├── DashboardView.vue
│       │   └── DashboardCard.vue (×N)
│       ├── EmpresasView.vue
│       │   └── DataTable.vue
│       ├── TrabajadoresView.vue
│       │   └── DataTable.vue
│       ├── CuestionariosView.vue
│       │   └── DataTable.vue
│       ├── CuestionarioFormView.vue
│       │   └── PreguntaEditor.vue (×N)
│       └── ResultadosView.vue
│           ├── DataTable.vue
│           └── QRCodeCard.vue
│
└── WorkerLayout.vue (v-if="ruta /c/:token")
    └── <router-view>
        ├── HomeView.vue
        ├── QuizView.vue
        │   ├── ProgressBar.vue
        │   └── QuestionCard.vue
        └── ResultView.vue
            └── ResultCard.vue
```

---

## 7. Plan de Implementación (Fase 2 — orden de ejecución)

| Paso | Descripción |
|------|-------------|
| 1 | `npm init` raíz + `server/` + `client/`. package.json con scripts. |
| 2 | Configurar Prisma: schema, `.env`, `prisma db push`. |
| 3 | Express: conexión a BD, CORS, rutas, middleware JWT, controladores (CRUD empresas, trabajadores, cuestionarios, preguntas). |
| 4 | Express: endpoint worker (login DNI, obtener preguntas, enviar intento, evaluar). |
| 5 | Express: generación de QR (`qrcode` librería), servir archivos estáticos en prod. |
| 6 | Vue: proyecto con Vite + Vue 3 + Tailwind + Pinia + Vue Router. |
| 7 | Vue: layout admin (sidebar, dashboard, CRUD empresas/trabajadores/cuestionarios). |
| 8 | Vue: layout worker (login DNI, quiz one-by-one, resultado). |
| 9 | Integración: build de Vue, pruebas de flujo completo. |
| 10 | Limpieza, `.gitignore`, verificación de build en producción. |

---

## 8. Librerías y Versiones

### Backend (`server/package.json`)

| Paquete           | Uso                          |
|-------------------|------------------------------|
| `express`         | Framework HTTP                |
| `@prisma/client`  | ORM MySQL                    |
| `prisma`          | CLI de Prisma (devDep)       |
| `jsonwebtoken`    | JWT admin + worker           |
| `bcryptjs`        | Hash de contraseña admin     |
| `qrcode`          | Generación de QR en servidor |
| `cors`            | CORS en desarrollo           |
| `dotenv`          | Variables de entorno         |
| `nodemon`         | Hot reload (devDep)          |

### Frontend (`client/package.json`)

| Paquete           | Uso                          |
|-------------------|------------------------------|
| `vue`             | Framework UI (v3)            |
| `vue-router`      | Rutas SPA                    |
| `pinia`           | Estado global                |
| `axios`           | HTTP client                  |
| `tailwindcss`     | CSS utility framework        |
| `@tailwindcss/vite` | Plugin Vite para Tailwind  |
| `vite`            | Bundler                      |

---

Este plan cubre todos los requerimientos del MVP. Queda a la espera de tu aprobación para comenzar la Fase 2 (ejecución).
