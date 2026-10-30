# RC Bodywork V1.11.0 — milímetros, alineación y Salir

## Resultado y resguardo

Esta versión parte de V1.10.0. Añade ancho, alto y posición en milímetros, bloqueo de proporción para esas medidas, alineación, guías y ajuste al arrastrar. Añade Salir con copia de recuperación previa y tratamiento de las restricciones de cierre del navegador.

Se conservan los originales y las entregas anteriores. Continúan el autoguardado, las versiones, deshacer, grupos, creaciones reutilizables, textos, recursos y la distribución optimizada de pegatinas en A4. No se incorporan los acabados visuales de V1.9.0 descartados.

## Uso de las medidas

Selecciona una capa. Bajo Capas del diseño aparece Medidas y alineación · mm. Se acepta coma o punto decimal; se confirma con Intro o al salir del campo.

- Ancho y alto sin girar: caja del dibujo imprimible completo, en su orientación base. Se miden los píxeles de la pieza, incluyendo sus recortes y borrados; no el margen transparente del archivo ni solo el marco del editor.
- X/Y del centro: centro de la caja del dibujo en su orientación actual. No es necesariamente el pivote interno de un logo asimétrico.
- Mantener proporción al cambiar mm: al introducir ancho o alto se escalan ambos ejes por el mismo factor. Conserva la proporción física actual de la pieza. Desmarcarlo permite fijar ambas medidas independientemente, por ejemplo para reproducir una pegatina de 100 × 30 mm.
- Los controles porcentuales anteriores permanecen disponibles y siguen funcionando como ajustes relativos. El bloqueo nuevo se aplica a los campos de mm, tal como indica su etiqueta.

Al cambiar el tamaño se mantiene el centro del dibujo. No se modifican sus colores, textos, orden, grupo o borrados. Un cambio confirmado es un paso de deshacer. Guardar, guardar una pegatina, duplicar, cambiar de capa, exportar y salir esperan una edición de mm que aún se esté calculando. Abrir otro proyecto, recuperar una versión, sustituir una foto o empezar un diseño conservan primero el estado con esa medida ya aplicada. Un valor inválido, una posición imposible o un tamaño que supera el límite de cálculo se rechaza sin aplicar parcialmente la operación.

Ancho y alto actúan sobre la capa activa. X/Y y los botones de alineación desplazan conjuntamente la selección o el grupo, conservando sus posiciones relativas. Una capa bloqueada impide modificarla; si una selección contiene un miembro bloqueado, tampoco se desplaza el conjunto.

### Ejes y referencia

El origen está en la esquina superior izquierda del rectángulo calibrado de la fotografía, no en la esquina de la imagen completa:

| Vista | X | Y | Rectángulo de la foto |
| --- | --- | --- | --- |
| Superior | 0–235 mm, izquierda a derecha | 0–450 mm, alerón a morro | x=177…695, y=16…751 |
| Lateral | 0–450 mm, morro a cola | 0–124 mm, arriba a abajo | x=20…1140, y=209…535 |

Se reconoce la fotografía de referencia por su firma de fuente y dimensiones. Coincidir únicamente en píxeles no basta para habilitar las medidas. Las fotos conocidas son 878 × 768 superior y 1167 × 768 lateral. Una fotografía diferente mantiene los controles anteriores, pero el panel informa de que requiere calibración y desactiva los campos de mm. No se ha implementado el asistente de calibración de otras carrocerías.

Los campos miden la pieza completa antes del recorte de la carrocería y antes de la limpieza opcional del PDF. «Como se ven en la carrocería» puede cortar lo que sobresale y la limpieza puede quitar fragmentos; ambas operaciones conservan la escala del dibujo que queda. Comprueba esas opciones en la vista previa.

## Correspondencia con el PDF y giro físico

Se utiliza el mismo renderer calibrado de piezas completas que prepara la impresión. Se detecta la tinta con el mismo umbral alfa usado para recortar el PDF. El editor trabaja con valores numéricos precisos, muestra décimas de mm y el PDF mantiene 12 píxeles/mm: un píxel equivale a aproximadamente 0,083 mm. La caja rasterizada puede variar uno o dos píxeles por antialias, fase de muestreo o sombras del recurso; no se promete precisión física de una centésima de mm.

Los factores de foto X/Y son distintos. Aplicar simplemente un giro en píxeles cambiaría la longitud física de un logo al rotarlo. Para las piezas dimensionadas mediante los campos nuevos se utiliza una transformación de giro en el espacio calibrado: D⁻¹ · R · D, donde D transforma píxeles de foto a mm. Así se conservan las longitudes y los ángulos físicos de la pieza al girarla. También se actualizan el cálculo del lienzo de impresión, la posición de las piezas completas, la selección, el recorte y los controles de piezas internas para utilizar la transformación y su inversa correspondientes.

Esta transformación solo se activa cuando una capa adquiere la escala de precisión mediante ancho/alto en mm. Abrir un proyecto anterior o consultar sus medidas no cambia su dibujo ni sus giros históricos. Si se confirma una medida en una pieza antigua ya girada, puede cambiar ligeramente su proyección en la fotografía al pasar a la rotación físicamente correcta. Su centro se conserva y puede deshacerse.

La escala adicional evita forzar los límites de los antiguos sliders. Los campos admiten valores solicitados de 0,1 a 1000 mm, pero el tamaño combinado, el giro y el límite de memoria pueden restringir una pieza concreta. Los lienzos de impresión se limitan a 40 millones de píxeles y a 16000 píxeles por lado. Una pieza ya excesiva puede reducirse con los controles porcentuales antes de volver al panel. No se reduce automáticamente el tamaño ni se oculta un fallo de medición.

La caja de una pieza puede aparecer girada en el PDF porque la distribución busca aprovechar papel. Es un giro, no una modificación de sus medidas. Para medirla sobre el papel hay que orientarla como el dibujo original.

## Alineación y guías

Izquierda, Centrar X, Derecha, Arriba, Centrar Y y Abajo alinean la caja de tinta de la selección con el rectángulo calibrado. Si hay varias capas o un grupo se utiliza la unión de sus cajas visibles y se desplazan todos sus miembros sin alterar sus distancias.

Mostrar guías presenta los límites y centros de la referencia. Ajustar a guías al mover añade ajuste a límites y centros de otras capas visibles y de la referencia. Las líneas de ajuste se destacan durante el arrastre. El umbral es de seis píxeles de pantalla, con un máximo de 3 mm por eje, ajustado al zoom. Se respeta el límite de colocación del centro de las capas dentro de la fotografía.

Las guías y sus etiquetas se dibujan exclusivamente como herramientas del editor. No entran en los recursos ni en el PDF. Se conservan como preferencias de la recuperación local.

## Guardado y archivos reutilizables

El proyecto se guarda como .rcbody V1.11.0. La escala y el bloqueo de proporción son propiedades opcionales de cada capa, de modo que un proyecto antiguo no recibe valores nuevos por el mero hecho de abrirlo. Se conservan al guardar, recuperar, duplicar y utilizar el historial.

Las creaciones .rcsticker que contienen escala de precisión usan formato 2. Esta versión lee formatos 1 y 2. Una versión anterior rechaza el formato 2, evitando cargar una pegatina con el tamaño equivocado por ignorar sus medidas. Las creaciones sin escala nueva siguen usando formato 1. Para cargar una creación con medidas se exige la fotografía Lola VIP de referencia correspondiente; se mantienen también las comprobaciones de vista y dimensiones anteriores.

Guarda los proyectos nuevos con otro nombre y conserva tus originales. Una versión antigua puede rechazar un proyecto V1.11.0. Las fotos y proyectos personales de prueba no se incluyen en los ZIP del programa.

## Botón Salir

Salir aparece en la cabecera. Antes de solicitar el cierre:

1. Espera a que termine una edición pendiente del panel de mm.
2. Confirma una versión local de recuperación del proyecto actual.
3. Solicita cerrar únicamente la pestaña/ventana del programa.

Si el navegador permite el cierre, se cierra. Si lo bloquea, el diálogo explica que el trabajo está protegido y permite cerrar manualmente con la X o Ctrl+W, guardar un .rcbody o volver al diseño. No se intenta saltar la restricción con cambios de navegación o cierres de otras pestañas.

Si el almacenamiento local falla, no se cierra automáticamente. Guardar .rcbody permite hacer una copia externa y después habilita el cierre. Si el usuario cancela ese guardado, el programa permanece abierto. Una descarga por navegador se presenta como solicitada; conviene comprobar que haya terminado antes de cerrar.

Volver al diseño o Escape cancelan el intento de salida, incluso si la copia local se estaba preparando. Una confirmación de guardado que llegue después no cierra una sesión cuya salida se ha cancelado. Durante los diálogos se evitan los atajos que modificarían el dibujo de fondo.

La copia local tiene los límites de V1.10.0: depende del navegador y perfil, no sustituye al archivo externo y puede desaparecer si se borran sus datos. No se garantiza recuperar un cambio que todavía estaba pendiente ante un cierre forzado del proceso.

## Validación

- Once combinaciones de vista/recurso: logos, SVG, textos nuevos y anteriores, imágenes y piezas nativas. Se introducen ancho 85 mm y alto independiente 21,5 mm, con errores digitales comprobados menores de 0,19/0,26 mm según la operación. Se verifican también centro exacto en coordenadas del modelo, proporción, giro y deshacer.
- Giros de 90°: intercambio de lados de la caja física, sin el estiramiento de la calibración anisotrópica. Pruebas matemáticas de longitud, perpendicularidad e inversa en ambas calibraciones y varios ángulos.
- Giro de 37°: ancho/alto de orientación base y centro conservados al redimensionar. Selección y coordenadas de recorte contrastadas con la transformación inversa.
- Logo de 100 mm en una posición completamente dentro de la carrocería: medida del raster de impresión visible dentro de 0,25 mm de lo solicitado.
- Guías sin efecto en los datos del proyecto o las páginas PDF. Arrastre real mediante ratón: ajuste del centro al eje de 225 mm.
- Recorte/borrado real sobre una pieza escalada y reversión por deshacer.
- Posición y centrado de grupos: distancias relativas conservadas. Miembro bloqueado: operación rechazada sin cambios.
- Guardado/reapertura, .rcsticker formato 2 e importación real, autoguardado y recuperación de capas con medidas y preferencias de guías.
- Valores inválidos, escalas corruptas y fotografía diferente del mismo tamaño: no se aplican medidas falsas ni cambios parciales. La versión anterior rechaza explícitamente una creación formato 2.
- Cuatro PDF nuevos con medidas y giros de 90°, 37° y −37°: normal/espejo y visible/completo. Se compara cada elemento colocado con sus píxeles fuente, con tolerancia máxima de un nivel RGB en el cálculo de alfa; no faltan elementos. La extensión del lateral compuesto completo coincide con la unión prevista de cajas calibradas dentro de 0,26 mm. Activar guías conserva el PDF completo idéntico byte a byte.
- Ediciones pendientes con carga de recursos deliberadamente retrasada: guardado nativo, descarga, creación reutilizable, duplicación, selección y PDF usan la medida nueva. Abrir, recuperar, sustituir una foto y Nuevo conservan una versión previa con la medida pendiente ya resuelta.
- Salir: copia confirmada antes del intento de cierre; entrada de mm pendiente aplicada primero; alternativa cuando el navegador bloquea el cierre; cancelación con botón y Escape durante un guardado retrasado; fallo de cuota; cancelación de archivo externo; copia externa que habilita el cierre. Se comprueba un cierre real de una ventana abierta por script y la conservación de su recuperación.
- Regresión: 16 PDF anteriores y otros 16 optimizados de los cuatro proyectos, todos idénticos byte a byte a V1.10.0. Se conserva el ahorro visible 5→2, 6→3, 5→1 y 3→2 hojas, tanto normal como espejo. Continúan escala, cobertura de tinta, separación de 2 mm y solapes de 20 mm.
- Ocho PNG históricos iguales a V1.10.0 mediante la función interna conservada. Recursos, textos, capas y guardado anteriores comprobados; autoguardado y recuperación tras cierre completo del navegador también comprobados con las pruebas V1.10.0 adaptadas.
- Interfaz revisada en 1550×1000, 1024×768, 800×768 y 720×900. El botón Salir permanece dentro de la cabecera.
- Sintaxis comprobada y sin errores JavaScript inesperados en las ejecuciones satisfactorias. El resumen está en PRUEBAS_V1_11_0.json.

Comandos principales:

```sh
python tests_v1110/precision.py
python tests_v1110/precision_export.py
python tests_v1110/exit.py
python tests_v1110/pending_edits.py
python tests_v1110/pending_transitions.py
python tests_v1110/regression.py
python tests_v1110/packing.py
python tests_v1110/features.py
python tests_v1110/png_and_save.py
python tests_v1110/recovery.py
node tests_v1110/dimensions.test.cjs
node tests_v1110/creations.test.cjs
node --check RC_Bodywork_V1_11_0/rc-dimensions.js
node --check RC_Bodywork_V1_11_0/rc-metric-editor.js
```

También se comprueba el script principal extraído temporalmente del HTML. El puente de instrumentación no se distribuye en la aplicación.

## Límites y entrega

Las pruebas son de software en Chromium/Linux con recursos locales interceptados. El entorno bloquea navegar directamente a file://. El BAT original se mantiene intacto; Windows/Edge, permisos reales del selector y la política concreta de cierre del navegador del usuario requieren prueba en su equipo. Se ha probado tanto el cierre permitido de una ventana abierta por script como el tratamiento de un cierre bloqueado.

No se ha efectuado impresión física. La precisión material depende de la calibración, impresión al 100 %, impresora y soporte. Comprueba la regla de 100 mm y una medida conocida en papel antes del adhesivo.

COMPLETO debe extraerse en una carpeta nueva. SOLO_CAMBIOS está calculado sobre V1.10.0: copiar los archivos manteniendo sus rutas sobre una copia de esa versión. Se recomienda COMPLETO. Los informes de otras versiones que se conservan en la carpeta son históricos.
