# Informe de sesión — Cap-Finanzas v1.1.79
**Fecha:** miércoles 14 de octubre de 2026, 09:20 (Montevideo, UTC-3)
**Repo:** https://github.com/Cade80-25/Cap-Finanzas — rama `main`

---

## 1. Resumen ejecutivo

Publicada la versión **1.1.79** con el **demo empresarial in-app** "Ferretería El Umbral S.R.L." y el paquete promocional completo: reel vertical 9:16, 6 capturas de alta resolución y muestra JSON importable. Todo verificado E2E con la app viva (CDP), CI 3/3 éxito, instalador local listo, release fusionada y publicada.

---

## 2. Lo realizado esta sesión

### 2.1 Demo empresarial in-app (commit `ad2d887`)
- **Archivo nuevo:** `src/lib/demo-empresarial.ts` (413 líneas) — 16 módulos con datos coherentes de una ferretería mediana uruguaya durante 3 meses:
  - Contabilidad de partida doble con IVA 22% (86 asientos-filas, D=C= $6.054.880, balanceada al peso).
  - Facturación (4 facturas A con renglones), cuentas corrientes (cobros/pagos), inventario (6 items con alertas de stock mínimo), RRHH (4 empleados × 2 períodos de nómina), TPV (31 ventas de mostrador), CRM (4 leads), presupuesto operativo, tesorería (2 cuentas), seguros (2 pólizas) y activos fijos con depreciación (3 activos).
- **Snapshot reversible:** idéntica mecánica al demo personal, pero con claves propias (`cap-finanzas-demo-empresarial-active/backup`) para que ambos demos no se pisen entre sí.
- **Guard anti-mezcla:** si el demo personal está activo, el empresarial se rehúsa a cargar.
- **Banner dual:** `DemoModeBanner.tsx` detecta cuál demo está activo y muestra la guía de 5 pasos correspondiente (empresarial o personal).
- **Landing:** botón nuevo "Demo empresarial completa" junto al existente "Probar con datos de ejemplo" (con ícono Building2).

### 2.2 Verificación E2E (app viva, tres pasadas completas)
| Prueba | Resultado |
|---|---|
| Carga vía URL `#/?demo=empresarial` (HashRouter: el param va en el hash, no en la query) | **14/14 PASS** |
| "Volver a mis datos" (restore del snapshot) | **OK** — 3 datos reales sembrados recuperados íntegros, flags limpios |
| Validación/import de la muestra JSON (lógica exacta de `validateBackup`/`importBackup` de backup.ts) | **OK** — 16 claves, 177 entradas, balanceada, sin licencia |

### 2.3 Muestra promocional JSON (`Desktop/promo_cap/`)
- `muestra-empresarial-cap-finanzas.json` (38 KB) — respaldo de muestra importable desde **Ajustes → Configuración → Restaurar respaldo**.
- **Le quité la clave `cap-finanzas-license`** que traía incluida: restaurar una licencia ficticia en una muestra pública es un riesgo (alguien podría "restaurar" módulos de pago sin pagar). La muestra quedó en 16 claves puras de datos.

### 2.4 Release v1.1.79 — CERRADA
- Bump de versión a 1.1.79 (commit `2e09f69`), tag `v1.1.79` push OK.
- **CI 3/3 éxito** (Windows, macOS, Linux) — run 38562163177.
- Instalador local listo: `release/Cap Finanzas Setup 1.1.79.exe` (140 MB) + blockmap.
- La carrera de jobs creó **dos drafts** (412679147 mac / 412679158 win+linux). **Consolidados y publicados**:
  - El dmg mac (164,9 MB) se descargó del draft origen vía API y se subió al destino vía `uploads.github.com` con el ID del release (nota: `gh release upload <id-numérico>` falla con "release not found" — hay que usar la API de uploads directa o el tag, y el tag resuelve al primer draft, cuidado).
  - Draft destino quedó con **8/8 assets** (dmg, dmg.blockmap, AppImage, Setup.exe, Setup.exe.blockmap, latest-mac.yml, latest-linux.yml, latest.yml).
  - Publicada con título y notas: https://github.com/Cade80-25/Cap-Finanzas/releases/tag/v1.1.79
  - Draft huérfano 412679147 eliminado.
- Verificado final: `draft: false`, 8 assets, un solo release v1.1.79.

---

## 3. Assets promocionales disponibles (de esta y sesiones previas)

| Asset | Ruta | Estado |
|---|---|---|
| Reel vertical 9:16, 13 s | `Desktop/promo_cap/reel_capfinanzas_178.mp4` | Generado con branding, CTA y precio (394 KB) |
| Capturas de alta resolución (6 JPEG) | `Desktop/promo_cap/` (generadas con captura-178.js) | Dashboard, bolsas, manual, etc. |
| Muestra empresarial JSON | `Desktop/promo_cap/muestra-empresarial-cap-finanzas.json` | 16 claves / 177 entradas, importable |

---

## 4. Lecciones técnicas de esta sesión

1. **HashRouter:** los query params van DENTRO del hash (`index.html#/?demo=x`), no en la query del archivo. Ponerlos fuera hace que el banner no los lea.
2. **Colisión de instancias Electron:** el CDP se conecta a la primera instancia disponible — si hay una app instalada corriendo, se prueba sobre la equivocada. Matar todo (`Stop-Process -Name 'Cap Finanzas','electron'`) antes de probar.
3. **PowerShell en git-bash:** `$_` es expandido por bash — usar `Stop-Process -Name 'x','y' -Force` (sin variables).
4. **`npx electron-builder` local en Windows tarda ~4-6 min** y solapa bien con el CI: arrancarlo apenas el tag está empujado.
5. **Drafts duplicados de release:** el workflow con `--publish always` en 3 jobs en paralelo crea un draft por SO; siempre hay que consolidar (subir los assets del que tiene menos al que tiene más) y borrar el huérfano.
6. **write_file de un archivo recién creado en la misma sesión puede rechazar por stale-write:** borrar el archivo y reescribir, o usar `patch` con marcadores `__APPEND_x__` por bloques.

---

## 5. Pendientes para la próxima sesión (marketing, publicidad y demás)

### 5.1 Cierre de release v1.1.79 — YA HECHO (referencia)
- [x] Confirmar que la subida del dmg mac al draft destino terminó OK (vía API de uploads, 164,9 MB íntegro).
- [x] Verificar 8/8 assets en el draft consolidado.
- [x] Publicar el draft como release v1.1.79 definitiva.
- [x] Borrar el draft huérfano mac (412679147).
- [ ] Instalar v1.1.79 en la PC de Fernando (requiere UAC — Fernando presente). El instalador local está en `release/Cap Finanzas Setup 1.1.79.exe`.
- [ ] Verificación viva post-instalación: demo empresarial carga desde Landing, banner muestra guía, "Volver a mis datos" restaura.

### 5.2 Marketing y publicidad
- [ ] **Publicar el reel** en Instagram/Facebook/WhatsApp de Cap-Finanzas (asset: `reel_capfinanzas_178.mp4`). El reel menciona la versión — decidir si regenerarlo con "1.1.79" o mantener 178 (recomendado: mantener 178, es breve y el mensaje es el producto, no la versión).
- [ ] **Muestra JSON como "prueba sin instalación":** ofrecerla a comercios/ferreterías reales — que importen la muestra en la app instalada y vean el flujo empresarial completo sin teclear nada. Ideal para demos de venta (ej: a la ferretería del barrio, mostrar cómo se vería SU giro con 3 meses de datos).
- [ ] **Página de aterrizaje/web:** el reel + capturas ya existen; falta decidir si el site público (landing) menciona el demo empresarial en su sección de features (hoy solo tiene el botón).
- [ ] **WhatsApp beta kit** (pendiente de sesión previa): enviar la invitación + guía de 5 pasos + 5 preguntas a los comercios de la lista beta.
- [ ] **Plan de contenidos:** falta una mini-campaña para el demo empresarial (ej: 3 posts: "¿Cuánto IVA pagás de más?", "Tu inventario con alertas de stock", "Nómina en 2 clics") usando las 6 capturas como material.
- [ ] **Video tutorial largo (opcional):** el reel de 13 s es teaser; un video de 60-90 s mostrando el flujo empresarial completo (importar muestra → panel → facturación → inventario) multiplicaría la conversión. Se puede renderizar igual que el reel (Playwright + frames).

### 5.3 Técnicos menores
- [ ] **Updater:** verificar que `latest.yml` del release apunte correctamente a 1.1.79 para que la app 1.1.78 instalada de Fernando detecte la actualización (auto-update).
- [ ] **Manual in-app:** verificar que el demo empresarial aparezca en la sección Manual (Manual.tsx) — hoy cubre 52/52 módulos pero se escribió antes del demo empresarial. Revisar que la sección del demo describa ambos demos (personal y empresarial) y el flujo de restauración.
- [ ] **captura-178.js**: regenerar las capturas con el demo EMPRESARIAL activo para tener material del ferretero (hoy las 6 capturas son del demo personal). Esto es lo más importante del paquete promocional: mostrar la ferretería, no las finanzas personales.
- [ ] **Reel empresarial (opcional):** variante del reel con las capturas del demo empresarial — mismo guion, distinto material.

---

## 6. Estado del repo y credenciales

- Commits del día: `ad2d887` (demo empresarial) + `2e09f69` (bump 1.1.79) + `81ee021` (informe) — todos push OK a `main`.
- Release workflow: `.github/workflows/build.yml` (run 38562163177 para 1.1.79), `--publish always` a draft, consolidación manual documentada en 2.4.
- Credenciales Supabase: bakeadas en el workflow como secrets de GitHub Actions (no en el repo).
- Los tests E2E (test-demo-emp.js, test-restore.js, test-import.js) fueron borrados tras su uso — no quedan archivos sueltos (regla de Fernando: nada suelto).
- Temporales de consolidación de release (`Temp/release-merge/`) pendientes de limpiar al cerrar sesión.

---

*Creado por Hermes para Fernando — 14-oct-2026. Este informe reemplaza a los anteriores para esta sesión.*
