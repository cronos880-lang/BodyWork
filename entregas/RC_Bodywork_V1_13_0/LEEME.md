# RC Bodywork V1.13.0 · COMPLETO

Código: `bae50b563989010a0c549fdd60b877bb01c90096`. Nueva versión para evaluación del usuario, con 50 comprobaciones de software satisfactorias. La aprobación del usuario y la prueba física de cotas en carrocerías nuevas siguen pendientes.

## Instalación sin sustituir la versión actual

1. Extraer el ZIP en una ubicación nueva. Contiene su propia carpeta `RC_Bodywork_V1_13_0`.
2. Abrir su `RC_Bodywork.html` o `INICIAR_RC_Bodywork.bat` en Windows, manteniendo módulos y assets juntos.
3. Abrir copias de tus proyectos y guardar con otro nombre. Conservar V1.12.1 y sus archivos originales.

Para volver, abrir tu V1.12.1 y tus proyectos originales. Los `.rcbody` guardados con V1.13.0 necesitan esta versión; V1.12.1 los rechaza para no sustituir los recursos nuevos. No hay parche que sobrescriba la instalación actual ni migración automática de datos. Las copias externas `.rcbody` siguen siendo necesarias.

## Novedades reales

- 18 diseños vectoriales originales con contornos preparados mediante VectorCraft CLI 0.24.1.
- Tres emblemas con degradados, bisel y transparencia terminados con PhotoCraft CLI 0.23.1.
- Cuatro iconos vectoriales creados con FigCraft CLI 0.18.1.
- Búsqueda/familias, miniaturas SVG, fondos de inspección y combinaciones de dos colores.

Los tres CLI están instalados y comprobados en el entorno Codex Linux, no en tu Windows. Bodywork utiliza sus recursos preparados: funciona offline sin esos programas. Las recetas y lanzadores están en `tools/artcraft/`; los ejecutables no se incluyen.

## Verificación

ZIP leído completo y comprobado archivo por archivo contra el código del commit; SHA-256 en `SHA256SUMS.txt`. Los recursos nuevos se reconstruyen con los tres CLI con hashes idénticos. Se mantienen los 36 vectoriales, los 12 logos, las vistas Lola y ocho PDF anteriores idénticos. Pruebas de guardado, reapertura, recuperación y nuevos PDF satisfactorias. Ver `INFORME_V1_13_0.md`, `PRUEBAS_V1_13_0.json` y `VERIFICACION_CLI_V1_13_0.json` incluidos.

Windows/Edge nativo, impresión física y calibración de cotas con carrocerías nuevas siguen pendientes. Los módulos de calibración y medidas, el motor de impresión, las entregas anteriores y `main` no se han modificado.
