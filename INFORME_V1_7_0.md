# RC Bodywork V1.7.0

## Cambios solicitados

La barra de capas conserva Al frente, Al fondo, Duplicar, Agrupar, Separar y Eliminar. Se retiran sus seis controles redundantes indicados por el usuario: Subir, Bajar, Ocultar, Mostrar, Bloquear y Desbloquear. Las filas mantienen visibilidad y bloqueo. Se incorporan Guardar pegatina y Cargar pegatina, dejando ocho botones en dos filas.

Se añade un formato independiente `.rcsticker` para guardar una o varias capas de una vista como creación reutilizable. El formato incluye geometría relativa, colores, estilos, texto, recortes/borrados, orden y propiedades de capa. No contiene las fotos ni el proyecto. Los recursos se referencian por sus IDs de catálogo; una versión sin esos recursos muestra un error en lugar de sustituirlos silenciosamente.

La creación se importa centrada, conservando los tamaños y los desplazamientos relativos, con nuevos IDs y un grupo nuevo para varias capas. No pisa capas existentes ni reutiliza los IDs o grupos del proyecto de origen. Se comprueba el tamaño de referencia de la fotografía: la aplicación evita cambiar la escala de una creación al llevarla a una referencia incompatible. La vista Superior/Lateral se elige a partir del archivo. Deshacer restaura tanto los datos como la vista anterior.

Se comparte la normalización de capas entre Abrir proyecto y Cargar pegatina: se extrajo sin cambiar sus reglas originales. Se admiten proyectos hasta V1.7.0. La carga de creaciones se valida antes de modificar el documento: formato, recursos, geometría, colores, recortes, estados, máximo de 100 capas y referencia. Se aplica un límite de 5 MB y el límite de 100 capas total por vista. No se carga parcialmente un archivo rechazado.

## Colores: causa y corrección

En V1.6.0 la miniatura SVG se pintaba siempre con morado y negro. Los cambios de color sin capa seleccionada no la actualizaban; por ello no mostraba el color elegido antes de añadir. La recoloración de una pieza ya colocada funcionaba al seleccionarla y desbloquearla.

Ahora las miniaturas usan los colores de los selectores y se regeneran al cambiarlos. Sin capa seleccionada, preparan la próxima pieza; con una capa seleccionada modifican esa capa. Una explicación contextual indica qué se está modificando y avisa si está bloqueada. Se verifica el cambio de ambos colores antes de añadir y después de colocar la pieza.

Los nueve SVG limpios se mantienen sin alteración. Piezas racing es el catálogo histórico mixto, con vectores y recortes fotográficos; no se identifica todo ese catálogo como imagen raster. Se conservan los recursos anteriores y el motor PDF.

## Pruebas realizadas

- Menú: ocho etiquetas y acciones exactas. Cargar pegatina funciona sin selección activa y abre el selector correspondiente. Los controles de fila siguen presentes.
- Color: miniatura actualizada al elegir colores sin modificar capas existentes; nueva pieza con los colores elegidos; pieza activa recoloreada; bloqueo explicado y edición recuperada al desbloquear la fila.
- Grupo mixto con vector, logo y pieza del catálogo: guardar archivo real, cargarlo en otro proyecto mediante el selector, conservar campos y diferencias X/Y, importar dos veces sin colisiones, deshacer la segunda importación.
- El JSON `.rcsticker` no contiene fotografías ni datos de proyecto. Exportar la creación no modifica ni marca como guardado el proyecto abierto.
- Carga de una creación Superior desde la vista Lateral y deshacer con restauración de vista y datos.
- Rechazo de JSON inválido y referencia de foto incompatible, sin cambios parciales en el proyecto.
- Guardado nativo simulado, cancelación, denegación del selector y fallo de escritura con aborto y descarga alternativa usando el nombre elegido. Las descargas son reales; los fallos del selector se simulan.
- Guardar/reabrir el proyecto que contiene la creación importada y exportar PDF normal/espejo.
- Cuatro proyectos de regresión: 16 PDF normal/espejo y visible/completo, más limpieza opcional; A4, tinta cubierta, escala, colores, límites y continuidad de solapes comprobados como en V1.6.0. Recuentos observados iguales: 5/6, 6/6, 5/5 y 3/3 según el criterio de contenido.
- Ocho PNG de esos proyectos: píxeles idénticos a V1.6.0. Campos originales conservados y reapertura de proyectos sin cambios.
- Pruebas puras del formato reutilizable: preservación de geometría y campos, orden, nuevas identidades, independencia de datos anidados, archivo sin fotos, referencias y archivos malformados.
- Pruebas puras de capas: 800 combinaciones de ordenación y los casos de duplicación, bloqueo, grupos, nombres y eliminación.
- Sintaxis del script principal y módulos comprobada con Node. Sin errores JavaScript inesperados durante las pruebas exitosas de navegador.

```sh
node tests_v170/creations.test.cjs
node tests_v170/layers.test.cjs
python tests_v170/features.py
python tests_v170/regression.py
python tests_v170/png_and_save.py
node --check RC_Bodywork_V1_7_0/rc-stickers.js
node --check RC_Bodywork_V1_7_0/rc-layers.js
```

También se comprobó el script principal extraído a `/tmp/rc170.js`. Los tests instrumentan exclusivamente el HTML servido en memoria. Evidencias y archivos de prueba se conservan en `informes_v170/` y no se instalan ni publican con los paquetes del programa.

## Límites

Una creación contiene capas de una sola vista y depende de los recursos incluidos en el catálogo del programa. No es un SVG o PNG independiente de la aplicación. Para impresión se utiliza el PDF calibrado del proyecto donde se carga. La geometría se mantiene con la misma referencia de foto; la igualdad de dimensiones en píxeles no calibra una fotografía distinta.

Se mantiene el motor PDF rasterizado a 304,8 ppp; los SVG fuente permanecen vectoriales. No se sustituyen las pegatinas históricas ni se reconstruyen las partes fotográficas de sus recursos.

Validación de software en Chromium/Linux con recursos locales interceptados, sin servicios externos. La política de este entorno bloquea la navegación directa a file://. Siguen pendientes el BAT/selector real de Windows/Edge, la impresión física, el control de 100 mm, el montaje de solapes y la comprobación de color/soporte adhesivo. Las versiones anteriores y los originales se conservan como resguardo.
