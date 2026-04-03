## Plan: Mejoras al sistema de transacciones inspirado en Personal Finances

### Fase 1: Calculadora Precio × Cantidad
- Modificar el formulario de transacciones para incluir campos: **Precio**, **Cantidad** (default 1), **Suma** (calculada automáticamente)
- La suma se calcula como `Precio × Cantidad` y se usa como el monto final (debit/credit)
- Actualizar el tipo `JournalTransaction` para incluir `price`, `quantity` opcionales

### Fase 2: Sistema de Categorías Editables con Subcategorías
- Crear un hook `useCategories` que guarde categorías personalizadas en localStorage (por perfil/wallet)
- Cada categoría puede tener subcategorías anidadas (1 nivel)
- Incluir operaciones CRUD: crear, renombrar, eliminar categorías y subcategorías
- Agregar un set base amplio predefinido (alimentación, transporte, vivienda, servicios, salud, etc.)
- Crear un componente `CategorySelector` con diálogo de selección similar al de Personal Finances
- Actualizar la página de Categorías para permitir gestión completa

### Fase 3: Campos Adicionales en Transacciones
- Agregar campos opcionales: **Acreedor/Pagador**, **Notas/Anotaciones**
- Actualizar `JournalTransaction` type con estos campos
- Mostrar opción "Mostrar/Ocultar campos" para no sobrecargar la interfaz por defecto

### Fase 4: Vista Principal Mejorada
- Mejorar la vista de transacciones con agrupación por Ingresos/Gastos
- Mostrar subtotales por grupo (total ingresos, total gastos)
- Columnas visibles: Descripción, Precio, Cantidad, Suma, Fecha, Categoría, Notas

### Orden de implementación
1. Fase 1 + Fase 3 (formulario mejorado)
2. Fase 2 (categorías)
3. Fase 4 (vista)

¿Te parece bien este plan?
