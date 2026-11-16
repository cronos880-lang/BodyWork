# RC Bodywork V1.13.1 · corrección de colores

Código: `092f60643ca1938a9b20f08585f94452adfe05fa`. Corrige el bloqueo al leer píxeles de los emblemas externos y su propagación al redibujado del resto. Los emblemas quedan incrustados en el módulo gráfico; se conservan sus bordes plateados al recolorear. La geometría de colocación no se ha modificado.

## Opción recomendada: COMPLETO

Extraer en una carpeta nueva y abrir `RC_Bodywork_V1_13_1/RC_Bodywork.html` con Chrome, o el BAT de esa carpeta. Cerrar antes la pestaña de la versión anterior. Mantener todas las carpetas y módulos juntos. Conservar versiones y proyectos originales.

## ACTUALIZACION: solo sobre una copia completa de V1.13.0

Cerrar la pestaña del programa, copiar toda la carpeta V1.13.0 y extraer el contenido de ACTUALIZACION dentro de esa copia, sustituyendo los archivos del ZIP con sus rutas. Abrir el HTML de la copia actualizada. No basta con sustituir solo el HTML: `rc-graphics.js` también es imprescindible. No aplicar este parche directamente sobre V1.12.1.

Ambos paquetes contienen los mismos archivos de programa corregidos. Se ha comprobado la actualización sobre el ZIP COMPLETO de V1.13.0 publicado, y los archivos resultantes coinciden con el código actual. No se eliminan fotos ni proyectos personales. Los `.rcbody` V1.13.0 son compatibles; trabajar sobre copias y guardar con otro nombre.

## Comprobaciones y límites

75 combinaciones de recoloreado con alfa idéntico; 36 comparaciones de logos antiguos recoloreados contra V1.12.1; 60 arrastres reales con zoom y giro, y 14 colocaciones directas sobre la carrocería. Logos, emblemas, vectoriales, textos y piezas racing en ambas vistas. Guardado, recuperación y PDF comprobados; ocho PDF históricos siguen idénticos. Los detalles y límites están en `INFORME_V1_13_1.md` y `PRUEBAS_V1_13_1.json`.

El entorno bloquea `file://`; se reprodujo el error con imágenes de otro origen y seguridad normal, sin desactivar protecciones. No es una prueba en el Chrome/Windows del usuario. Continúan pendientes su validación, la impresión física y las cotas en carrocerías nuevas. No se ha alterado ni dado por superada esa prueba. `main` y entregas anteriores siguen intactos.

Los ZIP se han leído y contrastado archivo por archivo; SHA-256 en `SHA256SUMS.txt`.
