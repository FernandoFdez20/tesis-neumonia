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