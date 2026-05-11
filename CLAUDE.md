# Desafío Puzzles — Contexto del proyecto

## Qué es esto

Web para un desafío de puzzles y acertijos entre amigos. Un admin (Alex) crea desafíos organizados en fases, los equipos compiten enviando respuestas. El orden de llegada (timestamp) determina quién respondió primero. El admin decide manualmente el ganador y asigna puntos con trazabilidad.

## Stack

- **Framework**: Next.js 16 (App Router + TypeScript + Tailwind)
- **ORM**: Prisma 7 con PostgreSQL (Neon)
- **Deploy**: Vercel (autodeploy desde GitHub en cada push a master)
- **Repo**: github.com/WachinLr/desafio-puzzles (privado)

## Documentación de referencia

- **Requisitos completos y modelo de datos**: ver `docs/requisitos.md` (copiar desde el vault de Obsidian)
- **Sistema de diseño**: ver `docs/design-system.md`

## Modelo de datos (resumen)

6 tablas: Phase, Team, Challenge (estados: draft → active → finished), Submission, PointLog, SiteConfig (feature flags).

El ranking se calcula como `SUM(points) GROUP BY team_id` desde PointLog.

Feature flag `ranking_visible` controla si el ranking es visible para los equipos.

## Reglas de negocio clave

- Los equipos NO se registran. Seleccionan su nombre de un dropdown + código secreto.
- Anti-spam: máximo 1 envío cada 2 minutos por equipo por desafío.
- Los equipos pueden reenviar respuestas. Cuenta la primera respuesta correcta.
- Puede haber hasta 2 desafíos activos a la vez.
- Las respuestas NO se validan automáticamente. El admin decide el ganador.
- El panel admin se protege con URL secreta (variable de entorno ADMIN_SECRET).

## Dirección de diseño

Estética "escape room digital / tablero de detective". NO una app genérica.
- Tema oscuro, acentos neón (cyan/magenta), tipografía monoespaciada para pistas.
- Countdown dramático (no un simple número).
- Feed de actividad en vivo ("Equipo X ha enviado una respuesta").
- Mobile-first.
- **Ver `docs/design-system.md` para tokens concretos (colores, tipografías, componentes).**

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Página principal (desafío activo)
│   ├── ranking/                    # Ranking público
│   ├── historial/                  # Historial por fases
│   ├── admin/[ADMIN_SECRET]/       # Panel admin (URL secreta)
│   │   ├── layout.tsx              # Sidebar dorado, valida ADMIN_SECRET
│   │   ├── page.tsx                # Dashboard
│   │   ├── fases/                  # Gestión de fases
│   │   ├── desafios/               # Gestión de desafíos (+ /[id]/respuestas)
│   │   ├── equipos/                # Gestión de equipos
│   │   └── config/                 # Toggle ranking
│   └── api/                        # API routes
├── components/                     # Componentes reutilizables
├── lib/                            # Prisma client, utilidades
│   └── prisma.ts                   # Instancia singleton de Prisma
├── generated/prisma/               # Cliente Prisma generado (no commitear)
└── styles/
prisma/
└── schema.prisma                   # Modelo de datos
docs/
├── requisitos.md                   # Requisitos y funcionalidades completas
└── design-system.md                # Sistema de diseño con tokens
```

## Estado actual

### Completado
- [x] Proyecto Next.js inicializado (TypeScript + Tailwind + App Router)
- [x] Prisma configurado con Neon PostgreSQL
- [x] Deploy en Vercel funcionando (autodeploy desde master)
- [x] Prisma Client generando correctamente (postinstall script)

### Pendiente
- [x] **Fase 2**: Schema Prisma con todas las tablas + migraciones + seed
- [x] **Fase 3**: API routes (CRUD, anti-spam, validación código secreto, ranking, feature flags)
- [x] **Fase 4**: Frontend público (countdown, formulario, feed en vivo, ranking, historial)
- [x] **Fase 5**: Panel admin (gestión desafíos, ver respuestas, asignar puntos, toggle ranking)
- [x] **Fase 6**: Testing (Vitest + Playwright)

## Notas técnicas

- Prisma 7: el import es `from "@/generated/prisma/client"`, NO `from "@/generated/prisma"`.
- Prisma 7: PrismaClient usa el adapter `PrismaPg` con `{ connectionString: process.env.DATABASE_URL }`.
- Prisma 7: `url` y `directUrl` ya NO van en `schema.prisma`. Van en `prisma.config.ts` (`datasource.url`).
- Prisma 7: el seed se configura en `prisma.config.ts` (`migrations.seed`), NO en `package.json`.
- `prisma.config.ts` usa `DIRECT_URL` para migraciones (conexión directa Neon, no pooler).
- `prisma.ts` (runtime) usa `DATABASE_URL` (pooler Neon) a través del adapter PrismaPg.
- El `postinstall` script en package.json ejecuta `prisma generate` automáticamente en Vercel.
- Node 24 en local, Vercel usa su propia versión de Node.
