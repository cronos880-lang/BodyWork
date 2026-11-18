# CLI gráficos disponibles para el desarrollo de RC Bodywork

Instalación comprobada en Codex Linux x86_64 el 16/11/2026. No es una instalación en el Windows del usuario ni una conexión MCP automática.

| Herramienta | Versión fijada | Uso ejecutado en V1.13.0 |
|---|---|---|
| VectorCraft | 0.24.1 | Importar 18 SVG originales, crear y expandir contornos a geometría vectorial; renderizar tres emblemas con degradados a 2× |
| PhotoCraft | 0.23.1 | Bisel/relieve, recorte del lienzo por alfa y exportación PNG transparente de los tres emblemas |
| FigCraft | 0.18.1 | Crear cuatro iconos como vectores editables, guardar `.figcraft` y exportar SVG para los botones de categorías |

Los paquetes oficiales están en `/workspace/work/artcraft-cli/`, fuera de Git y del ZIP del programa. No se ha cambiado el PATH global de la cuenta. Se verificaron sus SHA-256 contra los metadatos de las releases oficiales antes de extraerlos; los valores están fijados en `install_cli.py`. No se necesitan Rust/cargo para utilizar estos binarios.

```sh
python tools/artcraft/cli.py vectorcraft --version
python tools/artcraft/cli.py photocraft --version
python tools/artcraft/cli.py figcraft --version
python tools/artcraft/cli.py vectorcraft --help
```

El lanzador transmite argumentos y código de salida, y conserva la configuración de estas herramientas en el espacio de trabajo. `BWORK_ARTCRAFT_HOME` permite seleccionar otra ubicación con los mismos paquetes. Si una futura sesión utiliza otra máquina, reinstalar allí con `python tools/artcraft/install_cli.py`; el script comprueba la plataforma y las descargas antes de extraer. No afirmar disponibilidad en otra máquina sin ejecutar una comprobación. En Windows hay que utilizar los binarios oficiales de Windows y validar su comportamiento por separado; estos lanzadores no instalan nada en ese equipo.

## Construcción reproducible de los recursos

```sh
python tools/artcraft/build_assets.py
```

Esta operación de desarrollo actualiza recursos de V1.13.0 y `rc-graphics.js`; no ejecutarla durante una auditoría de lectura. Trabaja exclusivamente con las fuentes originales de esta carpeta, no con fotos, proyectos personales ni gráficos anteriores. Los intermedios nativos `.vectorcraft`, `.pcraft` y `.figcraft` y el registro completo quedan en `../work/artcraft-cli/build/`. El resumen publicado y los hashes de los recursos están en `VERIFICACION_CLI_V1_13_0.json`.

Los motores de estas herramientas no se integran en el programa: Bodywork consume sus SVG/PNG ya preparados, sin conexión ni instalación adicional. Los recursos originales nuevos no incluyen marcas o imágenes de ArtCraft. Los binarios conservan sus licencias originales y no se redistribuyen en el ZIP de Bodywork.

Fuentes oficiales: [VectorCraft](https://github.com/storytold/vectorcraft/releases/tag/v0.24.1), [PhotoCraft](https://github.com/storytold/photocraft/releases/tag/v0.23.1), [FigCraft](https://github.com/storytold/figcraft/releases/tag/v0.18.1).

## Corrección V1.13.1

La receta incrusta los PNG de emblemas en `rc-graphics.js` además de conservar los archivos originales: Canvas puede leer y recolorear sus píxeles al abrir el HTML localmente sin depender del origen de archivos externos. Es imprescindible conservar esa incrustación al reconstruir.

## V1.13.2

La receta añade cuatro emblemas originales (Turbo, Fénix, Torque y Corona) en `assets/emblemas/v1132/`, conserva los tres anteriores y vuelve a incrustar los siete PNG. `VERIFICACION_CLI_V1_13_2.json` recoge las operaciones y hashes de los 29 recursos producidos (18 SVG, siete PNG y cuatro iconos).

## V1.13.3

Para reconstruir solo Pantera, Chicane y Meta, usa `python tools/artcraft/build_approved_badges.py` con PhotoCraft 0.23.1 y Pillow 12.3.0 en el entorno de desarrollo. La receta parte de los tres PNG transparentes de `sources/v1133/`, ajusta el alfa y los incrusta en el catálogo para su uso sin conexión.
