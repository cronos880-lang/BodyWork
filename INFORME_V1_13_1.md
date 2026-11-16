# RC Bodywork V1.13.1 — recoloreado y revisión de interacción

## Fallo comunicado y causa comprobada

El usuario informa de que los nuevos logos se ven, pero desaparecen al cambiar de color y, en general, la colocación y los colores funcionan mal en Chrome. En V1.13.0, los 12 logos antiguos se cargaban desde datos incrustados, mientras que los tres emblemas nuevos se añadían mediante rutas a PNG externos.

El recoloreado necesita `getImageData`. Al cargar una imagen desde un origen que no permite leer sus píxeles (restricción habitual de imágenes locales), Canvas se marca como contaminado y lanza `SecurityError`. El error se propagaba desde `logoTinted` a todo el redibujado; una capa podía impedir dibujar otras y daba la impresión de un fallo general. Los datos de la capa se habían modificado antes de fallar el dibujo, lo que explica que interactuar después no recuperase la vista.

Se reprodujo con la V1.13.0 publicada, sirviendo únicamente sus tres emblemas desde un segundo origen sin permiso CORS, con la seguridad normal de Chromium. Añadirlos funcionó; recolorearlos produjo dos errores `getImageData: The canvas has been tainted by cross-origin data`. La misma prueba con la corrección no produjo errores. Esto demuestra la causa de seguridad de origen, pero no es una ejecución en el Chrome del usuario.

El entorno bloquea abrir directamente `file://` con `ERR_BLOCKED_BY_ADMINISTRATOR`. No se ha eludido esa política ni desactivado la seguridad web. Las pruebas HTTP anteriores no detectaron esta diferencia de ejecución: no cubrieron suficientemente el flujo de recolorear los emblemas al abrir el HTML localmente.

## Corrección localizada

- Los tres PNG se incluyen como datos base64 en `rc-graphics.js`, exactamente con los mismos bytes que los originales; la carga del catálogo utiliza esos datos. No necesita leer las rutas externas para dibujar, recolorear o imprimir emblemas.
- `tools/artcraft/build_assets.py` reproduce también esos datos incrustados: reconstrucción comprobada sin diferencias del módulo. Los SVG, PNG e iconos originales no cambian.
- Recoloreado específico de emblemas: color principal en el fondo oscuro y acento en el dibujo rojizo, preservando los bordes plateados y luces. El alfa permanece idéntico. Los logos J.H.Racing siguen por su algoritmo anterior.
- Identificación de aplicación V1.13.1 y `createdWith` de creaciones actualizado. Se mantiene el formato de proyecto `1.13.0-rc-bodywork`, sin migración.

No se modifica el motor de colocación: se revisó con movimientos reales del ratón, tanto después de cambiar colores como después de Fijar y volver a seleccionar. No se atribuyen problemas adicionales a ese motor sin evidencia.

## Revisión y resultados

Los detalles están en `PRUEBAS_V1_13_1.json` y en los tests reproducibles `tests/interaction_v1131.py`, `tests/direct_placement_v1131.py` y `tests/graphics_v1130.py`.

- 75 casos de recoloreado: 15 logos/emblemas × cinco combinaciones, incluidos blanco y negro. Conservación exacta del alfa y contenido visible. En los emblemas, plata y brillos preservados.
- 36 rasters de logos J.H.Racing recoloreados (12 × tres combinaciones), idénticos byte a byte a V1.12.1.
- 14 casos de colocación directa con clic y arrastre sobre la carrocería (sin botón Añadir), seguidos de cambios en ambos colores: tres emblemas, logo anterior, vector, texto y pieza racing, en las dos vistas.
- Alta mediante botones y arrastre real en superior/lateral: emblemas nuevos, logos antiguos normales/blancos/cromados, vectores anteriores/nuevos, texto y piezas racing rasterizadas. Comprobaciones de coordenadas, zoom 2× anclado sobre el recurso y giro de 37°, sin crear duplicados al arrastrar una pieza existente.
- Fijar, volver a seleccionar sobre tinta visible y cambiar de color; composición mixta emblema/vector/texto sin interrumpir el dibujo. Apertura y recuperación de composiciones recoloreadas, y PDF normal/espejo con recorte visible/pieza completa.
- La prueba con orígenes separados verifica también que las operaciones de los emblemas no solicitan PNG externos.
- Se repite la batería de la biblioteca V1.13.0: catálogo, SVG, conservación de los 36 vectoriales y 12 logos, vistas Lola y ocho PDF anteriores. No equivale a volver a probar todos los proyectos personales ni toda la batería histórica.

Las pruebas de arrastre se realizan sobre tinta visible, no suponiendo que el centro del rectángulo de un vector contenga dibujo. Para piezas situadas en los extremos, el zoom se ancla en el recurso: un elemento recortado fuera de la ventana no es una posición válida para el ratón del test. Estos ajustes del test no modifican la geometría de la aplicación.

## Herramientas y límites

Python 3.12 y Playwright/Chromium para reproducción e interacción; Node.js para sintaxis. Se revisaron los CLI ArtCraft existentes: la receta de VectorCraft/PhotoCraft/FigCraft se mantiene y se comprobó su reconstrucción con los emblemas incrustados. No se añaden dependencias, motores ni servicios. REA no dispone de herramientas MCP en esta sesión; Godot y Rust no son necesarios para corregir el origen de imágenes Canvas.

Continúan pendientes Chrome/Edge nativos en el Windows del usuario, impresión física y comprobación de cotas con carrocerías nuevas. No se ha cambiado ni dado por superada esa prueba. Los módulos de calibración, medidas, impresión, distribución, recuperación y capas, los proyectos y las entregas anteriores permanecen sin modificar.

## Instalación y recuperación

COMPLETO: extraer en carpeta nueva. ACTUALIZACION: cerrar el programa y aplicar sobre una copia completa de V1.13.0, sustituyendo los archivos del ZIP con sus rutas. Es imprescindible actualizar conjuntamente HTML y `rc-graphics.js`; no copiar solo el HTML. Abrir el HTML de la nueva copia, conservando juntas carpetas y módulos.

Los proyectos guardados con V1.13.0 pueden abrirse, incluidos los que tienen emblemas ya recoloreados. Guardar con otro nombre, conservar originales y copias externas `.rcbody`. Para volver, usar la instalación y archivos anteriores. No se sobreescriben ZIP publicados ni se modifica `main`.

## Comandos reproducibles

```sh
python tests/interaction_v1131.py --baseline /ruta/a/V1.12.1 --out /ruta/a/resultados/interaccion
python tests/interaction_v1131.py --baseline /ruta/a/V1.12.1 --out /ruta/a/resultados/textos-racing --only-extra
python tests/direct_placement_v1131.py --out /ruta/a/resultados/colocacion
python tests/graphics_v1130.py --baseline /ruta/a/V1.12.1 --out /ruta/a/resultados/regresion
```

Usan Chromium en `/usr/bin/chromium` con perfil temporal y conservan su seguridad de origen; no requieren cambiar flags en el navegador del usuario. Las rutas de resultados deben estar fuera de los proyectos personales.
