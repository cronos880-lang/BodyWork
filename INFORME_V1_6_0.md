# RC Bodywork V1.6.0 — primera etapa de recursos SVG y capas

## Entrega

Se conserva la V1.5.0 y la V1.4.8. Se trabaja en una carpeta nueva. No se alteran los recursos raster antiguos, el motor `rc-print.js`, las fotografías ni los proyectos de regresión. El BAT original continúa abriendo el HTML de su carpeta. La aplicación sigue siendo local y gratuita.

Se añaden `rc-vectors.js` y `rc-layers.js`, nueve SVG en `assets/vectoriales/`, un panel de capas y documentación. Título, cabecera y formato de proyecto se identifican como V1.6.0.

## Recursos vectoriales

Primera colección nueva de nueve diseños originales de dos colores: Aero, Prisma y Onda laterales; Lanza y Flujo superiores con izquierda/derecha; Centro punta y Centro doble V. Los mismos trazados SVG alimentan el catálogo, el render Canvas y la preparación de impresión. No contienen píxeles de fotografías, sombras o reflejos incrustados. Los colores principales y de acento se editan con los controles existentes.

Se admiten tamaño, escalado X/Y, rotación, recortes y borrados no destructivos. La selección en el lienzo comprueba la tinta de los trazados, incluyendo recortes, en lugar de tratar todo su rectángulo como pegatina.

El cambio es progresivo: los diseños históricos mantienen su representación y se ofrecen los nuevos como alternativas explícitas. No se intenta vectorizar automáticamente una fotografía ni afirmar equivalencia visual con todos los catálogos previos. Los SVG fuente se incluyen para edición externa. La salida PDF conserva el motor rasterizado sin pérdidas a 304,8 ppp y la calibración de V1.5.0; no se anuncia PDF vectorial nativo.

## Panel de capas

Muestra todas las capas de la vista activa, en orden del frente al fondo, independientemente de su categoría. Permite nombres, selección múltiple, subir/bajar, frente/fondo, duplicación independiente, ocultación, bloqueo, agrupación y separación. Las operaciones se incorporan al historial de deshacer existente.

Los grupos conservan la posición relativa de sus miembros al arrastrarlos y se limitan al borde con una traslación común, sin deformarse. Un bloqueo en cualquier miembro impide mover parcialmente el grupo. La duplicación crea IDs y grupos nuevos, con copia independiente de campos anidados y un pequeño desplazamiento común.

La agrupación permite movimiento y operaciones por selección. Los ajustes de escala, rotación y color siguen actuando sobre la capa activa; se comunica en la interfaz. Esta etapa no implementa grupos anidados ni transformaciones de escala/rotación del grupo completo.

Las capas ocultas se conservan en el proyecto y quedan excluidas del render, la selección y el PDF. Las bloqueadas siguen visibles e imprimibles; se protegen frente a edición, recorte, arrastre, reordenación, duplicación y eliminación. Sus nombres y visibilidad siguen siendo accesibles. Si todas están ocultas, la impresión informa de que no hay capas visibles, sin generar un PDF engañoso.

Persisten `layerName`, `visible`, `locked`, `groupId` y `groupName` cuando existen. No se inyectan estos campos en los proyectos históricos sin necesidad. Se mantiene el orden de su array como orden de dibujo. Se protege el límite de 100 capas por vista al añadir o duplicar para evitar pérdidas al reabrir.

## Validación realizada

- Cuatro proyectos históricos: 16 PDF normal/espejo y visible/completo, más el caso de limpieza opcional. Mismos recuentos que V1.5.0: 5/6, 6/6, 5/5 y 3/3 hojas según el criterio de contenido. No son cuotas codificadas.
- Reconstrucción de ventanas desde las imágenes PDF: toda la tinta preparada queda cubierta, igualdad exacta en los solapes, A4 y límites correctos; no se divide una composición que cabe. Comparación de canales tras componer alfa sobre blanco con tolerancia máxima de un nivel.
- Ocho PNG de los cuatro casos, comparados con V1.5.0: píxeles idénticos. La adición del panel no modifica los dibujos antiguos ni sus exportaciones.
- UI real: añadir desde Vectoriales limpios, cambiar nombre, duplicar, reordenar y deshacer; agrupación mediante diálogo; arrastre conjunto con ratón, conservación de offsets y deshacer; grupo con un miembro bloqueado sin movimiento parcial; ocultación/bloqueo por selección y por fila.
- Persistencia: guardar/reabrir proyecto vectorial y proyecto con nombres, grupos, ocultación y bloqueos. Se conservan estrictamente los datos serializados tras normalizarlos con el lector del proyecto. Los cuatro casos de entrada conservan sus campos originales.
- SVG/Canvas: comparación de los nueve diseños con las mismas rutas y colores, permitiendo diferencias de antialias de los rasterizadores y redondeo de tamaño; cinco diseños coinciden exactamente en el tamaño de prueba. Se comprueban las regiones interiores con dos colores planos y sin efectos fotográficos; las pequeñas mezclas de color en bordes superpuestos son antialias, no reflejos.
- Exportación de una composición con las nueve piezas: PDF normal y espejo generados. Pieza superior oculta: cinco piezas preparadas en lugar de seis. Proyecto totalmente oculto: bloqueo explícito del PDF vacío. La comprobación de estos últimos estados no altera los originales.
- Pruebas puras de capas: 800 combinaciones de reordenación, estabilidad del orden relativo, duplicados sin alias de datos anidados, grupos nuevos, nombres acotados, protección de bloqueos y ausencia de mutación del array de entrada.
- Guardado: cancelación sin cambios, selector denegado con alternativa de descarga y fallo de escritura con aborto y nombre elegido conservado.
- Sintaxis comprobada con Node para el script principal y módulos nuevos. Sin errores JavaScript inesperados en las pruebas de navegador.

Comandos, desde la raíz del repositorio:

```sh
node tests_v160/layers.test.cjs
python tests_v160/features.py
python tests_v160/regression.py
python tests_v160/png_and_save.py
node --check RC_Bodywork_V1_6_0/rc-vectors.js
node --check RC_Bodywork_V1_6_0/rc-layers.js
```

Se extrajo también el script principal a `/tmp/rc160.js` y se ejecutó `node --check`. La instrumentación de pruebas existe únicamente en la copia servida en memoria; no se distribuye en el HTML. Los resultados y las capturas se conservan en `informes_v160/`; no se publican proyectos ni PDF personales dentro del programa.

## Pendiente / límites

Se ha probado en Chromium/Linux con recursos locales interceptados, sin servicios externos. La política de este entorno impide abrir directamente file://, por lo que sigue pendiente el doble clic del BAT y el selector real de Windows/Edge. Las ramas del selector se simulan, mientras que los PDF y descargas de prueba sí son reales.

No hay impresora disponible: faltan comprobación física de regla de 100 mm, solapes, calibración de fotos, color y soporte adhesivo. La resolución raster original sigue limitando las piezas históricas; la colección SVG nueva elimina esa fuente de imperfecciones para sus nueve diseños, sin convertir el resto del catálogo. La versión es una candidata validada por software, pendiente de aceptación física.
