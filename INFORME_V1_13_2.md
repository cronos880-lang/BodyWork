# RC Bodywork V1.13.2 — colores de logos y más emblemas

## Petición y estado

El usuario indica que los logos originales no cambian de color y que le gustan los tres emblemas en relieve, solicitando añadir más. Su valoración positiva corresponde a esos emblemas; no se considera una aprobación general del programa ni de las cotas.

Base de desarrollo: V1.13.1, `79fc84dda6c04a393b4217608a277c57b627b763` en `work`. La versión nueva requiere comprobación del usuario en su Chrome. No se han tocado `main`, entregas anteriores ni proyectos personales.

## Fallo reproducido

Con V1.13.1, sin capa seleccionada, se escogieron principal verde y acento azul, se eligió `logo_01` y se añadió a Lateral. La capa guardó `color: #00ff00` y `accent: #0000ff`, pero `logoTintEnabled: false`: el renderer continuó utilizando la imagen original. La miniatura también permanecía idéntica. Es un fallo del flujo visible de preparación de colores, que las pruebas previas de recoloreado directo de capas no cubrieron.

No se afirma haber observado remotamente la secuencia exacta del usuario. Se probaron ahora los controles reales antes y después de colocar, con cada uno de los doce logos originales y los siete emblemas, en ambas vistas.

## Corrección de flujo

- Estado de colores para el siguiente logo: al cambiar un color sin selección, se actualiza la vista previa y se activa el recoloreado al crear la capa. Los colores ya no quedan guardados pero ignorados.
- Las miniaturas utilizan el mismo recoloreado que la capa y se actualizan al editarla. Se dibujan en Canvas a resolución de previsualización, sin PNG externos y sin generar nuevos archivos en el equipo del usuario.
- En Logos y emblemas, Colores y creación aparece antes del catálogo. Al cambiar de categoría, los otros catálogos mantienen el orden anterior. No se mueve el control durante la edición de un color, preservando su foco.
- Estado visible Originales/Personalizados y botones Aplicar colores elegidos y Colores originales del logo. Aplicar funciona también si los valores actuales del selector no han cambiado; restaurar es un paso de deshacer. Las capas bloqueadas quedan protegidas.
- El algoritmo de color de los doce logos no se ha sustituido. Los colores principal y acento se comprueban independientemente para cada logo. Los proyectos anteriores conservan su aspecto y no se recolorean solo por abrirlos.

## Cuatro emblemas nuevos

Turbo · Turbina, Fénix · Alas, Torque · Pistón y Corona · Racing. Se crean desde SVG originales con VectorCraft CLI 0.24.1 a 2× y se terminan con PhotoCraft CLI 0.23.1: bisel interior, recorte por alfa y exportación PNG transparente. No contienen marcas ni imágenes de terceros. Se mantiene el tratamiento de bordes plateados y zonas de color.

Los PNG nuevos están en `assets/emblemas/v1132/` y sus datos se incrustan en `rc-graphics.js`, conservando la corrección de seguridad de origen de V1.13.1. Los tres emblemas aprobados visualmente por el usuario, los 12 logos, los 18 vectoriales añadidos y los iconos anteriores permanecen byte a byte iguales. Fuentes, receta y hashes de los resultados en `tools/artcraft/` y `VERIFICACION_CLI_V1_13_2.json`.

## Compatibilidad

Se siguen leyendo los formatos anteriores. Los proyectos guardados en esta versión usan `1.13.2-rc-bodywork`; V1.13.1 y anteriores rechazan ese identificador, evitando reemplazar un emblema nuevo desconocido. Guardar con otro nombre y conservar originales. Las creaciones `.rcsticker` siguen con formatos 1/2/3 y `createdWith: 1.13.2`; los catálogos antiguos rechazan los identificadores nuevos. No cambia `.rctemplate` ni la calibración.

## Pruebas y herramientas

Resultados en `PRUEBAS_V1_13_2.json`. Python 3.12, Playwright y Chromium/Linux con seguridad de origen normal; Node.js para sintaxis. Se ejecutaron los CLI VectorCraft y PhotoCraft para los recursos, y FigCraft en la receta compartida para reproducir los iconos sin alterarlos. REA no tiene MCP disponible en esta sesión; Godot y Rust no son necesarios para este cambio. Sin nuevos motores, dependencias de ejecución ni servicios de pago.

Las pruebas verifican diferencias de píxeles en miniaturas y capa, no solo valores de campos: colores antes de añadir, después de seleccionar, restauración exacta, deshacer, aplicación explícita y bloqueo. 95 combinaciones de paleta conservan alfa y tinta; ambos canales afectan por separado a los doce logos. Guardado, reapertura, recuperación y PDF se comprueban. La regresión histórica usa el ejemplo público Lola; no reproduce todos los proyectos personales.

Las pruebas de navegador añaden un puente únicamente al HTML en memoria. Los perfiles y resultados intermedios quedan fuera del repositorio. Windows/Chrome nativo, impresión física y cotas de carrocerías nuevas continúan pendientes. No se ha cambiado ni validado esa funcionalidad.

## Instalación y recuperación

COMPLETO: extraer en carpeta nueva, mantener módulos y assets juntos y abrir el HTML de esa carpeta. ACTUALIZACION: aplicar sobre una copia completa de V1.13.1 manteniendo rutas. Cerrar la pestaña anterior y abrir el HTML actualizado. No sustituir solo el HTML. Conservar la instalación anterior, archivos originales y copias externas `.rcbody`.

## Reproducir

```sh
python tests/logos_v1132.py --out /ruta/a/resultados/logos
python tests/logos_v1132.py --out /ruta/a/resultados/controles --quick
python tests/direct_placement_v1131.py --out /ruta/a/resultados/colocacion --all-emblems
python tests/graphics_v1130.py --baseline /ruta/a/V1.12.1 --out /ruta/a/resultados/regresion --project-version 1.13.2-rc-bodywork
```
