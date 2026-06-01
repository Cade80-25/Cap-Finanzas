# Cap Finanzas v1.2.0

Fecha: 1 de junio de 2026

Esta versión empaqueta una ola grande de mejoras: SEO + visibilidad en buscadores con IA, nuevo flujo de pago/checkout, retención de usuarios, endurecimiento de seguridad y una **calculadora completa** (+, −, ×, ÷) dentro de Transacciones y el Libro Diario.

---

## 🔎 SEO y búsqueda con IA

- **`llms.txt` ampliado**: incluido el índice de páginas, características clave, modelo de negocio y los nuevos artículos para que los crawlers de IA (ChatGPT, Perplexity, Claude, Gemini) entiendan el producto.
- **Sitemap actualizado** con `/comparativa`, `/aprender/articulos/:slug` y las páginas principales.
- **FAQ con datos estructurados (`FAQPage` JSON-LD)** en la landing → mejora rich results en Google.
- **Nueva sección de artículos** en `/aprender` con 3 piezas optimizadas:
  - Cómo llevar contabilidad personal sin Excel
  - Partida doble explicada simple
  - Diferencia entre finanzas personales y contabilidad
- **`/comparativa`** vs Fintonic, Mobills, Monefy y Excel (página optimizada para keywords de comparación).
- **Open Graph y metadatos** revisados en todas las páginas nuevas vía `SeoHead`.

## 💳 Pagos y checkout

- **Nueva página `/checkout-success`** con confirmación clara post-pago, instrucciones para revisar email y link directo a `/instalar`.
- **Función `resend-license-by-email`**: el usuario puede reenviar su licencia por email si la perdió, sin escribir a soporte.
- **`PaymentTestModeBanner`** afinado para distinguir entornos de prueba y producción de PayPal.
- **`PurchaseDialog`** consolidado: copy más claro, ofertas y prueba gratuita visibles.

## 🛡️ Seguridad

- **`purchase-status` endurecido**: validación estricta de email con regex (sin wildcards LIKE) y `eq` case-insensitive en lugar de `ilike` → cierra una vulnerabilidad de inyección de wildcards.
- **`SECURITY DEFINER` con `search_path` fijo** en wrappers de `pgmq` (`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`) y `update_updated_at_column` → previene SQL injection vía search_path.
- **EXECUTE revocado** de `PUBLIC`, `anon` y `authenticated` en esas funciones; solo `service_role` puede invocarlas.
- **Storage policies endurecidas** en `profile-photos` y `email-assets`: solo lectura directa por nombre exacto, sin listado de bucket.
- Memoria de seguridad documentada en `.lovable/security-memory.md` con reglas "must-never-happen" y trade-offs aceptados.

## ❤️ Retención y atracción

- **Modo Demo**: nuevo `DemoModeBanner` + `src/lib/demo-data.ts` para que un visitante pruebe la app con datos reales sin registrarse.
- **Instalación PWA**: nuevo `PWAInstallButton` que detecta `beforeinstallprompt` y guía a instalar como app.
- **Recordatorio de fin de trial**: `useTrialExpiryReminder` avisa cuando quedan pocos días de prueba.
- **Onboarding y tutoriales** revisados para reducir fricción inicial.

## 🧮 Calculadora completa en Transacciones y Libro Diario (NUEVO)

Reemplazada la antigua "calculadora de Precio × Cantidad" por una **calculadora de 4 funciones** completa:

- Operaciones: suma (+), resta (−), multiplicación (×), división (÷).
- Funciones adicionales: porcentaje (%), cambio de signo (±), borrar dígito y limpiar total (C).
- **Soporte de teclado**: dígitos, `.`, `+`, `-`, `*`/`x`, `/`, `Enter`/`=`, `Backspace`, `Esc`, `%`.
- **Display con expresión en curso** (ej.: `120 + 35 × 2`) y resultado en vivo.
- **Botón "Aplicar"** que carga el resultado directamente en:
  - el campo Importe (modo Simple), o
  - Debe / Haber (Libro Diario tradicional), según corresponda.
- Componente reutilizable `FullCalculator` en `src/components/FullCalculator.tsx`.

## 🐛 Otros

- Pequeños ajustes de copy en landing, FAQ y comparativa.
- Mejoras menores en `Aprender` y navegación entre artículos.

---

## Cómo actualizar

- **Web / PWA**: se actualiza sola al recargar.
- **Escritorio (Windows)**: el auto-updater toma el nuevo instalador automáticamente, o podés descargar manualmente desde [https://capfinanzas.com/instalar](https://capfinanzas.com/instalar).

## Compatibilidad

- Tus datos locales se mantienen intactos (offline-first sigue siendo el modelo de almacenamiento).
- No hay migraciones que requieran acción del usuario.
