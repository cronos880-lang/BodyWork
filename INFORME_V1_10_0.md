# RC Bodywork V1.10.0 — recuperación y ahorro de adhesivo A4

## Base y alcance

Esta versión parte de V1.8.0. No incluye los nuevos tonos, materiales ni acabados visuales de la V1.9.0 descartada. Se conserva el programa anterior y el resguardo original V1.4.8. Los proyectos originales no se reescriben.

Se implementa la opción 2: autoguardado, recuperación, versiones locales e historial ampliado. También se mejora la distribución de impresión para aprovechar los huecos entre las pegatinas y mezclar vistas en una misma hoja, manteniendo la escala física y el dibujo existente.

## Guardado automático y recuperación

Una barra indica el estado del autoguardado. Se guarda tras 1,2 segundos sin cambios y, durante una edición continua, se intenta guardar como máximo cada 5 segundos. Se incluyen fotografías, capas, texto, colores, recortes, borrados, grupos, visibilidad y bloqueo. Las preferencias de impresión y parte del historial también se conservan en la recuperación local.

Se usa IndexedDB, dentro del navegador. No se suben diseños a un servicio ni se modifica automáticamente el archivo .rcbody del usuario. Las fotografías se guardan como recursos compartidos entre versiones, evitando repetir sus datos en cada copia. Cada actualización de fotos y proyecto se confirma en una transacción: un fallo deja disponible el estado anterior completo.

Al volver a abrir se ofrece Recuperar última sesión. Versiones y recuperación permite revisar las fechas, recuperar un estado y descargarlo como .rcbody. Recuperar conserva primero una versión del trabajo actual, si lo hay; no lo descarta directamente. Si no puede guardarse ese estado por falta de almacenamiento, la recuperación se detiene con un aviso, permitiendo guardar un archivo manualmente.

Se conserva una versión automática aproximadamente cada minuto en que haya cambios y versiones al guardar un archivo, sustituir una foto o cambiar de proyecto. Guardar versión ahora permite fijar otro punto. Hay un límite de 20 versiones y tres sesiones de pestaña recientes por diseño, y 10 diseños recientes. Las copias más antiguas y las fotos que ya no usa ninguna copia se eliminan automáticamente de este historial local. Los archivos del usuario no se eliminan.

Los proyectos nuevos guardan una identidad de diseño estable en designId para reunir sus versiones al volver a abrir el .rcbody. Un proyecto antiguo sin identidad la adquiere al abrirse y guardarse con esta versión. Dos pestañas tienen borradores independientes y no sobrescriben mutuamente su sesión, aunque recuperen el mismo diseño.

Cambiar de proyecto, reabrir el mismo archivo o sustituir una fotografía conserva un punto anterior. Las cargas incompletas no se autoguardan. Se evita empezar otra carga simultánea y guardar/exportar un estado a medio cargar. Una imagen inválida no sustituye las fotografías y capas del proyecto actual.

Si el navegador bloquea el almacenamiento o se llena, la barra muestra el fallo. Abrir proyectos y guardar un .rcbody por descarga siguen funcionando. Al pasar la pestaña a segundo plano se intenta completar el guardado pendiente. Al cerrar con cambios pendientes se solicita la advertencia de salida del navegador, cuando su política lo permite.

### Límites del almacenamiento local

La copia pertenece al navegador, perfil y origen/ubicación de la aplicación. Borrar sus datos, cambiar de perfil, usar navegación privada o una política que bloquee archivos locales puede impedir recuperarla. No sustituye una copia externa .rcbody. Un cierre forzado durante los últimos segundos de edición puede dejar únicamente el último estado confirmado; no se promete persistencia de un cambio que aún figura como pendiente.

## Historial de deshacer

Se amplía de 70 a un máximo de 300 estados, con un límite aproximado de 32 MiB de datos serializados. La selección de pintura también registra el estado anterior. Se mantienen los puntos de deshacer de capas, grupos, texto, tamaños, recortes y borrados existentes.

La recuperación conserva los últimos 60 estados que quepan en aproximadamente 4 MiB. Así, recuperar una sesión puede conservar sus cambios recientes de deshacer sin multiplicar indefinidamente cada versión. El límite por memoria puede reducir la cantidad efectiva en diseños muy complejos.

## Impresión: distribución conjunta por la forma del dibujo

En Exportar pegatinas PDF aparece Distribución en A4:

- Ahorrar papel · todas las vistas juntas: opción predeterminada. Distribuye pegatinas superiores y mosaicos de los dos laterales en las mismas hojas. Puede aprovechar zonas transparentes de sus cajas y girar cada elemento 0°, 90°, 180° o 270°.
- Distribución anterior · por vistas: mantiene el método V1.8.0 como alternativa y referencia de comparación.

La distribución usa máscaras conservadoras con celdas de 1 mm: si cualquier píxel del recurso tiene alfa, la celda cuenta como ocupada. Se dejan al menos 2 mm entre el dibujo de elementos distintos, incluidos sus identificadores y marcas. Las cajas transparentes pueden cruzarse; sus dibujos no se pisan. El área útil mantiene los márgenes de 7 mm: 283 × 196 mm en A4 horizontal de 297 × 210 mm.

Se prueban ocho órdenes de colocación para lotes de hasta 40 elementos y seis para lotes mayores. Se elige el menor número de hojas encontrado y después una ocupación más compacta hacia la parte superior. Es una búsqueda heurística sobre una cuadrícula conservadora, no una prueba matemática del mínimo global. No se garantiza que toda composición arbitraria alcance su mejor distribución posible.

Se compara el resultado con el recuento del método anterior. Si el nuevo resultado necesitara más hojas o no pudiera conservar las marcas necesarias de una unión de tamaño extremo, se usa la distribución anterior. No se reduce el diseño para hacerlo caber ni se crea una unión adicional solo para reservar espacio a las anotaciones.

El lateral sigue siendo una composición: los logos superpuestos y sus posiciones relativas se conservan. Se redistribuyen los mosaicos ya preparados; no se separan letras ni capas superpuestas para ahorrar papel. Las pegatinas superiores mantienen la preparación individual anterior.

### Escala, identificación y montaje

El PDF conserva 12 píxeles/mm, equivalentes a 304,8 ppp, sin compresión con pérdidas. Los giros nuevos son cuartos de vuelta exactos; no se remuestrean ni se deforman los elementos al colocarlos. El contenido normal/espejo y el lateral B reflejado se preparan como antes.

Los elementos se identifican como S1, S2… para superiores y LA/LB para laterales. Si hay un mosaico, se añade su número. Las marcas rojas señalan las uniones y se conservan los solapes de 20 mm exactos, tanto horizontales como verticales. La cabecera indica hoja, modo de impresión y ubicación aproximada de los identificadores. La regla de 100 mm permanece fuera del área de dibujo.

La vista previa muestra el ahorro frente a la distribución anterior y la misma distribución que después se exporta. Se conserva Recorte de las pegatinas y la limpieza opcional de fragmentos. La limpieza sigue desactivada de forma predeterminada: ahorrar papel no borra detalles del diseño.

## Resultados con los cuatro proyectos

Los recuentos son iguales en PDF normal y espejo para estos casos comprobados:

| Caso | Visible: anterior → nueva | Piezas completas: anterior → nueva |
| --- | --- | --- |
| Proyecto 1 | 5 → 2 | 6 → 4 |
| Proyecto 2 | 6 → 3 | 6 → 3 |
| Proyecto 3 | 5 → 1 | 5 → 1 |
| Prueba reciente | 3 → 2 | 3 → 2 |

En recorte visible, los cuatro juegos suman 19 hojas antes y 8 ahora: 11 hojas menos, aproximadamente un 58 % de ahorro en este conjunto. No se presenta este porcentaje como una garantía para otros diseños.

## Validación realizada

- Recuperación real tras cerrar Chromium por completo y volver a lanzarlo con el mismo perfil: igualdad del proyecto y disponibilidad del historial reciente.
- Edición que activa el autoguardado sin pulsar Guardar ni llamar al guardado del test.
- 300 estados en memoria y 60 recuperados; límite de 20 versiones y 10 diseños mediante transacciones reales.
- Dos pestañas recuperando el mismo diseño: borradores distintos y colores independientes conservados.
- Fotografías compartidas: múltiples versiones mantienen dos recursos fotográficos en los casos originales, sin incluir src dentro de cada registro compacto.
- Fallo de cuota simulado: la versión completa anterior permanece legible. Almacén bloqueado: apertura y descarga manual de .rcbody funcionales.
- Reapertura del mismo diseño, sustitución de una foto y recuperación: puntos anteriores conservados. Carga de una foto inválida: datos originales intactos. Cargas simultáneas y autoguardado de estados parciales bloqueados.
- Cuatro proyectos y 16 PDF con la distribución anterior: idénticos byte a byte a los PDF V1.8.0 correspondientes. Se comprueban cobertura de tinta, límites A4, escala, espejo y continuidad de solapes.
- Otros 16 PDF con la distribución optimizada: mismos píxeles de cada elemento, salvo una tolerancia máxima de un nivel RGB en la composición de alfa; ninguna omisión, superposición ni reducción; separación mínima de 2 mm verificada independientemente en cuadrícula y uniones de 240 píxeles, equivalentes a 20 mm.
- Reconstrucción de los laterales a partir de los mosaicos: todo el alfa imprimible del origen queda cubierto. Los contenidos de los mosaicos coinciden con la composición original.
- Vista previa: mismo recuento que el PDF y ahorro informado correctamente.
- Dos triángulos cuyas cajas no caben juntas sí se distribuyen en una hoja por su forma real. Pieza de 281 × 195 mm conservada entera. Mosaico de alto completo con fallback que mantiene sus marcas. Póster de varias filas/columnas. Cien piezas pequeñas sin omisiones.
- Ocho PNG históricos idénticos a V1.8.0 mediante la función interna; no se repone el bloque PNG retirado anteriormente.
- SVG, textos, fuentes incluidas, capas y creaciones .rcsticker comprobados con las pruebas existentes: 27 conversiones, 18 pruebas de extensión de textos nuevos, tres fuentes y guardado/reapertura.
- Cancelación, denegación y fallos de escritura del selector de archivos comprobados con dobles de prueba. Sintaxis JavaScript comprobada y sin errores inesperados en las ejecuciones exitosas.

Comandos principales:

```sh
python tests_v1100/recovery.py
python tests_v1100/packing.py
python tests_v1100/packing_limits.py
python tests_v1100/regression.py
python tests_v1100/features.py
python tests_v1100/png_and_save.py
node tests_v1100/creations.test.cjs
node --check RC_Bodywork_V1_10_0/rc-recovery.js
node --check RC_Bodywork_V1_10_0/rc-pack.js
node --check RC_Bodywork_V1_10_0/rc-print.js
```

También se comprueba el script principal extraído del HTML. El puente de instrumentación no se distribuye en la aplicación. PRUEBAS_V1_10_0.json contiene un resumen sin fotos, proyectos ni PDF personales.

## Límites y entrega

Pruebas realizadas en Chromium/Linux con recursos locales interceptados. El entorno impide navegar directamente a file://; se conserva el BAT original, pero Windows/Edge y sus selectores reales requieren comprobación en el equipo del usuario. El almacenamiento del perfil sí se ha probado tras un cierre y arranque completos del navegador.

La impresión física sigue pendiente. Se mantiene la calibración Lola VIP de las fotos entregadas; otras fotografías necesitan calibración. Imprimir al 100 %, sin ajustar a página, y comprobar primero en papel la regla de 100 mm y los solapes. Los márgenes seguros pueden depender de la impresora.

La entrega COMPLETO se extrae en una carpeta nueva. SOLO_CAMBIOS está calculada respecto a V1.8.0: copiar sus archivos con las mismas rutas sobre una copia de esa versión. No es un parche sobre V1.9.0, cuyos acabados se han descartado. Se recomienda la entrega completa.
