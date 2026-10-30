# RC Bodywork V1.5.0

## Defecto confirmado y corrección general

V1.4.9 conservaba un lienzo lateral fijo de 450 mm y lo dividía aunque la tinta real cupiera en A4. Un diseño compacto de 280,7 × 100,3 mm terminaba con el logo partido y cuatro hojas laterales. La prueba anterior de solapes exactos no detectaba este defecto: una unión puede ser correcta y seguir siendo innecesaria.

Ahora todas las composiciones usan el mismo planificador, sin nombres ni IDs de proyectos: mide la envolvente de tinta, conserva la escala y las posiciones relativas de las capas, evalúa un giro de 90° y divide únicamente cuando la composición no cabe en los 283 × 196 mm útiles de un A4 horizontal. La referencia física de la foto deja de decidir el tamaño del lienzo de impresión.

Los solapes son siempre de 20 mm en coordenadas enteras de impresión (240 píxeles a 12 píxeles/mm). El planificador prefiere zonas vacías o con menos tinta para la unión; si un dibujo mayor que A4 atraviesa toda el área, puede necesitar una unión con tinta. No promete evitar toda división físicamente necesaria. Conserva cada lateral como un conjunto: no mueve logos o franjas por separado para hacerlos caber.

Se admiten varias filas y columnas y superiores grandes divididos a escala real. No se producen páginas de ventanas sin tinta ni se reduce silenciosamente para encajar. Las uniones tienen marcas, fila/columna, posición y giro. Se mantiene A4 297 × 210 mm, regla de 100 mm, RGB sin pérdidas y 304,8 ppp. Un límite de memoria de 40 millones de píxeles protege las composiciones laterales completas extremas; se comunica el bloqueo sin alterar su escala.

## Vista previa y fragmentos

La vista previa usa exactamente la misma preparación y codificación que la exportación. Muestra todas las hojas y permite ampliarlas antes de guardar.

Los restos oscuros y algunos reflejos superiores del ejemplo ya estaban en las imágenes y eran visibles en el editor. No procedían del corte del logo. No se pueden eliminar todos suponiendo que cada parte aislada sea basura: podría ser una letra, detalle o color intencionado.

Se añade una limpieza **opcional y no destructiva**, desactivada por defecto: componentes de tinta conectados en 8 direcciones con área menor que 0,5 / 2 / 5 mm². La misma regla sirve para cualquier diseño o color. No cambia el archivo de proyecto ni el recurso; la vista previa informa del número retirado. Hay una advertencia explícita porque también puede quitar detalles pequeños legítimos. No reconstruye arte vectorial ni elimina reflejos que estén conectados a una región principal.

## Evidencia de regresión

Cuatro proyectos reales, normal/espejo y visible/completo: 16 PDF. Un PDF adicional ejerce la limpieza opcional. Los tres casos anteriores conservan los recuentos de V1.4.9 (6/6, 5/6 y 5/5 según visible/completo). El nuevo pasa de 5 a 3 hojas en ambos criterios: una superior y un lateral completo por cada lado. Los recuentos son resultados observados, no reglas codificadas.

Las pruebas descomprimen las imágenes del PDF y comparan los rectángulos superiores preparados y las ventanas laterales con su tinta de origen. Se verifica cobertura de toda la tinta, escala, límites de página, igualdad exacta en solapes y ausencia de división de composiciones que caben enteras. La comparación RGB permite como máximo 1 nivel de canal por la operación de composición alfa sobre blanco; no se permite pérdida de regiones. Los tres proyectos antiguos y el nuevo conservan todos sus campos al abrir/guardar/reabrir.

Se prueban además 40 composiciones generadas: cobertura, márgenes, solape entero de 20 mm, cero ventanas vacías, preferencia por uniones entre figuras separadas y paginación bidimensional. Una prueba metamórfica exige que el mismo dibujo dentro de un lienzo transparente mayor produzca exactamente el mismo plan: detecta directamente la dependencia incorrecta del lienzo de 450 mm.

Se exportan también dos composiciones sintéticas de 350 × 350 mm, una superior y otra lateral, en cuatro hojas cada una; se reconstruye toda la tinta y se verifica que ninguna marca o regla se dibuja sobre ella.

La limpieza se comprueba con componentes de área conocida, contacto diagonal y verificación de que el recurso original permanece idéntico. En el proyecto nuevo, la opción de 5 mm² retira cuatro fragmentos; esto no significa que todos los restos de una fotografía sean pequeños o independientes.

Ocho PNG (cuatro proyectos × dos vistas) son idénticos píxel a píxel a V1.4.9. Se prueban cancelación sin cambios, selector denegado con descarga alternativa y fallo de escritura con aborto y conservación del nombre elegido. Se repiten las 24 posiciones/tamaños/rotaciones de roof_prisms; los diseños altos pueden girarse si caben y dividirse cuando es necesario, en lugar de rechazarse por un límite de altura total de 196 mm.

Scripts y evidencias se conservan en el entorno de trabajo en `tests_v150/` e `informes_v150/`. Los proyectos/PDF privados no se incluyen en el programa ni se suben al repositorio. Los paquetes descargables contienen solo la aplicación, recursos, documentación y cambios.

```sh
python tests_v150/regression.py
python tests_v150/properties.py
python tests_v150/png_and_save.py
python tests_v150/roof.py
python tests_v150/poster.py
node --check RC_Bodywork_V1_5_0/rc-print.js
```

También se comprueba con Node la sintaxis del script principal extraído a un archivo temporal. La instrumentación de pruebas solo existe en memoria en el navegador de pruebas; no se distribuye en el HTML.

## Límites de la validación

Software validado en Chromium/Linux. La política del entorno no permite navegar directamente al archivo file://; los recursos locales se sirven por interceptación sin acceso a servicios externos. El BAT original permanece sin cambios, pero faltan pruebas manuales reales en Windows/Edge y en impresora: regla de 100 mm, solape, calibración física, color y adhesivo interior. Tampoco se certifica cada interacción manual de todos los catálogos; el editor se conserva y se verifica por datos y PNG.

La calibración sigue siendo la de las fotos Lola VIP conocidas. Un algoritmo general de composición no convierte cualquier fotografía en una referencia física calibrada. El detalle raster y las imperfecciones de sus recursos siguen limitando la calidad del arte original. La versión es una candidata comprobada por software; no una certificación física de impresión.
