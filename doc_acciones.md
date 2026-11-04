## Bitacora Tecnica de Funcionalidades

### Regla Operativa
Desde esta entrega, despues de cada funcionalidad solicitada, este documento se actualiza con:
- Titulo de funcionalidad.
- Pasos numerados en orden real de implementacion.

1. **backend/app/core/config.py**: Se agregaron `JWT_SECRET_KEY` y `JWT_EXPIRE_MINUTES` para centralizar la configuración del token de acceso y controlar su expiración desde settings.

2. **backend/app/core/security.py**: Se implementó la generación de JWT básico con firma HS256 usando librerías nativas de Python para emitir tokens de login sin añadir dependencias externas.

3. **backend/app/modules/usuarios/schemas.py**: Se crearon los esquemas `LoginRequest` y `TokenResponse` para estandarizar la entrada de credenciales y la salida del token en la ruta de autenticación.

4. **backend/app/modules/usuarios/service.py**: Se añadió `authenticate_usuario` para validar correo, estado activo y password contra la tabla `usuarios` en PostgreSQL con una verificación directa y simple.

5. **backend/app/modules/usuarios/router.py**: Se creó la ruta `POST /usuarios/login` para recibir credenciales, validar usuario y devolver un token JWT cuando la autenticación es correcta.

6. **backend/app/main.py**: Se habilitó CORS para permitir solicitudes desde el frontend de Vite durante desarrollo y evitar bloqueos entre puertos distintos.

7. **frontend/src/services/api.js**: Se implementó `loginRequest` con `fetch` para conectar el frontend con `POST /usuarios/login` y centralizar la llamada HTTP del login.

8. **frontend/src/pages/Login.jsx**: Se conectó el formulario de login al backend, se guardó el `access_token` en `localStorage`, se agregó manejo básico de error y se redirigió a `/dashboard` tras autenticación exitosa.

9. **frontend/src/App.jsx**: Se agregó la ruta `/dashboard` al panel principal y se dejó `/panel` como redirección para mantener compatibilidad con rutas previas.

10. **backend/app/main.py**: Se ajustó CORS con `allow_origin_regex` para aceptar puertos variables de `localhost` y evitar fallos cuando Vite cambia de puerto automáticamente.

11. **backend/app/modules/usuarios/schemas.py**: Se corrigió la inconsistencia entre schema y modelo cambiando el alta de usuario para usar campos reales (`nombre_completo`, `rol`, `username`) en lugar de `nombre`, que no existe en la entidad `Usuario`.

12. **backend/app/modules/usuarios/service.py**: Se corrigió `create_usuario` para mapear correctamente los campos del modelo (`username`, `nombre_completo`, `rol`, `created_at`) y eliminar el error `TypeError: 'nombre' is an invalid keyword argument for Usuario`.

### Funcionalidad: Cerrar sesion funcional y datos de usuario logueado desde BD

1. **backend/app/core/security.py**: Se agrego la decodificacion y validacion del JWT (`decode_access_token`) para verificar firma y expiracion antes de identificar al usuario autenticado.

2. **backend/app/modules/usuarios/service.py**: Se agrego `get_usuario_by_id` para recuperar desde PostgreSQL el usuario asociado al `usuario_id` del token.

3. **backend/app/modules/usuarios/router.py**: Se creo `GET /usuarios/me` para leer el Bearer token, validarlo y devolver el usuario logueado desde base de datos.

4. **frontend/src/services/api.js**: Se agregaron `getStoredToken` y `getCurrentUsuario` para consumir `/usuarios/me` usando el token guardado en `localStorage`.

5. **frontend/src/pages/PanelMedico.jsx**: Se implemento carga del usuario autenticado al montar la vista; el saludo ya no usa texto fijo y ahora muestra el `nombre_completo` real.

6. **frontend/src/components/dashboard/Sidebar.jsx**: Se reemplazo el perfil en crudo por datos dinamicos del usuario logueado (`nombre_completo`, `rol`, iniciales).

7. **frontend/src/components/dashboard/Sidebar.jsx**: Se hizo funcional el boton "Cerrar Sesion" para eliminar el token local y redirigir a `/login`.

### Funcionalidad: Refactor visual SaaS Medico Profesional del panel

1. **frontend/src/pages/PanelMedico.jsx**: Se aplico una paleta mas sobria en KPIs y acciones rapidas, se mejoro la jerarquia tipografica del encabezado y se ajustaron espaciados para un layout mas profesional sin cambiar la logica existente.

2. **frontend/src/components/dashboard/MetricCard.jsx**: Se rediseñaron las tarjetas de metricas con bordes mas elegantes (`rounded-xl`), sombras suaves y enfoque visual en los valores KPI usando subtitulos menos dominantes.

3. **frontend/src/components/dashboard/QuickActionButton.jsx**: Se actualizo el estilo de botones a un enfoque minimalista con fondo blanco, borde sutil y estados hover de acento medico, manteniendo intacta la interfaz de props y su uso.

4. **frontend/src/components/dashboard/Sidebar.jsx**: Se modernizo el sidebar con tonos `slate` sobrios, estado activo en `teal`, avatar mas limpio y refinamiento de tipografia para una apariencia premium.

5. **frontend/src/components/dashboard/WeeklyActivityChart.jsx**: Se ajusto el contenedor y la presentacion visual de Recharts (grid, tooltip, leyenda y colores de barras) para un look mas ejecutivo sin tocar la libreria ni su logica de render.

### Funcionalidad: Alerta al intentar entrar al panel sin autenticacion

1. **frontend/src/components/AuthRequired.jsx**: Se creo un panel de alerta simple para informar al usuario que primero debe iniciar sesion antes de acceder al panel.

2. **frontend/src/components/ProtectedRoute.jsx**: Se creo un guard de ruta minimo que valida existencia de token en `localStorage`; si no existe, renderiza la alerta de acceso restringido.

3. **frontend/src/App.jsx**: Se protegieron las rutas `/dashboard` y `/panel` con `ProtectedRoute` para que al ingresar por URL sin sesion se muestre el mensaje de autenticacion requerida.

### Funcionalidad: Migracion visual del login desde pneumonia-insight-main sin romper autenticacion actual

1. **pneumonia-insight-main/src/pages/Login.tsx**: Se reviso el login de referencia para identificar su estructura visual (panel izquierdo de marca y panel derecho con formulario) y definir que elementos se iban a trasladar al frontend principal.

2. **frontend/src/pages/Login.jsx**: Se reemplazo la maqueta visual anterior por una interfaz basada en el login de referencia, manteniendo el formulario en la misma pantalla de acceso y mejorando la presentacion para desktop y mobile.

3. **frontend/src/pages/Login.jsx**: Se conservaron sin cambios funcionales la autenticacion real contra backend (`loginRequest`), el guardado de `access_token` en `localStorage`, la redireccion a `/dashboard` y el manejo de errores de inicio de sesion.

4. **frontend/src/pages/Login.jsx**: Se agrego control local para mostrar u ocultar la contraseña con estado simple (`showPassword`) para mejorar usabilidad sin introducir librerias nuevas ni alterar la logica de autenticacion.

5. **frontend/src/pages/Login.jsx**: Se elimino el acceso directo al panel que evitaba el flujo normal de autenticacion para dejar el ingreso al dashboard unicamente por login exitoso.

6. **frontend/src/pages/Login.jsx**: Se corrigio el cierre de etiquetas JSX del contenedor principal del formulario para resolver el error de compilacion detectado durante la validacion.

7. **frontend/package.json**: Se valido la integracion ejecutando el script de build del frontend para confirmar que el login nuevo compila correctamente con la funcionalidad existente.

### Funcionalidad: Migracion visual del dashboard de pneumonia-insight-main hacia la ruta /panel

1. **pneumonia-insight-main/src/pages/Dashboard.tsx**: Se analizo el dashboard de referencia para replicar su estructura visual principal (topbar, tarjetas KPI, lista de casos y panel lateral) dentro del frontend del proyecto actual.

2. **frontend/src/pages/PanelMedico.jsx**: Se rediseño completamente la vista del panel para que adopte la misma linea visual del dashboard de referencia, manteniendo la ruta existente `/panel` sin cambiar el flujo de navegacion actual.

3. **frontend/src/pages/PanelMedico.jsx**: Se mantuvo la funcionalidad de autenticacion ya implementada (`getCurrentUsuario` con token), incluyendo la carga del usuario logueado desde backend y la redireccion a `/login` cuando la sesion no es valida.

4. **frontend/src/pages/PanelMedico.jsx**: Se agrego un manejador explicito de cierre de sesion (`handleLogout`) para limpiar `access_token` y regresar al login desde el nuevo layout visual.

5. **frontend/src/pages/PanelMedico.jsx**: Se incorporo filtrado local por texto para la seccion de casos recientes con el objetivo de conservar una interaccion util del panel sin depender de librerias adicionales.

6. **frontend/src/pages/PanelMedico.jsx**: Se limpiaron constantes e imports heredados que ya no se usaban para evitar referencias inconsistentes y mantener el archivo legible.

7. **frontend/package.json**: Se valido la migracion visual del panel ejecutando build de frontend y confirmando compilacion exitosa sin romper la funcionalidad existente.

### Funcionalidad: Correccion de fidelidad visual del panel para igualar dashboard original

1. **frontend/package.json**: Se agrego `framer-motion` para replicar las animaciones del dashboard original y mantener el mismo comportamiento visual de entrada en secciones.

2. **frontend/src/pages/PanelMedico.jsx**: Se rehizo la vista de `/panel` tomando como base directa la estructura de `Dashboard.tsx` (top nav, bloque de bienvenida, tarjetas KPI, casos recientes y panel lateral) para igualar layout, iconografia y jerarquia tipografica.

3. **frontend/src/pages/PanelMedico.jsx**: Se conservaron las funciones existentes de sesion del proyecto (`getCurrentUsuario`, validacion de token, redireccion a `/login`) para no perder consumo de backend ni flujo de autenticacion.

4. **frontend/src/pages/PanelMedico.jsx**: Se mantuvo cierre de sesion funcional con limpieza de `access_token` y salida a login desde el nuevo header.

5. **frontend/src/pages/PanelMedico.jsx**: Se agregaron comentarios tecnicos en los bloques funcionales nuevos para dejar claro para que sirve cada parte agregada.

6. **frontend/src/index.css**: Se reemplazo la base visual global por tokens, tipografias y gradientes del proyecto original para que el panel herede fondo, colores y fuentes acordes al dashboard fuente.

7. **frontend/package.json**: Se valido la correccion ejecutando build del frontend y confirmando compilacion exitosa tras los cambios.

### Funcionalidad: Migracion completa del flujo de diagnostico desde pneumonia-insight-main

1. **pneumonia-insight-main/src/pages/Diagnosis.tsx**: Se analizo el flujo original por pasos (radiografia, datos del paciente, signos vitales y antecedentes) para trasladarlo completo al frontend del proyecto principal.

2. **frontend/src/pages/Diagnostico.jsx**: Se creo la nueva vista `Diagnostico` en la ruta `/diagnostico` replicando el proceso completo del origen, incluyendo stepper, carga de radiografia por drag and drop, captura de datos clinicos y navegacion entre pasos.

3. **frontend/src/pages/Diagnostico.jsx**: Se agrego estado de formulario para conservar los datos ingresados en todo el proceso y enviar un payload de resumen al finalizar en "Analizar con IA".

4. **frontend/src/pages/Resultados.jsx**: Se creo la vista `Resultados` para completar el flujo end-to-end de diagnostico con resultado presuntivo, hallazgos, resumen del paciente y recomendaciones, reutilizando los datos capturados en `/diagnostico`.

5. **frontend/src/App.jsx**: Se registraron rutas protegidas nuevas `/diagnostico` y `/resultados`, mas alias de compatibilidad (`/diagnosis` y `/results`) para mantener comportamiento equivalente al proyecto fuente.

6. **frontend/src/pages/PanelMedico.jsx**: Se conectaron los botones "Nuevo Analisis", "Nuevo Diagnostico" y "Nuevo diagnostico" para redirigir directamente a `/diagnostico`, como parte del flujo operativo del panel.

7. **frontend/package.json**: Se valido la integracion completa ejecutando build del frontend y confirmando compilacion exitosa despues de agregar las nuevas pantallas y rutas.

### Funcionalidad: Ajuste de fidelidad visual de formularios en diagnostico

1. **pneumonia-insight-main/src/components/ui/input.tsx**: Se revisaron las clases base originales de `Input` para igualar tipografia, borde, altura y estados de foco en el formulario migrado.

2. **pneumonia-insight-main/src/components/ui/textarea.tsx**: Se tomaron como referencia los estilos base de `Textarea` para replicar estructura visual, placeholder y enfoque en campos multilina.

3. **pneumonia-insight-main/src/components/ui/select.tsx**: Se comparo el estilo del `SelectTrigger` original para ajustar el `select` nativo del proyecto actual con bordes, altura y ring consistentes.

4. **pneumonia-insight-main/src/components/ui/checkbox.tsx**: Se uso la referencia visual del checkbox original para alinear tamano, borde y estado marcado en la seccion de enfermedades cronicas.

5. **frontend/src/pages/Diagnostico.jsx**: Se unificaron clases base reutilizables de formulario (input, textarea, select y botones) para que la apariencia de campos sea fiel al proyecto fuente en todos los pasos del proceso.

6. **frontend/src/index.css**: Se agregaron tokens de tema faltantes (`popover`, `input`, `ring`) para soportar correctamente los estilos de formulario heredados del diseño original.

7. **frontend/package.json**: Se valido el ajuste visual ejecutando build del frontend y confirmando compilacion exitosa luego de los cambios de estilo.

### Funcionalidad: Edad automatica desde calendario en datos del paciente

1. **frontend/src/pages/Diagnostico.jsx**: Se reemplazo el campo manual de edad por `fecha_nacimiento` usando selector de fecha (`input type="date"`) en la seccion "Datos del Paciente".

2. **frontend/src/pages/Diagnostico.jsx**: Se agrego calculo automatico de edad en anios a partir de la fecha seleccionada para evitar ingreso manual y reducir errores de captura.

3. **frontend/src/pages/Diagnostico.jsx**: Se mostro en la UI, junto al calendario, el texto dinamico "Edad calculada: X anios" para dar feedback inmediato al usuario.

4. **frontend/src/pages/Diagnostico.jsx**: Se ajusto el payload final del proceso para mantener el campo `edad` derivado automaticamente y conservar compatibilidad con la vista de resultados.

5. **frontend/package.json**: Se valido la modificacion ejecutando build del frontend y confirmando compilacion exitosa.

### Funcionalidad: Catalogo dinamico de enfermedades desde BD en /diagnostico

1. **backend/app/modules/enfermedades/models.py**: Se creo la entidad `Enfermedad` mapeada a la tabla `enfermedades` para exponer el catalogo desde SQLAlchemy.

2. **backend/app/modules/enfermedades/schemas.py**: Se definio el esquema de salida `EnfermedadRead` para serializar `id` y `nombre` en la respuesta de API.

3. **backend/app/modules/enfermedades/service.py**: Se agrego `get_enfermedades` para consultar y ordenar alfabeticamente el catalogo de enfermedades desde PostgreSQL.

4. **backend/app/modules/enfermedades/router.py**: Se creo la ruta `GET /enfermedades/` como endpoint de solo lectura para alimentar los checkboxes del formulario de antecedentes clinicos.

5. **backend/app/api/router.py**: Se registraron las rutas del nuevo modulo de enfermedades dentro del `api_router` principal.

6. **backend/app/main.py**: Se importaron los modelos de enfermedades en el arranque para asegurar que SQLAlchemy incluya la tabla en metadatos al ejecutar `create_all`.

7. **frontend/src/services/api.js**: Se agrego `getEnfermedadesRequest` para consumir `GET /enfermedades/` y centralizar la llamada HTTP del catalogo.

8. **frontend/src/pages/Diagnostico.jsx**: Se reemplazo la lista hardcodeada de enfermedades por carga dinamica desde backend con estados de carga y error, manteniendo la seleccion de checkboxes y el payload final del diagnostico.

9. **frontend/src/pages/Diagnostico.jsx**: Se ajustaron clases de altura en textareas para eliminar advertencias de estilo y mantener consistencia con la configuracion de Tailwind del proyecto.

10. **frontend/package.json**: Se valido la integracion ejecutando build del frontend y confirmando compilacion exitosa.

### Funcionalidad: Registro funcional de diagnostico en BD con carga de radiografia

1. **backend/app/modules/diagnosticos/models.py**: Se creo el nuevo modulo de diagnosticos con modelos `Paciente`, `Diagnostico` y `PacienteEnfermedad` para mapear tablas existentes y poder persistir el formulario completo desde API.

2. **backend/app/modules/diagnosticos/service.py**: Se implemento la logica de negocio para guardar la radiografia en carpeta local por defecto (`backend/uploads/radiografias`), crear/actualizar paciente por expediente, sincronizar enfermedades seleccionadas y registrar el diagnostico en BD.

3. **backend/app/modules/diagnosticos/router.py**: Se creo `POST /diagnosticos/` con `multipart/form-data` para recibir imagen + datos del formulario, validar JWT del usuario autenticado y ejecutar el guardado transaccional.

4. **backend/app/modules/diagnosticos/schemas.py**: Se definio `DiagnosticoCreateResponse` para responder con ids creados y ruta de imagen persistida.

5. **backend/app/api/router.py**: Se registro el router del nuevo modulo de diagnosticos en el enrutador principal de la API.

6. **backend/app/main.py**: Se importaron los modelos del modulo diagnosticos y se monto la ruta estatica `/uploads` para servir las imagenes guardadas en disco.

7. **frontend/src/services/api.js**: Se agrego `createDiagnosticoRequest` para enviar `FormData` al endpoint `POST /diagnosticos/` con token Bearer y manejo de errores de respuesta.

8. **frontend/src/pages/Diagnostico.jsx**: Se conecto el boton "Analizar con IA" al guardado real en backend, incluyendo envio de archivo de radiografia, datos clinicos, enfermedades seleccionadas y estados de carga/error en UI.

9. **frontend/src/pages/Diagnostico.jsx**: Se ajusto la gestion local de imagen para conservar tanto preview base64 como archivo original (`imageFile`) necesario para subir a servidor.

10. **frontend/package.json**: Se valido la integracion ejecutando build del frontend y confirmando compilacion exitosa con el flujo funcional de registro.

### Funcionalidad: Correccion de timestamps en persistencia de paciente y diagnostico

1. **backend/app/modules/diagnosticos/models.py**: Se ajustaron `created_at` (pacientes), `fecha_registro` y `updated_at` (diagnosticos) con `server_default=func.now()` y `nullable=False` para que la BD aplique marca de tiempo automaticamente.

2. **backend/app/modules/diagnosticos/service.py**: Se agrego asignacion explicita de `created_at` al crear un paciente nuevo para cubrir escenarios donde el esquema previo no aplique default en runtime.

3. **backend/app/modules/diagnosticos/service.py**: Se agrego asignacion explicita de `fecha_registro` y `updated_at` al crear diagnostico para evitar inserciones en `NULL` y garantizar trazabilidad temporal.

4. **backend/app/modules/diagnosticos/models.py**: Se incorporo `func` de SQLAlchemy para usar `now()` del motor de BD como fuente de timestamp por defecto.

5. **backend/app/modules/diagnosticos/service.py**: Se mantuvo intacta la logica de guardado de imagen y datos clinicos, aplicando solo correccion puntual en campos de fecha/hora.

### Funcionalidad: Casos recientes funcionales desde base de datos en panel

1. **backend/app/modules/diagnosticos/schemas.py**: Se agrego `DiagnosticoRecienteItem` para estandarizar la salida del listado de casos recientes con datos de paciente y metadatos clinicos.

2. **backend/app/modules/diagnosticos/service.py**: Se implemento `get_recent_diagnosticos` con consulta real a BD (join diagnosticos + pacientes), orden descendente por fecha y mapeo de campos necesarios para UI.

3. **backend/app/modules/diagnosticos/service.py**: Se agregaron utilidades para calcular edad desde `fecha_nacimiento` y derivar estado visual (`positive/negative`) a partir del `resultado_ia`.

4. **backend/app/modules/diagnosticos/router.py**: Se creo `GET /diagnosticos/recientes` protegido con JWT para exponer los ultimos diagnosticos registrados.

5. **frontend/src/services/api.js**: Se agrego `getRecentDiagnosticosRequest` para consumir el endpoint real de casos recientes con token de sesion.

6. **frontend/src/pages/PanelMedico.jsx**: Se reemplazo la lista mock de "Casos Recientes" por carga dinamica desde backend, incluyendo buscador, estados de carga/error y fallback cuando no existen registros.

7. **frontend/src/pages/PanelMedico.jsx**: Se agrego formateo de fecha relativa para mostrar recencia (minutos, horas, ayer, dias) usando `fecha_registro` proveniente de BD.

8. **frontend/src/pages/PanelMedico.jsx**: Se ajustaron utilidades de clases para eliminar advertencias de estilo sin afectar comportamiento ni diseño.

9. **frontend/package.json**: Se valido la integracion ejecutando build del frontend y confirmando compilacion exitosa con consumo real de casos recientes.

### Funcionalidad: Ajuste backend de registro/login por cambio en tabla usuarios

1. **backend/app/modules/usuarios/models.py**: Se actualizo el mapeo ORM de `usuarios` para usar tipos consistentes con la tabla actual (`ultimo_login` como `DateTime`) y eliminar columnas de auditoria que no son necesarias para autenticar.

2. **backend/app/modules/usuarios/service.py**: Se corrigio `create_usuario` para registrar usuarios sin depender de `created_at`, evitando errores cuando la estructura activa de la tabla cambia a `updated_at`.

3. **backend/app/modules/usuarios/service.py**: Se mejoro `authenticate_usuario` para guardar `ultimo_login` al validar credenciales correctas, manteniendo el flujo de login simple y trazable.

4. **backend/app/modules/usuarios/router.py**: Se mantuvo la ruta `POST /usuarios/login` sin cambios de contrato para no romper el frontend mientras se adapta internamente a la nueva estructura de BD.

5. **backend/app/modules/usuarios/schemas.py**: Se conservaron los esquemas de entrada/salida de login y registro para que las pruebas funcionales de registro y autenticacion sigan con el mismo payload esperado.

### Funcionalidad: Validacion secuencial de pasos en flujo /diagnostico

1. **frontend/src/pages/Diagnostico.jsx**: Se agrego validacion por paso para bloquear el avance si el paso actual no esta completo (radiografia en paso 1, datos minimos del paciente en paso 2 y signos vitales clave en paso 3).

2. **frontend/src/pages/Diagnostico.jsx**: Se unifico la navegacion del stepper y del boton "Siguiente" para que ambos usen la misma logica (`attemptStepChange`) y no permitan saltar pasos incompletos.

3. **frontend/src/pages/Diagnostico.jsx**: Se implemento mensaje de error contextual (`stepError`) para indicar exactamente que campo o requisito falta antes de continuar.

4. **frontend/src/pages/Diagnostico.jsx**: Se agregaron comentarios tecnicos cortos en primera persona sobre la validacion de pasos y el bloqueo de saltos para facilitar mantenimiento y futuros cambios.

### Funcionalidad: Alineacion backend con estructura actualizada de bd.sql

1. **backend/app/modules/diagnosticos/models.py**: Se renombro el campo ORM `comentario_medico` a `diagnostico_descripcion` para coincidir con la columna real de la tabla `diagnosticos`.

2. **backend/app/modules/diagnosticos/models.py**: Se mapearon columnas nuevas de resultados IA (`confianza_radiografica`, `confianza_clinica`, `confianza_riesgo`, `hallazgos_json`) para mantener compatibilidad con el esquema SQL actualizado.

3. **backend/app/modules/usuarios/service.py**: Se agrego normalizacion de `rol` antes de guardar usuario para ajustar valores comunes (`medico`, `médico`, etc.) al enum exacto definido en PostgreSQL (`Admin`, `Médico`, `Especialista`).

4. **backend/app/modules/usuarios/service.py**: Se incorporo comentario tecnico corto en primera persona en la normalizacion del rol para dejar claro el objetivo de compatibilidad con BD.

### Funcionalidad: Simulacion aleatoria de resultado clinico en /resultados (sin IA)

1. **frontend/src/pages/Resultados.jsx**: Se reemplazo el titulo fijo "Neumonia Bacteriana" por salida simulada aleatoria entre "Hallazgos Compatibles con Neumonia" y "Sin Hallazgos de Neumonia".

2. **frontend/src/pages/Resultados.jsx**: Se hizo dinamico el badge superior para mostrar "Diagnostico Presuntivo Positivo" o "Diagnostico Presuntivo Negativo" segun el resultado aleatorio.

3. **frontend/src/pages/Resultados.jsx**: Se reemplazo el texto descriptivo por "Prioridad: ..." con valores aleatorios condicionados al resultado (Alta/Moderada/Baja cuando hay hallazgos; Ninguna cuando no hay hallazgos).

4. **frontend/src/pages/Resultados.jsx**: Se randomizo el porcentaje central de "Nivel de confianza" y el "Desglose de confianza" en las tres metricas del template para simular comportamiento de IA.

5. **frontend/src/pages/Resultados.jsx**: Se agrego comentario tecnico corto en primera persona en el bloque de simulacion para identificar claramente que es una logica temporal hasta integrar IA real.

6. **frontend/src/pages/Resultados.jsx**: Se adaptaron hallazgos y recomendaciones para mantener coherencia visual/clinica con el resultado aleatorio positivo o negativo.

### Funcionalidad: Compatibilidad temporal con BD sin columnas IA nuevas en diagnosticos

1. **backend/app/modules/diagnosticos/service.py**: Se reemplazo la consulta de `get_recent_diagnosticos` para traer solo columnas necesarias (seleccion explicita) y evitar `SELECT` de columnas no existentes en instancias de BD aun no migradas.

2. **backend/app/modules/diagnosticos/service.py**: Se ajusto el mapeo del resultado de consulta para usar campos directos (`dni`, `nombres_apellidos`, `fecha_nacimiento`) sin depender de la entidad completa.

3. **backend/app/modules/diagnosticos/service.py**: Se cambio `db.refresh(diagnostico)` por refresh parcial de atributos (`id`, `paciente_id`, `imagen_url`) para no solicitar columnas opcionales nuevas mientras no existan en la BD activa.

4. **backend/app/modules/diagnosticos/service.py**: Se agregaron comentarios tecnicos cortos en primera persona para documentar que el ajuste es de compatibilidad temporal.

### Funcionalidad: Persistencia de resultado simulado en BD y consumo real en /resultados

1. **backend/app/modules/diagnosticos/service.py**: Se movio la simulacion de resultado (positivo/negativo), prioridad derivada, nivel de confianza, desglose de confianza y hallazgos desde frontend hacia backend para generar datos consistentes al crear el diagnostico.

2. **backend/app/modules/diagnosticos/service.py**: Se guardaron en tabla `diagnosticos` los campos adicionales del resultado (`resultado_ia`, `nivel_gravedad_ia`, `probabilidad_ia`, `confianza_radiografica`, `confianza_clinica`, `confianza_riesgo`, `hallazgos_json`, `diagnostico_descripcion`).

3. **backend/app/modules/diagnosticos/service.py**: Se agrego `get_diagnostico_resultado` para devolver al frontend el resultado completo del diagnostico, incluyendo resumen de paciente, desglose, hallazgos y recomendaciones.

4. **backend/app/modules/diagnosticos/router.py**: Se creo `GET /diagnosticos/{diagnostico_id}/resultado` protegido con JWT para que la vista de resultados consulte los datos reales guardados en BD.

5. **backend/app/modules/diagnosticos/router.py**: Se refactorizo la extraccion de usuario autenticado en helper reutilizable para evitar duplicacion en rutas del modulo.

6. **backend/app/modules/diagnosticos/schemas.py**: Se ampliaron schemas para respuesta de creacion y detalle de resultados con estructuras tipadas (`DiagnosticoResultadoResponse`, desglose, hallazgos y paciente).

7. **frontend/src/services/api.js**: Se agrego `getDiagnosticoResultadoRequest` para consumir el endpoint de resultado por id de diagnostico.

8. **frontend/src/pages/Diagnostico.jsx**: Se ajusto la navegacion a `/resultados` para enviar `diagnostico_id` y permitir que la pantalla cargue informacion desde backend.

9. **frontend/src/pages/Resultados.jsx**: Se elimino la simulacion local y se implemento carga real desde backend con estados de carga/error y render dinamico de resultado, prioridad, confianza, hallazgos y recomendaciones.

10. **frontend/src/pages/Resultados.jsx**: Se incorporo mapeo visual de color para barras de desglose en frontend manteniendo estilo original sin depender de clases CSS enviadas por API.

### Funcionalidad: Validacion avanzada de rangos con alertas en /diagnostico

1. **frontend/src/pages/Diagnostico.jsx**: Se agregaron utilidades de validacion numerica (`parseNumber`, `isInRange`) para aplicar rangos clinicos de forma consistente en los campos del formulario.

2. **frontend/src/pages/Diagnostico.jsx**: Se reforzo validacion de "Datos del Paciente" con reglas de edad (minimo 14, maximo 125), fecha valida, peso en rango y motivo de consulta obligatorio.

3. **frontend/src/pages/Diagnostico.jsx**: Se reforzo validacion de "Signos Vitales" con rangos para temperatura, frecuencia cardiaca, frecuencia respiratoria, saturacion O2 y tiempo de evolucion.

4. **frontend/src/pages/Diagnostico.jsx**: Se valido formato y coherencia de presion arterial (`SYS/DIA`) con rangos realistas y condicion sistolica mayor que diastolica.

5. **frontend/src/pages/Diagnostico.jsx**: Se agrego alerta emergente (`window.alert`) al bloquear avance por datos invalidos, ademas del mensaje contextual en pantalla.

6. **frontend/src/pages/Diagnostico.jsx**: Se actualizaron etiquetas en UI para mostrar rangos esperados entre parentesis y mejorar la guia al usuario durante captura.

7. **frontend/src/pages/Diagnostico.jsx**: Se agrego comentario tecnico corto en primera persona en la seccion de alerta para documentar el proposito del comportamiento.

### Funcionalidad: Mejora UX de validaciones en /diagnostico y normalizacion de texto "años"

1. **frontend/src/pages/Diagnostico.jsx**: Se reemplazo el `window.alert` por una notificacion visual tipo toast dentro de la interfaz, con cierre manual y autocierre, para mostrar errores de validacion sin ventana emergente del navegador.

2. **frontend/src/pages/Diagnostico.jsx**: Se elimino del label de fecha de nacimiento el texto "(edad 14-125 años)", manteniendo la validacion de rango en logica interna.

3. **frontend/src/pages/Diagnostico.jsx**: Se corrigieron textos de edad para mostrar "años" (en lugar de "anos/anios") en mensajes y ayuda visual.

4. **frontend/src/pages/PanelMedico.jsx**: Se corrigio la etiqueta de edad en casos recientes para mostrar "años".

5. **frontend/src/pages/Resultados.jsx**: Se corrigio la etiqueta "Edad / Sexo" para mostrar "años".

### Funcionalidad: Integracion de columna `enfermo` en flujo de diagnosticos

1. **backend/app/modules/diagnosticos/models.py**: Se agrego el campo ORM `enfermo` (`Boolean`) en `Diagnostico` para mapear la nueva columna de BD y alinear estado positivo/negativo persistido.

2. **backend/app/modules/diagnosticos/service.py**: Se actualizo inferencia de estado para priorizar `enfermo` como fuente principal y mantener fallback por `resultado_ia` para compatibilidad.

3. **backend/app/modules/diagnosticos/service.py**: Se ajusto simulacion backend para devolver `enfermo` y se persiste ese valor al crear cada diagnostico.

4. **backend/app/modules/diagnosticos/service.py**: Se incluyo `enfermo` en respuestas de "recientes" y "resultado detallado" para que frontend y API tengan consistencia semantica del estado.

5. **backend/app/modules/diagnosticos/schemas.py**: Se ampliaron schemas (`DiagnosticoCreateResponse`, `DiagnosticoRecienteItem`, `DiagnosticoResultadoResponse`) para exponer `enfermo` en las respuestas tipadas.

6. **backend/app/modules/diagnosticos/router.py**: Se incluyo `enfermo` en la respuesta de `POST /diagnosticos/` para mantener coherencia con el nuevo esquema de salida.

### Funcionalidad: Ver detalle de caso reciente desde dashboard

1. **frontend/src/pages/PanelMedico.jsx**: Se conecto el click en cada item de "Casos Recientes" para navegar a `/resultados` con `diagnostico_id` del registro seleccionado.

2. **frontend/src/pages/PanelMedico.jsx**: Se envio `diagnostico_id` tanto por `state` como por query string para mejorar robustez de navegacion y soportar recarga de pagina.

3. **frontend/src/pages/Resultados.jsx**: Se actualizo la lectura de `diagnostico_id` para aceptar origen desde `location.state` o desde query string (`?diagnostico_id=`) y cargar los datos reales desde backend.

### Funcionalidad: Historial moderno desde boton del dashboard

1. **frontend/src/pages/Historial.jsx**: Se creo una nueva vista dedicada para historial con interfaz moderna, resumen de metricas visibles, buscador por paciente/expediente, filtros por estado (todos/positivos/negativos) y paginacion.

2. **frontend/src/pages/Historial.jsx**: Se conecto la carga de datos reales usando `getRecentDiagnosticosRequest(120)` para permitir exploracion amplia del historial y navegacion a detalle con `diagnostico_id` por state + query string.

3. **frontend/src/App.jsx**: Se registro la nueva ruta protegida `/historial` para que solo usuarios autenticados puedan acceder al historial completo.

4. **frontend/src/pages/PanelMedico.jsx**: Se hizo funcional el boton superior "Historial" para navegar directamente a `/historial` desde el dashboard.

5. **frontend/src/pages/PanelMedico.jsx**: Se conecto la accion rapida "Historial completo" para abrir la misma vista `/historial` y mantener consistencia de accesos.

### Funcionalidad: DNI obligatorio de 8 digitos en Datos del Paciente

1. **frontend/src/pages/Diagnostico.jsx**: Se cambio la etiqueta del campo de "ID / Expediente" a "DNI" en el paso "Datos del Paciente" para alinear la captura con el requerimiento operativo.

2. **frontend/src/pages/Diagnostico.jsx**: Se restringio la entrada del campo a solo numeros y maximo 8 caracteres (`replace(/\D/g, '')` + `slice(0, 8)`), con teclado numerico en mobile (`inputMode=\"numeric\"`).

3. **frontend/src/pages/Diagnostico.jsx**: Se agrego validacion estricta de formato (`^\\d{8}$`) en la validacion del paso 2 para bloquear avance si el DNI no tiene exactamente 8 digitos.

4. **frontend/src/pages/Diagnostico.jsx**: Se actualizo el mensaje de error contextual para mostrar "DNI no valido: debe tener exactamente 8 digitos" cuando no cumpla longitud/formato.

5. **frontend/src/pages/Diagnostico.jsx**: Se mantuvo la clave `expediente_id` en el payload por compatibilidad con el contrato actual de API, documentando en comentario tecnico que ahora transporta el DNI validado.

### Funcionalidad: Carga de 1 a 4 radiografias y registro completo en BD

1. **frontend/src/pages/Diagnostico.jsx**: Se reemplazo la carga unica por seleccion multiple de radiografias (drag and drop + selector), permitiendo entre 1 y 4 imagenes por diagnostico.

2. **frontend/src/pages/Diagnostico.jsx**: Se agrego previsualizacion en grilla de todas las imagenes cargadas, con eliminacion individual y limpieza total, manteniendo la experiencia actual del paso 1.

3. **frontend/src/pages/Diagnostico.jsx**: Se reforzo validacion de paso y envio para exigir al menos 1 imagen y bloquear mas de 4, con mensajes de error y notificacion visual.

4. **frontend/src/services/api.js**: Se ajusto el armado de `FormData` para soportar campos tipo arreglo y enviar `imagen_files` como multiples partes del formulario.

5. **backend/app/modules/diagnosticos/router.py**: Se actualizo `POST /diagnosticos/` para aceptar `imagen_files` (lista) y mantener compatibilidad con el campo legado `imagen_file`.

6. **backend/app/modules/diagnosticos/models.py**: Se agrego la entidad `DiagnosticoImagen` y relacion con `Diagnostico` para persistir todas las imagenes asociadas (ordenadas) en una tabla dedicada.

7. **backend/app/modules/diagnosticos/service.py**: Se modifico la creacion del diagnostico para guardar todas las URLs de imagen (maximo 4), conservar `imagen_url` principal para compatibilidad y registrar cada archivo en `diagnostico_imagenes`.

8. **backend/app/modules/diagnosticos/schemas.py**: Se ampliaron respuestas para exponer `imagenes_url` en la creacion y en el detalle de resultado.

9. **bd.sql**: Se agrego la tabla `diagnostico_imagenes` con `diagnostico_id`, `imagen_url`, `orden` y `created_at` para soportar persistencia de multiples radiografias por diagnostico.

### Ajuste tecnico: Correccion de duplicado de previews en carga multiple

1. **frontend/src/pages/Diagnostico.jsx**: Se refactorizo la funcion de carga multiple para evitar efectos secundarios dentro del updater de estado (`setImageFiles`), eliminando el comportamiento donde al seleccionar 4 imagenes se renderizaban 8 previews en entorno de desarrollo.

2. **frontend/src/pages/Diagnostico.jsx**: Se mantuvo intacta la regla de maximo 4 imagenes y la notificacion al usuario cuando intenta exceder el limite.

### Funcionalidad: Pulido de navegación y acciones por estado (2026-11-04)

1. **Panel:** `recent-attentions-table.tsx` lleva Ver todas a `/atenciones` y describe los datos como Últimas atenciones, sin afirmar que pertenecen al día actual.
2. **Datos clínicos:** `atenciones/repository.py` incluye la propiedad calculada `presion_arterial` al construir las respuestas de listado, detalle e historial. `pacientes/repository.py`, `service.py` y `routes.py` exponen la última fecha real de atención mediante una consulta agregada por paciente. Se recupera el historial existente sin migraciones ni escrituras de corrección.
3. **Buscador:** `command-palette.tsx` conecta el clic y Ctrl/Meta+K al mismo diálogo, filtra las opciones por permisos, ofrece las secciones y acciones implementadas y corrige Registrar paciente para abrir su formulario. El texto aclara que busca secciones y acciones. `app-layout.tsx` utiliza el control integrado.
4. **Filtros:** se retiran únicamente los botones Más filtros sin acción en pacientes y atenciones; los filtros existentes se conservan.
5. **Acciones por estado:** `lib/accion-atencion.ts` centraliza etiquetas y permisos para Atenciones y Radiografías. Evaluación -> Evaluar atención; derivación/diagnóstico pendiente -> Cargar radiografía; pendiente de validación -> Revisar y validar (o Ver resultado sin permiso de validación); validado -> Ver diagnóstico y reporte (o Ver diagnóstico sin permiso de PDF). Los botones navegan al caso correspondiente y no ejecutan validaciones automáticamente.
6. **Pendientes:** El plan temporal de UX conservaba los puntos 3-6, completados en entregas posteriores. No se implementan el rediseño, nuevo visor o persistencia de navegación en esta entrega; tampoco se modifican reglas médicas, modelo ni umbral.
7. **Verificación:** build TypeScript/Vite correcto. Comprobación de repositorios/serialización contra 7 pacientes y 10 atenciones, sin escrituras. En navegador: buscador y formulario de registro, enlace Ver todas, evaluación sin guardar, carga sin subir archivos, resultado validado, última atención y presión 85/55 en el resumen. ESLint de archivos afectados señala dos errores en los efectos de carga preexistentes de los listados; el resto de los archivos comprobados pasa.


### Funcionalidad: Colores por estado y regresión del flujo completo (2026-11-04)

1. `frontend/src/lib/estado-clinico.ts` centraliza los estilos: evaluación ámbar, radiografía azul, diagnóstico pendiente naranja, validación pendiente violeta, validado verde; sin atención/estado desconocido neutro. Badges y botones conservan el mismo color por etapa con contraste de texto.
2. Aplicado en tarjetas de Atenciones/Radiografías, carga, resumen de dashboard, modal de evaluación, resultados, historial y ficha del paciente, sin cambiar eventos, estados persistidos ni reglas médicas.
3. `frontend/tests/flujo-clinico.test.cjs`: cuatro pruebas sobre unicidad/coherencia de colores y acceso a acciones por estado y permisos, todas correctas.
4. `backend/tests/test_regresion_flujo_clinico.py`: peticiones a la aplicación ASGI con PostgreSQL real en un esquema transaccional aislado y archivos temporales; dos recorridos con DICOM reales (normal y positivo), inicio de sesión, validaciones de adulto/DNI duplicado/atención duplicada, permisos, registro, CRB-65, derivación, inferencia, alertas, validación, cierre, historial y última atención. Correcto. Se usa solo la biblioteca estándar para el cliente de prueba, sin añadir paquetes.
5. Se verificó que el rollback elimina los esquemas de prueba y mantiene los siete pacientes y diez atenciones originales. Build TypeScript/Vite correcto; lint de los módulos nuevos y buscador correcto. Los dos errores ESLint de efectos de los listados ya existían en HEAD.
6. Revisión visual en Brave y generación del PDF desde la interfaz; no se pudo verificar el archivo nuevo descargado por restricciones del navegador. No dar por validada esa descarga.
7. El commit incluye solo frontend/backend y pruebas; excluye Markdown, documentación y cambios previos ajenos a la entrega. Sin push.


### Ajuste visual: Paleta pastel de estados (2026-11-04)

1. Se sustituyen los fondos sólidos de botones por fondos pastel iguales a sus badges, con texto oscuro y hover suave. Evaluación naranja suave, radiografía celeste, diagnóstico pendiente ámbar, validación lavanda y validado verde suave.
2. Cambio centralizado en `frontend/src/lib/estado-clinico.ts`, sin modificar acciones, permisos ni reglas. Cuatro pruebas frontend correctas, build correcto y revisión visual en Brave.
3. La documentación queda fuera del commit.


### Pulido UX: Jerarquía visual, punto 3 (2026-11-04)

1. `shared/page-header.tsx` establece encabezado, descripción y acciones consistentes. Se aplica a Panel, Pacientes, Atenciones, Radiografías y Resultados; se elimina padding duplicado en Radiografías.
2. Panel: accesos rápidos compactos en encabezado, contadores de prioridad más bajos y casos prioritarios primero en pantallas estrechas. Se adapta el skeleton de carga.
3. Pacientes y Atenciones: `StatCard` ofrece variante compacta neutra. Directorio de pacientes antes del gráfico mensual plegable; colores del gráfico usan las variables CSS vigentes.
4. Atenciones: vista Tabla inicial y alternativa Tarjetas. Reutilizan filtros, página, permisos y un único componente de acción; incluyen presión, FC, FR, saturación y temperatura con unidades en encabezados. Búsqueda mantiene su valor al alternar vistas. Sin alterar endpoints ni reglas clínicas.
5. `resultado/resumen-caso.tsx` presenta primero paciente/DNI/edad, resultado presuntivo, prioridad del backend y estado. Datos clínicos completos se mueven debajo del fundamento del resultado. Se conservan detalle por imagen, advertencias, permisos y callbacks de validación/PDF.
6. Verificación: build TypeScript/Vite correcto y cuatro pruebas frontend aprobadas. Revisión visual en Brave de las cinco páginas, filtro y estado vacío, paginación, alternancia de vistas, evaluación/carga/validación sin escrituras, gráfico plegable y resumen. ESLint de archivos tocados solo informa el error preexistente `react-hooks/set-state-in-effect` en el listado de Atenciones. No se ejecuta otra inferencia ni descarga PDF en esta entrega.
7. Los puntos 4-6 se completaron en entregas posteriores. Commit solo de archivos frontend; quedan fuera documentación y cambios previos de backend/modelo.


## 2026-11-04 — UX punto 4: registro clínico

- `frontend/src/components/atenciones/nueva-atencion-dialog.tsx`: agrupación semántica Paciente / Signos vitales / Síntomas y observaciones; encabezado y botones fijos con cuerpo desplazable; unidades persistentes y accesibles; ayudas para diferenciar motivo y síntomas; observaciones opcionales.
- Conserva hook, API, campos obligatorios, validaciones y reglas médicas. Sin nuevas dependencias.
- Verificación: build, ESLint del componente, cuatro pruebas frontend existentes y Brave en escritorio/390 × 844, con errores de DNI, presión y frecuencia, enfoque al final y cancelación. Sin guardar registros.
