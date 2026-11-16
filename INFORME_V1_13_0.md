# RC Bodywork V1.13.0 — biblioteca gráfica

## Estado y base

Nueva versión para evaluación, preparada a partir del programa V1.12.1 y de las instrucciones V2.3.1 en `work` (base `0aacc9c4e5f487b4e8d3697b5a97b88ab33e13d3`). El usuario indica que la versión anterior funciona bien, con la prueba de cotas en carrocerías nuevas pendiente. Esta entrega no constituye su aprobación de V1.13.0 ni de las cotas.

## Cambios

- Módulo de datos `rc-graphics.js`: 18 diseños originales de dos colores, familias Apex, Pulse y Facet. Sus contornos se prepararon y expandieron a trazados con VectorCraft CLI 0.24.1. Cada familia: tres laterales, izquierda/derecha superior y centro.
- `rc-vectors.js`: añade el catálogo nuevo sin modificar las definiciones ni el renderizado anteriores. Total: 54 diseños vectoriales (39 laterales y 15 superiores).
- `RC_Bodywork.html`: búsqueda sin distinguir mayúsculas o tildes, filtro por familia, contador, mensaje sin resultados y limpieza de filtros; miniaturas SVG sin rasterización fija y fondos de inspección transparente/claro/oscuro. Los controles del catálogo no forman parte del diseño ni del PDF. Se añaden tres emblemas procesados y cuatro iconos propios, descritos abajo.
- Cinco combinaciones de dos colores para la capa vectorial seleccionada o el siguiente dibujo. Respeta bloqueo; un paso de deshacer revierte ambos colores. El dibujo anterior no se recolorea automáticamente al abrirlo.
- Proyectos guardados con identificador `1.13.0-rc-bodywork`. Esta versión sigue admitiendo las versiones anteriores. V1.12.1 rechaza el identificador nuevo, evitando que el catálogo desconocido se sustituya silenciosamente. Los `.rcsticker` conservan formatos 1/2/3 y registran `createdWith: 1.13.0`; los diseños nuevos requieren el catálogo nuevo.
- SVG equivalentes distribuidos en `assets/vectoriales/v113/`, instrucciones y pruebas reproducibles en `tests/graphics_v1130.py`.

## Recursos preparados con herramientas externas

- VectorCraft CLI 0.24.1: importación de los 18 originales, trazo de 5 unidades con unión redonda y expansión a trazados cerrados. Los contornos ya son geometría y no requieren filtros ni renderizadores externos en Bodywork.
- Tres emblemas originales con degradados (Apex, Pulse y Facet), rasterizados por VectorCraft a 2× y terminados en PhotoCraft CLI 0.23.1: bisel/relieve interior, recorte transparente y PNG con alfa. Se añaden a Logos y emblemas; los 12 logos del usuario se conservan. No son una simulación de pintura sobre la carrocería ni recuperan los acabados V1.9.0 descartados.
- FigCraft CLI 0.18.1: creación de cuatro iconos vectoriales editables y exportación SVG, usados en las categorías del catálogo.
- Fuentes y recetas en `tools/artcraft/`; paquetes fuera del repositorio, con SHA-256 verificado. `VERIFICACION_CLI_V1_13_0.json` documenta versiones, operaciones y hashes de salida. Son herramientas de preparación, no motores del programa.

## Alcance técnico y herramientas

HTML/CSS y JavaScript nativos en navegador, Canvas 2D/Path2D existentes. Sin nuevas dependencias de ejecución del programa ni cambios de motor; los CLI se usan únicamente en el desarrollo. Python 3.12, Playwright preinstalado y Chromium/Linux para verificar; Node.js para sintaxis. Las versiones efectivas de navegador y resultados están en el JSON.

Tras la petición expresa del usuario se hicieron disponibles y se ejecutaron los tres CLI oficiales. Los lanzadores y la receta permiten reutilizarlos desde este proyecto. La primera ampliación solo nativa se revisó antes de publicar para incorporar resultados reales de esas herramientas. Se mantienen fuera del ZIP los ejecutables y los intermedios nativos: el usuario no necesita instalarlos para abrir Bodywork. Fuentes: [VectorCraft](https://github.com/storytold/vectorcraft), [PhotoCraft](https://github.com/storytold/photocraft), [FigCraft](https://github.com/storytold/figcraft). No se redistribuyen código de motor, marcas ni material gráfico de esos proyectos; los gráficos nuevos son originales de Bodywork.
REA no tiene herramientas MCP efectivas disponibles en esta sesión. Godot se encuentra en PATH, pero no es necesario para esta mejora 2D. Rust/cargo no se encuentran en PATH y no son necesarios. No se incorpora 3D, materiales, IA ni servicios de pago.

## Comprobaciones y límites

El resumen verificable está en `PRUEBAS_V1_13_0.json`. Las pruebas instrumentan temporalmente el HTML en memoria del navegador; el programa distribuido no contiene el puente de pruebas. Las imágenes, PDF y capturas de verificación se guardan fuera del repositorio y no se empaquetan.

Se comparan los 36 recursos vectoriales anteriores, las vistas del ejemplo público Lola y sus ocho PDF: visible/completo × por vistas/optimizado × normal/espejo. Esto no equivale a repetir toda la batería histórica con todos los proyectos personales. Las pruebas de filtros, fondos, paletas, bloqueo, deshacer, apertura, creaciones y recuperación cubren los flujos nuevos. La comprobación de los SVG detectó un recorte en Pulse lateral 3: se amplió únicamente su lienzo antes de repetir las pruebas. El test de reapertura se ajustó para comparar objetos y no el orden de las claves JSON.

No se modifican los módulos de calibración, medidas, editor de milímetros, impresión, distribución, recuperación, texto o capas. No se han realizado ajustes de cotas ni una nueva calibración de otra carrocería. Windows/Edge nativo, impresión física, fidelidad material del color y prueba de cotas en carrocerías nuevas quedan pendientes del usuario. El efecto del catálogo no cambia la escala plana ni corrige perspectiva o superficies curvas.

## Instalación y recuperación

Se entrega COMPLETO, con una carpeta propia `RC_Bodywork_V1_13_0/`. Extraer en una ubicación nueva y abrir el HTML/BAT de esa carpeta, manteniendo juntos módulos y assets. Conservar la versión anterior y los archivos originales; trabajar sobre copias y guardar con otro nombre. No se ofrece parche sobre la instalación que funciona, para facilitar la comparación y vuelta atrás.

Para volver: abrir V1.12.1 y sus proyectos originales. Los nuevos `.rcbody` no son compatibles hacia atrás. Las copias automáticas dependen del navegador/perfil/origen; conservar siempre `.rcbody` externos. Las entregas anteriores y `main` permanecen sin modificar. El ZIP nuevo no contiene ZIP anteriores ni datos personales nuevos.

## Reproducir

Con Python 3.12, Playwright y Chromium ya disponibles:

```sh
python tests/graphics_v1130.py --baseline /ruta/a/V1.12.1 --out /ruta/a/resultados
```

El script usa `/usr/bin/chromium`, crea un perfil temporal y escribe resultados solo en la ruta `--out`. La base puede obtenerse en una carpeta aparte mediante un archivo Git del commit base. No ejecutar contra perfiles de navegador personales.
