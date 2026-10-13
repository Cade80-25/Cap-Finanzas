# INFORME DE SESIÓN — Auditoría y reparación de vulnerabilidades (v1.1.73)

**Fecha:** 12 de octubre de 2026
**Repo:** Cade80-25/Cap-Finanzas
**Commit:** ea70ca1 `fix(security): 190->0 vulnerabilidades Dependabot`
**Alcance:** Verificación y reparación completa de las 190 alertas Dependabot abiertas.

---

## 1. Estado inicial

`gh api` reportó **190 alertas abiertas** (2 críticas, 100 altas, 77 medias, 11 bajas) sobre 36 paquetes, con `npm audit` local confirmando **184 vulnerabilidades en 9 errores**.

## 2. Reparaciones aplicadas

### 2.1 Upgrades mayores de dependencias directas

| Paquete | Antes | Después | Alertas cerradas |
|---|---|---|---|
| electron | 39.2.7 | **44.7.0** | 38 (Chromium/Electron EOL) |
| react-router-dom | 6.30.1 | **7.18.4** | 6 (incl. @remix-run/router) |
| electron-builder | 26.0.12 | **26.17.0** | app-builder-lib, dmg-builder |
| wait-on | 9.0.3 | **9.5.1** | axios 1.20.0, joi 18.2.9, lodash 4.18.1 |
| tailwindcss | 3.4.17 | **4.3.3** | braces, chokidar, micromatch, fast-glob, postcss-nested |
| vite | 7.3.0 | 7.3.5 | postcss-selector-parser (build) |
| postcss | 8.5.6 | 8.5.23 | — |
| pdfjs-dist | 5.7.284 | **removida** | 1 HIGH runtime (sin uso en código) |
| shell-quote | 1.9.0 | **removida** | 1 crítica (huérfana, sin uso) |
| lovable-tagger | 1.1.11 | **removida** | 9 (arrastraba tailwindcss@3.4.19 anidado) |
| tailwindcss-animate | 1.0.7 | **removida** | (reemplazada por tw-animate-css v4) |

### 2.2 Overrides npm (transitivas sin fix in-range)

```
"overrides": {
  "uuid": "^11.1.1",
  "@electron/get": "^5.1.0",
  "postcss-selector-parser": "^7.1.6"
}
```

- `uuid@11.1.1` — cierra alerta de exceljs (que pinnea ^8)
- `@electron/get@5.1.0` — elimina la cadena completa sprintf-js → roarr → global-agent (dentro de electron-builder)
- `postcss-selector-parser@7.1.6` — cierre la única moderada restante (pinnada por @tailwindcss/typography)

### 2.3 Regeneración del lockfile

Eliminado `package-lock.json` y re-resueltos ~150 paquetes transitivos in-range: tar 7.5.22, @xmldom/xmldom 0.8.15, js-yaml 4.3.2, ws 8.21+, nanoid, minimatch, brace-expansion, tmp, flatted, @humanfs/node, source-map-js, builder-util-runtime, browserslist…

### 2.4 Migración Tailwind 3 → 4

- `src/index.css`: `@tailwind base/components/utilities` → `@import "tailwindcss"` + `@import "tw-animate-css"` + `@config "../tailwind.config.ts"` + `@plugin "@tailwindcss/typography"`
- `postcss.config.js`: plugin `tailwindcss` → `@tailwindcss/postcss` (autoprefixer integrado)
- Design system **intacto**: tokens HSL, temas claro/oscuro/dim, container, keyframes accordion — todo vía `@config` compat
- E2E 16/16 de ayer NO ejecutado tras la migración (pendiente ejecutar E2E sobre v1.1.73 antes de instalar)

### 2.5 CI

`node-version: 20 → 22` (exigencia de Electron 44).

### 2.6 Fixes de tipos tsc (4 errores)

- `Contratos.tsx` — import `FileText` de lucide-react
- `ContabilidadAnalitica.tsx` — clave `investigación` → `investigacion` (keys del Record)
- `CuentasCorrientes.tsx` — destructurar `deleteMovement` del hook
- `Fabricacion.tsx` — añadir `orderNumber` en `addSubcontract`

### 2.7 Higiene del repo

- Renombres de casing (Windows): `rrHH.tsx → RRHH.tsx`, `Tpv.tsx → TPV.tsx` (git index tenía RRHH/TPV)
- `.gitignore`: excluidos `*.exe` y `release/` (los instaladores locales no van al repo)
- `git add -A` accidental de instaladores antiguos revertido (`git rm --cached`)

## 3. Resultado final

```
npm audit: info 0, low 0, moderate 0, high 0, critical 0 — TOTAL 0
```

**190 → 0 vulnerabilidades.** La única crítica runtime real (pdfjs-dist, ejecución de JS al abrir PDF) estaba en un paquete sin uso en código — removida.

## 4. Deuda técnica pendiente (preexistente, no bloqueante)

~30 errores de tipos tsc en archivos no tocados por esta sesión (imports duplicados en Layout.tsx, `plan.full` del pricing viejo en LicenseSettings/PurchaseDialog, `FeatureKey "automatizacion"` no registrado, `PostedRef` sin import en useModuleIntegration, types en useFabricacion/useFlota/useInventario/useAutomatizacion). El build de vite no typechea (esbuild), por lo que la app compila y el E2E 16/16 pasó con ellos presentes. Se documentan para sesión dedicada.

## 5. E2E pendiente sobre 1.1.73

El E2E 16/16 de ayer validó v1.1.72. Esta sesión cambió electron 39→44, router v6→v7 y tailwind 3→4 — **hay que re-ejecutar la suite E2E sobre v1.1.73** (CDP + CF-TRAD + onboarding) antes de instalar en la PC del usuario. La release de GitHub (workflow) se dispara con el push del tag; se hará cuando la suite pase.

## 6. Estado del push al cierre de este informe

Commit ea70ca1 en local, `ahead 1` de origin/main. Push en curso por red lenta (lockfile ~5000 líneas re-resueltas). Si el push de fondo no completa, reintentar con:
```
git -c credential.helper='!gh auth git-credential' push origin main
```

## 7. FODA de la sesión

| | |
|---|---|
| **Fortalezas** | Auditoría completa 190→0 con estrategia por capas (directas, transitivas, overrides); migración tailwind v4 sin tocar design system |
| **Oportunidades** | Deuda de tipos tsc (~30) detectada y delimitada; E2E sobre nueva base electron 44 |
| **Debilidades** | Red lenta: push de ~5000 líneas de lockfile tardó >10 min |
| **Amenazas** | Cambios de mayor de electron+router+tailwind simultáneos — riesgo de regresión funcional que solo el E2E puede detectar |
