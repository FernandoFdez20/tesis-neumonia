# Referencias de las pruebas de ejecución

Esta carpeta conserva los ejecutores, resultados y capturas de la evaluación del 5 de noviembre de 2026, documentada en Anexo 4. Su incorporación al proyecto el 6 de noviembre no representa una nueva ejecución ni cambia los resultados históricos.

El documento contiene los procedimientos, fragmentos relevantes, condiciones y resultados necesarios para su lectura independiente. Los JSON conservan el detalle de 305 comprobaciones: 303 conformes,28 de 30 casos aprobados. CN-18 y CB-05 presentan el mismo defecto de edad. La cobertura381/419 corresponde únicamente a 24 funciones Python seleccionadas.

## Archivos

- `blackbox_api.py` y `blackbox_ui.cjs`: solicitudes HTTP y recorridos reales de interfaz.
- `whitebox_python.py` y `whitebox_frontend.cjs`: comprobaciones dirigidas de funciones Python y TypeScript; los dobles de prueba se declaran en el código y en el informe.
- `qa_server.py`: aislamiento mediante un esquema PostgreSQL temporal y el código original del backend.
- `finish_verification.py`, `consolidate_results.py` y `cleanup_verify.py`: comprobación complementaria, consolidación y retiro del esquema temporal.
- `*_results.json`, `merged_cases.json` y `results_summary.json`: resultados históricos; no se regeneraron al preparar el anexo.
- `evidence/`:capturas originales y PDF realmente descargado de la aplicación.
- `logs/`:salidas originales de los ejecutores de caja blanca, sin convertirlas en pantallazos artificiales.
- `muestras/`:cuatro DICOM públicos referenciados por el selector original. Las pruebas funcionales del informe emplearon S01, S02 y S03; S04 se conserva como referencia auxiliar y no amplía la muestra declarada.
- `referencias_sha256.json`:huellas del código original y de las copias con rutas portables. Los resultados solo normalizan rutas de capturas para ubicarlas en esta carpeta.

## Condiciones de uso

Son referencias históricas de una ejecución controlada, no una batería que se ejecute automáticamente. No se incluyen credenciales ni configuración privada. `qa_server.py` genera `private_config.json` con credenciales temporales y un esquema único cuando se prepara una nueva evaluación; ese archivo se ignora en Git. Los scripts que dependen de él requieren primero dicho entorno y las dependencias del backend. Las pruebas del navegador requieren Playwright y Brave; no se añadieron dependencias al producto.

Las rutas de proyecto se resuelven desde esta carpeta. Las muestras se referencian respecto de la raíz del proyecto; cualquier ejecución posterior debe iniciarse desde esa raíz. Los resultados actuales deben respaldarse antes de una nueva ejecución. El retiro del esquema temporal solo admite el prefijo y formato comprobados por el ejecutor. No se ejecutó ningún servicio ni se modificó la base de datos al incorporar estas referencias.
