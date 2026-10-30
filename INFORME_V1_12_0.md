# RC Bodywork V1.12.0 — calibración y plantillas

## Resultado y alcance

Se añade un asistente de calibración de fotografías para otras carrocerías, con escala independiente por vista y por eje. Se integra en los controles de milímetros, el renderer de impresión, el historial, los proyectos, la recuperación y las creaciones reutilizables. Se parte de V1.11.0, sin rehacer la aplicación ni incorporar la simulación V1.9.0 descartada.

No se entrega una nueva carrocería físicamente calibrada: el usuario debe aportar fotografías y medidas, y verificar el ajuste sobre su modelo. Las fotografías sintéticas usadas en las pruebas son patrones de software y no se distribuyen como plantillas reales.

## Asistente y uso

El botón **Calibración y plantillas** aparece sobre las fotografías. Permite:

1. Seleccionar Superior o Lateral e importar una fotografía.
2. Arrastrar un rectángulo entre referencias conocidas, afinar sus cuatro límites en píxeles y escribir las dos distancias reales en mm, con coma o punto decimal.
3. Aplicar la calibración a esa vista. Las otras vistas mantienen su propia calibración.
4. Descargar una hoja A4 de comprobación y anotar una comprobación física realizada por el usuario.
5. Guardar/cargar una plantilla de fotografías y escala.

Cerrar un borrador no aplica sus cambios. Importar una fotografía sí sustituye esa vista. Aplicar cambia la escala de todas las capas existentes de la foto, sin cambiar sus colores, orden o recortes. La calibración es un paso de deshacer. Los límites inválidos no se sustituyen silenciosamente por el marco anterior al aplicar.

El origen de los campos X/Y es la esquina superior izquierda del rectángulo de referencia. Guías y botones de alineación utilizan ese rectángulo; no afirman detectar los extremos reales de la carrocería. Una referencia puede estar dentro de la fotografía: sirve para obtener escala y origen, sin recortar las pegatinas situadas fuera de ella. El recorte visible sigue utilizando la máscara automática de la carrocería. Su calidad depende del fondo y de la fotografía; piezas completas mantiene la alternativa anterior.

El diálogo tiene cabecera fija con Cerrar y desplazamiento vertical. Se comprueba a 1550, 1024, 800 y 720 píxeles de ancho.

## Escala y persistencia

La calibración manual conserva vista, nombre, dimensiones de la imagen, firma de la fuente fotográfica, cuatro límites de referencia, dos distancias físicas y anotación de comprobación. El factor X es distancia horizontal / píxeles horizontales y el Y se calcula independientemente. La firma se obtiene de toda la fuente mediante dos hashes no criptográficos y su longitud; detecta cambios accidentales de foto, no pretende ser autenticación criptográfica.

Los registros se validan antes de aplicarse y al cargar el proyecto. Una calibración de otra fotografía se rechaza aunque ambas tengan el mismo tamaño. Se preserva el reconocimiento automático previo de las fotos Lola VIP. La comprobación de impresión se basa ahora en su calibración reconocida, corrigiendo la comprobación anterior que solo verificaba dimensiones.

Los rectángulos deben estar dentro de la foto y abarcar al menos 10 píxeles por eje. Cada distancia admite 10–1200 mm. Continúan los límites de impresión de 40 millones de píxeles y 16000 píxeles por lado. La escala del conjunto de la foto también puede superar esos límites; el asistente lo rechaza antes de aplicar. No se reduce la impresión para hacerla caber.

Los `.rcbody` V1.12.0 guardan la calibración opcional de cada foto. Abrir, recuperar y deshacer la restauran. La caché de medidas cambia junto con la calibración; no reutiliza medidas de una escala anterior. Las operaciones esperan las ediciones de mm pendientes. Sustituir una foto elimina su escala y reinicia el historial de deshacer, que no conservaba fotografías, para evitar aplicar escalas o dibujos de otra imagen. Antes se conserva una versión completa si la recuperación está disponible.

Las capas dimensionadas continúan usando el giro físico D⁻¹·R·D de V1.11.0, con los factores de la nueva calibración. Se conserva la geometría histórica de las capas antiguas hasta dimensionarlas explícitamente. El PDF mantiene 12 píxeles/mm, aproximadamente 0,083 mm por píxel; el antialias puede alterar la caja rasterizada uno o dos píxeles.

## Archivos de plantilla y creaciones

`.rctemplate` formato 1 incluye únicamente fotografías y calibración aplicada. Excluye pegatinas, pintura elegida, selección, identificador del proyecto e historial. Todas las fotografías incluidas deben estar calibradas; admite una sola vista. Los cambios que todavía no se hayan aplicado en el asistente no forman parte de la plantilla.

Cargar una plantilla abre un diseño nuevo. Se conserva antes el estado anterior en recuperación si está disponible. No modifica el archivo externo original. La carga valida los datos y las referencias de ambas fotos; si falla, conserva las fotos y diseño que estaban abiertos. Guardar trata cancelación del selector, permisos denegados, descarga alternativa y fallo de escritura con aborto del escritor.

Las creaciones `.rcsticker` de una calibración manual usan formato 3. Conservan una referencia de fotografía/escala, sin la fotografía. Se exige la misma referencia al colocarlas para evitar tamaños equivocados en otra plantilla. Las creaciones Lola anteriores mantienen formatos 1/2; las de formato 2 siguen exigiendo la referencia Lola para la que se crearon. Las versiones anteriores rechazan formato 3 explícitamente. No se implementa conversión automática de una creación entre carrocerías distintas.

## Prueba física

La hoja A4 apaisada contiene reglas horizontal y vertical de 100 mm y un rectángulo de 100 × 50 mm, con trazos de 0,2 mm. Las dimensiones se miden entre centros de línea. Debe imprimirse al 100 %, sin ajustar ni reducir.

Las reglas comprueban la configuración de impresión. Después hay que imprimir una pegatina normal sobre papel y comprobar su tamaño y ajuste sobre la carrocería. Solo esa segunda prueba comprueba la calibración elegida y el efecto de la superficie del modelo. El asistente deja registrar esa comprobación por vista; no la realiza ni la certifica. Cambiar medidas o referencia desmarca la anotación.

La escala plana no corrige perspectiva, distorsión de lente o diferencias entre planos, ni desarrolla superficies curvas. Conviene fotografiar perpendicularmente, desde lejos, con los ejes alineados y una referencia medida en el mismo plano. No se garantiza encaje físico sin esta comprobación. No se ha impreso ni probado una carrocería real nueva durante este trabajo.

## Pruebas ejecutadas

### Función nueva

- Importación real mediante el asistente de fotografías sintéticas de 1000 × 600 y 800 × 1000 px; selección mediante arrastre y ajuste preciso de límites.
- Escalas independientes: lateral 300 × 80 mm sobre 600 × 200 px, superior 200 × 400 mm sobre 600 × 800 px. Origen interior de foto y decimales españoles.
- Ancho 85 mm y alto 21,5 mm, bloqueo/desbloqueo y giro de 90° en ambas vistas, sin estiramiento físico de los lados al girar.
- Pieza de 40 × 15 mm fuera de la referencia interior, visible e íntegra sobre la foto: el marco de referencia no recorta el dibujo.
- Recalibración y deshacer con actualización de la caché de medidas; recuperación de la calibración y de su paso de deshacer tras recargar.
- Borrador cancelado, medidas inválidas, límites de píxeles inválidos, calibración injertada en otra foto, datos de proyecto y plantilla corruptos: sin aplicar cambios parciales.
- Guardado/reapertura `.rcbody`; `.rctemplate` sin capas/pintura del diseño; plantilla nueva con ambas escalas; `.rcsticker` formato 3 y rechazo de otra referencia física aunque los píxeles coincidan.
- Cancelación nativa de guardado sin descarga alternativa, permiso denegado con descarga, aborto por fallo de escritura y rechazo de plantilla incompleta.
- La fotografía desconocida del mismo tamaño que Lola no habilita impresión. Una vista vacía sin calibrar no bloquea la impresión de otra vista calibrada que sí tiene dibujo.
- Cuatro PDF reales nuevos: visible/completo × normal/espejo, con todas las piezas y sus píxeles fuente conservados (tolerancia de un nivel RGB por composición alfa). Guías activadas: PDF completo idéntico byte a byte.
- Hoja de comprobación A4: extremos de ambas reglas separados 1200 píxeles y rectángulo 1200 × 600 a 12 px/mm.
- Cambio de foto: se elimina calibración incompatible y no reaparece mediante deshacer.
- Interfaz en cuatro tamaños y sin errores JavaScript inesperados en las ejecuciones satisfactorias.

### Regresión

- Cuatro proyectos, 16 PDF por vistas y 16 optimizados: los 32 archivos son idénticos byte a byte a V1.11.0. También se conserva el PDF con limpieza opcional de la prueba reciente.
- Píxeles de las piezas, escala, márgenes, separación mínima de 2 mm, solapes exactos de 20 mm y cobertura de toda la tinta comprobados.
- Se mantiene el ahorro visible de 5→2, 6→3, 5→1 y 3→2 hojas; normal y espejo. No se afirma mínimo matemático para cualquier diseño.
- Ocho PNG internos de los proyectos anteriores idénticos a V1.11.0.
- Once combinaciones de vista/recurso para las medidas, proporción, posición, giro, inversa de selección/recorte, guías, arrastre real, grupos, bloqueo, deshacer, formatos anteriores y recuperación.
- 27 conversiones SVG, estilos de texto con fuentes incluidas, guardado y PDF anteriores comprobados.
- Recuperación con cierre completo y reinicio del navegador, 300 cambios / 60 recuperados, cuota, retención, fotos compartidas y pestañas independientes.
- Salir conserva su copia previa, espera medidas pendientes y trata cierre permitido/bloqueado, cancelación, fallo de almacenamiento y copia externa.
- Abrir, recuperar, sustituir foto y Nuevo conservan una medida deliberadamente retrasada antes de cambiar de estado.
- Sintaxis y pruebas de módulos para calibración, formato de creaciones, decimales, giro físico, inversas y ajuste a guías.

El resumen de resultados está en `PRUEBAS_V1_12_0.json`. Los proyectos, PDF personales y capturas de las pruebas no se incluyen en los ZIP de la aplicación.

Comandos principales:

```sh
python tests_v1120/calibration.py
python tests_v1120/calibration_guards.py
python tests_v1120/regression.py
python tests_v1120/packing.py
python tests_v1120/precision.py
python tests_v1120/recovery.py
python tests_v1120/exit.py
python tests_v1120/pending_transitions.py
python tests_v1120/features.py
python tests_v1120/png_and_save.py
node tests_v1120/calibration.test.cjs
node tests_v1120/dimensions.test.cjs
node tests_v1120/creations.test.cjs
```

## Conservación y entrega

Se verifican los 187 archivos del resguardo original V1.4.8 y la carpeta completa V1.11.0 contra su ZIP publicado. Permanecen intactos. El codec PDF, distribución A4, textos, SVG, capas, recuperación y BAT originales de la versión anterior permanecen byte a byte iguales; la integración está en el HTML y los módulos de medidas/creaciones.

COMPLETO se extrae en una carpeta nueva. SOLO_CAMBIOS se aplica sobre una copia de V1.11.0 manteniendo las rutas. Los informes incluidos de versiones anteriores son históricos; el informe vigente es este.

Las pruebas se ejecutan con Chromium/Linux y recursos locales interceptados. El entorno bloquea navegación directa a `file://`. Windows/Edge real, los permisos del selector, la política de cierre concreta del navegador y la impresión física quedan pendientes de comprobación en el equipo del usuario. El BAT no ha sido modificado.
