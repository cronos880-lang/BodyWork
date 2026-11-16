# RC Bodywork V1.13.2

Código: `082da15727d2ab312c0531b21595d7a1b45d3021`. Corrige los colores escogidos antes de colocar un logo y su vista previa; añade cuatro emblemas en relieve. La prueba de cotas continúa pendiente del usuario.

## Instalar

**COMPLETO (recomendado):** extraer en una carpeta nueva y abrir `RC_Bodywork_V1_13_2/RC_Bodywork.html` en Chrome o el BAT de esa carpeta. Conservar todas las carpetas y módulos juntos. Cerrar la pestaña anterior.

**ACTUALIZACION:** cerrar la pestaña y aplicar sobre una copia completa de V1.13.1, manteniendo las rutas y sustituyendo los archivos del ZIP. No basta con copiar solo el HTML. Se ha comprobado aplicar este parche sobre la entrega V1.13.1 publicada y comparar todos los archivos con el código actual.

## Usar los colores

En Pegatinas → Logos y emblemas, los controles aparecen antes del catálogo. Cambiar principal/acento actualiza las miniaturas y prepara el próximo logo; también modifica la capa seleccionada. Aplicar colores elegidos activa los valores actuales aunque el selector no haya cambiado. Colores originales del logo restaura la imagen inicial y se puede deshacer. Las capas bloqueadas se respetan.

Se conservan los doce logos y los tres emblemas anteriores. Se añaden Turbo, Fénix, Torque y Corona; ver `NUEVOS_EMBLEMAS.png`. Los prepararon los CLI VectorCraft y PhotoCraft, con PNG transparente incrustado: no necesitas instalar esos programas.

## Proyectos y comprobaciones

Se leen archivos anteriores; guardar con otro nombre y conservar originales. Los nuevos proyectos se identifican como V1.13.2 para que un catálogo antiguo no sustituya los emblemas desconocidos. Los proyectos antiguos no se recolorean automáticamente al abrirlos: seleccionar el logo y aplicar los colores si se desea activarlos.

Se probaron los doce logos y siete emblemas antes/después de colocar, miniaturas, ambos canales independientes, restauración y deshacer, bloqueo, guardado y recuperación. 95 combinaciones conservan alfa; 22 colocaciones directas en dos vistas; ocho PDF anteriores siguen idénticos. Detalles en `INFORME_V1_13_2.md` y `PRUEBAS_V1_13_2.json` incluidos.

Pruebas de software en Chromium/Linux, no en el Windows/Chrome del usuario. Impresión física y cotas de carrocerías nuevas siguen pendientes. No se cambian calibración, medidas ni geometría de colocación. Las entregas anteriores y `main` permanecen intactos.

ZIP comprobados archivo por archivo; SHA-256 en `SHA256SUMS.txt`.
