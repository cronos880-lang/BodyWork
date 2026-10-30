# RC Bodywork V1.8.0

## Alcance y resguardo

Se conserva V1.7.0 y los originales anteriores. No se cambian fotografías, proyectos de regresión, imágenes históricas ni el motor `rc-print.js`. La entrega implementa el recorte de interfaz solicitado, una primera ampliación del catálogo SVG a partir de piezas que ya tenían trazados y seis estilos de texto más elaborados. Las piezas extraídas de fotografías siguen pendientes de reconstrucción; no se presenta un calco automático como una versión limpia certificada.

## Cuadro de exportación

Se elimina el bloque de botones PNG, el párrafo de selección de vistas y la descripción repetida de calibración de la primera captura. La acción principal y el título dicen Exportar pegatinas PDF. La función PNG interna se conserva para compatibilidad y regresión, aunque ese bloque ya no aparece en la interfaz.

El selector se llama Recorte de las pegatinas. Como se ven en la carrocería aplica la máscara de su silueta; Piezas completas conserva también lo que sobresale. Se explica el efecto al cambiar la selección. Ninguna opción reduce la escala ni elimina automáticamente los fragmentos de una imagen.

## Piezas limpias

Las 27 piezas laterales de las familias Flow Wave, Hyper Slash y Crystal Tech ya se dibujaban con caminos vectoriales. Se generan recursos SVG de esos mismos caminos y se añaden a los nueve diseños anteriores: 36 en total. Los catálogos se separan por familias.

El botón Usar versión SVG limpia, disponible solo para una pieza compatible seleccionada, mantiene posición, tamaño, escalas X/Y, ángulo, paleta, borrados, nombre, orden y grupo. Cambia la representación al recurso SVG correspondiente y retira la sombra de presentación. La proporción de edición original de esas piezas se mantiene mediante metadatos del recurso; no se recalcula arbitrariamente su tamaño por la caja SVG. Los recortes rectangulares históricos que el renderer de piezas sueltas no aplicaba se limpian al convertir, para no cambiar su dibujo visible. El cambio es reversible con Deshacer.

No se modifican los antiguos proyectos automáticamente. Las piezas fotográficas mantienen sus píxeles; reconstruirlas con calidad exige distinguir el diseño de los reflejos y restos de carrocería. No se implementa ni se anuncia conversión automática general de fotografías.

## Texto de logo

Se conserva el renderer y las 12 variantes históricas y se añaden seis: Racing, Doble contorno, Escudo, Metalizado, Firma y Placa. Se emplean tipografías libres incluidas y contornos/bandas/acabados que se ajustan al texto real. Las miniaturas usan el nombre y los colores elegidos; el texto sigue editable y se conserva en proyectos y creaciones reutilizables.

El ajuste usa las cajas reales de los glifos, incluidos los remates de la firma, y reserva margen para trazos y adornos. Los estilos nuevos tienen cotas de dibujo propias. Se guardan valores explícitos de recorte vacío y borrados vacíos en las capas nuevas, de modo que crear/guardar/reabrir no cambie esos valores por normalización implícita.

### Fuentes y funcionamiento offline

- Racing Sans One: Google Fonts, SIL Open Font License 1.1.
- Russo One: Google Fonts, SIL Open Font License 1.1.
- Yellowtail: Google Fonts, Apache License 2.0.

Se obtuvieron desde el repositorio oficial `google/fonts` por HTTPS, con verificación TLS. La ruta de Yellowtail está en `apache/yellowtail`; las otras dos en `ofl/`. Se distribuyen los TTF originales sin modificar sus bytes, junto con sus licencias y nombres originales. Los TTF se incluyen en `assets/fonts/` y se cargan con FontFace desde copias de esos datos incluidas en `rc-text.js`. No se consulta un servicio de fuentes durante el uso ni se necesita instalación en Windows. Los PDF que usan los estilos nuevos esperan a la carga correcta, para no imprimir una fuente de sustitución silenciosa.

## Validación

- Cuatro proyectos originales: 16 PDF normal/espejo y visible/completo, más el caso de limpieza opcional. Se mantienen los resultados de V1.7: cobertura de tinta, límites A4, escala y continuidad exacta de los solapes. Mismos recuentos observados: 5/6, 6/6, 5/5 y 3/3 según contenido.
- Ocho PNG generados con la función interna: píxeles idénticos a V1.7.0. La retirada del bloque de interfaz no modifica las imágenes históricas.
- Diálogo: ausencia de ambos botones PNG y de la palabra PNG en su contenido; selector de recorte y explicación correctos en ambos modos; exportación PDF funcional.
- 27 conversiones: mismas cotas virtuales que la pieza antigua, con escalas X/Y no uniformes; comparación del raster de los caminos sin sombra en la misma transformación: cero píxeles de diferencia alfa significativa en los 27 casos. Se evita recortar el antialias de la caja nativa cuando no hay recorte del usuario.
- Conversión real en UI: conservación de geometría, ángulo, colores y borrados; Deshacer devuelve la pieza antigua.
- Tres fuentes cargadas desde el paquete con estado loaded en Chromium.
- Seis estilos de texto con tres nombres cada uno, incluyendo acentos y 24 caracteres: 18 pruebas que verifican tinta no vacía y ausencia de desbordamiento de sus cotas.
- Nombre y ambos colores editados antes de añadir; nueva pieza con esos valores; catálogo de 18 estilos, con los seis nuevos primero y los anteriores conservados.
- Proyecto con texto nuevo y pieza convertida: guardar/reabrir con igualdad de datos; guardar como grupo `.rcsticker`; PDF normal y espejo.
- Se conserva la validación de archivos reutilizables, geometría, identidades independientes y ausencia de fotos. Se prueban cancelación, denegación y alternativas de guardado como en V1.7.
- Sintaxis comprobada con Node para el script principal y módulos. Sin errores JavaScript inesperados en las ejecuciones exitosas.

```sh
python tests_v180/features.py
python tests_v180/regression.py
python tests_v180/png_and_save.py
node tests_v180/creations.test.cjs
node --check RC_Bodywork_V1_8_0/rc-text.js
node --check RC_Bodywork_V1_8_0/rc-vectors.js
```

También se comprobó `/tmp/rc180.js`, extraído del script principal. Los tests instrumentan la copia servida en memoria; la aplicación distribuida no incluye esa interfaz de pruebas. Evidencias y capturas se conservan en `informes_v180/`, sin publicar proyectos, fotos o PDF personales en los paquetes del programa.

## Límites

La colección ampliada limpia las 27 piezas que ya tenían geometría vectorial. Las piezas basadas en fotografías, incluidas las superiores fotográficas, no se han reconstruido y pueden mantener sus detalles originales. No se garantiza una limpieza correcta de una fotografía con un clic.

El PDF sigue rasterizado sin pérdidas a 304,8 ppp; los SVG fuente y los glifos escalables se usan para su render. No se anuncia un PDF completamente vectorial.

La validación de software se realiza en Chromium/Linux con recursos locales interceptados. Este entorno bloquea abrir file:// directamente; el BAT original permanece intacto, pero Windows/Edge, selectores nativos reales e impresión física siguen pendientes. La calibración permanece limitada a las fotos Lola VIP conocidas. El programa debe probarse en papel al 100 % antes de usar adhesivo.
