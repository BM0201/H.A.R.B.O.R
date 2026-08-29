/**
 * dependency-cruiser — enforcement de la arquitectura hexagonal por contexto.
 * ADR-0003 (docs/ARQUITECTURA-HARBOR.md). "Sin esta regla en CI, el ADR-0003 es
 * decorativo."
 *
 * Alcance: solo `src/contexts/**` (los bounded contexts hexagonales nuevos). Los
 * módulos heredados en `src/modules/**` son planos y quedan fuera hasta que
 * migren a `contexts/`.
 *
 * Correr:  npm run arch:check   (en cargo-api)
 */

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── Capa domain: núcleo puro ──────────────────────────────────────────
    {
      name: "domain-no-outward",
      severity: "error",
      comment:
        "domain/ es TypeScript puro: no puede depender de application/, infrastructure/ ni interfaces/.",
      from: { path: "^src/contexts/([^/]+)/domain/" },
      to: {
        path: "^src/contexts/([^/]+)/(application|infrastructure|interfaces)/",
      },
    },
    {
      name: "domain-no-prisma-next-io",
      severity: "error",
      comment:
        "domain/ no puede importar Prisma, Next, ni ningún paquete de I/O. El dominio define SUS propias entidades.",
      from: { path: "^src/contexts/[^/]+/domain/" },
      to: {
        path: [
          "node_modules/@prisma/client",
          "node_modules/\\.prisma/",
          "node_modules/prisma/",
          "node_modules/next/",
          "node_modules/@neondatabase/",
          "node_modules/@upstash/",
          "node_modules/exceljs/",
        ],
      },
    },
    {
      name: "domain-no-app-lib",
      severity: "error",
      comment: "domain/ no puede importar de @/lib (db, http, prisma, adaptadores).",
      from: { path: "^src/contexts/[^/]+/domain/" },
      to: { path: "^src/lib/" },
    },

    // ── Capa application: orquesta el dominio vía puertos ──────────────────
    {
      name: "application-no-infra-interfaces",
      severity: "error",
      comment:
        "application/ depende de puertos (interfaces del dominio), nunca de infrastructure/ ni interfaces/.",
      from: { path: "^src/contexts/([^/]+)/application/" },
      to: { path: "^src/contexts/([^/]+)/(infrastructure|interfaces)/" },
    },
    {
      name: "application-no-prisma",
      severity: "error",
      comment: "application/ no toca Prisma directo — eso vive en infrastructure/.",
      from: { path: "^src/contexts/[^/]+/application/" },
      to: {
        path: [
          "node_modules/@prisma/client",
          "node_modules/\\.prisma/",
        ],
      },
    },

    // ── Fronteras entre contextos ────────────────────────────────────────
    {
      name: "no-deep-cross-context-import",
      severity: "error",
      comment:
        "Un contexto solo se importa desde su índice público (src/contexts/<x>/index.ts), nunca desde su interior.",
      from: { path: "^src/contexts/([^/]+)/" },
      to: {
        path: "^src/contexts/([^/]+)/.+",
        pathNot: [
          "^src/contexts/$1/", // dentro del mismo contexto: permitido
          "^src/contexts/[^/]+/index\\.ts$", // el índice público de cualquier contexto: permitido
        ],
      },
    },

    // ── Higiene general — SOLO en contexts/ (los módulos heredados en
    //    src/modules/** son deuda conocida de HAMMER, fuera de alcance hasta
    //    que migren; ver src/contexts/README.md) ──────────────────────────
    {
      name: "no-circular",
      severity: "error",
      comment: "Dependencias circulares dentro de los bounded contexts.",
      from: { path: "^src/contexts/" },
      to: { circular: true, path: "^src/contexts/" },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment: "Archivo de contexto sin nada que lo importe (posible código muerto).",
      from: {
        path: "^src/contexts/",
        orphan: true,
        pathNot: [
          "\\.(test|spec)\\.[jt]sx?$",
          "\\.d\\.ts$",
          "(^|/)index\\.ts$",
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
