# AGENTS.md - Fuente de la Verdad | Tesis Neumonía

> **Este archivo es la memoria portátil del proyecto.** Debe ser leído por cualquier modelo (Muse, Gemini, Claude, Cursor, Antigravity) al iniciar sesión. Complementa a `.ai/` que contiene el detalle modular.

---

## 1. Qué es este proyecto

Sistema web clínico para **soporte al diagnóstico presuntivo de neumonía y estratificación de gravedad en adultos**, con priorización dinámica de casos. No reemplaza al médico, solo apoya la decisión clínica.
Autor: **Fernando Fernandez** - Tesis de Ingeniería de Tecnologías de la Información.
Ubicación contexto: Hospital Las Mercedes (referencia clínica).
Estado: En desarrollo activo. Flujo diagnóstico funcional con simulación IA (aún no modelo real).

---

## 2. Tesis - Definiciones Vigentes

- **Título actualizado:** "Plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en adultos del Hospital Las Mercedes"
- **Objetivo general:** Desarrollar una plataforma web basada en deep learning para soporte diagnóstico y estratificación de gravedad en pacientes adultos del Hospital Las Mercedes.
- **Objetivos específicos (parcial):**
  1. Implementar un modelo de deep learning para detectar signos radiológicos de neumonía en radiografías de tórax de adultos
  2. Estratificación de gravedad y priorización dinámica
  3. Validación funcional con datasets públicos + evaluación de aceptación con experto en neumología
- **Población objetivo:** Adultos de 18 años o más (validación en formulario y backend; igual que el filtro del modelo).
- **Criterios de inclusión del dataset (FIRMES, 2026-08-23):** Radiografías de tórax de **adultos** únicamente, con vistas **AP (anteroposterior) y PA (posteroanterior)**. Excluir otras proyecciones (lateral, decúbito, etc.).
- **Principio clínico:** Diagnóstico es **presuntivo**, siempre con advertencia clínica. La IA no da diagnóstico definitivo.

Actualizar esta sección cada vez que el título/objetivos cambien en conversación.

---

## 3. Stack Innegociable (Lean Engineering)

**Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Router + Axios/fetch + pnpm + framer-motion
**Backend:** FastAPI + Python 3.10+ + Uvicorn + SQLModel/SQLAlchemy + PostgreSQL + Pydantic + JWT (HS256, nativo)
**Infra posible:** Docker, Cloud Run

No cambiar stack sin acuerdo explícito. Ver detalle en `.ai/stack.md`.

---

## 4. Estructura del Proyecto (Monorepo)

```
tesis-neumonia/
├── AGENTS.md              <- ESTE ARCHIVO (fuente de verdad universal)
├── .ai/                   <- Memoria modular detallada
│   ├── memory.md          <- Memoria conversacional autónoma (tipo ChatGPT)
│   ├── decisions.md       <- Decisiones arquitectónicas
│   ├── architecture.md    <- Capas y responsabilidades
│   ├── stack.md
│   ├── instructions.md    <- Reglas para agentes (alias instruccions.md)
│   ├── ui-rules.md
│   ├── coding-style.md
│   └── agent-workflow.md
├── doc_acciones.md        <- Bitácora técnica de cada funcionalidad implementada
├── frontend/src/
│   ├── pages/ (Login, PanelMedico /panel, Diagnostico /diagnostico, Resultados /resultados, Historial /historial)
│   ├── components/ui, layout, shared, dashboard
│   ├── services/api.js    <- Centraliza fetch (loginRequest, getEnfermedadesRequest, createDiagnosticoRequest, etc.)
│   └── routes, hooks, lib, types, store
├── backend/app/
│   ├── main.py (CORS, create_all, /uploads estático)
│   ├── core/ (config, security JWT, database)
│   ├── api/router.py (router principal)
│   └── modules/
│       ├── usuarios/ (auth, JWT, roles: Admin/Médico/Especialista/Enfermera/Técnico)
│       ├── pacientes/
│       ├── diagnosticos/ (Paciente, Diagnostico, DiagnosticoImagen, PacienteEnfermedad)
│       ├── enfermedades/ (catálogo)
│       └── xrays, reports, notifications
├── bd.sql                 <- Esquema PostgreSQL fuente de verdad (ENUMs, tablas)
└── readme.md / doc.md
```

Roles BD (`tipo_rol`): `Admin`, `Médico`, `Especialista`, `Enfermera`, `Técnico`
Estados validación (`tipo_estado_val`): `Pendiente de imagenes`, `Pendiente de validación`, `Validado`

---

## 5. Reglas Innegociables para Agentes

1.  **No reestructurar todo sin necesidad.** Cambios pequeños, seguros y explicables. Ver `.ai/agent-workflow.md`
2.  **Mantener separación:** Frontend (UI) / Backend (API) / ML (inferencia). No mezclar.
3.  **UI:** Usar siempre `shadcn/ui` como base. Comando: `pnpm dlx shadcn@latest add <component>`. Estilo clínico sobrio, moderno, no futurista. Ver `.ai/ui-rules.md`
4.  **Código:** Funciones pequeñas, nombres descriptivos (`PatientForm`, `DiagnosisResult`), TS estricto, Python con type hints + Pydantic. Ver `.ai/coding-style.md`
5.  **No inventar lógica médica.** Sistema de soporte, no reemplaza diagnóstico.
6.  **No hardcodear secretos/datos sensibles.** JWT centralizado en `backend/app/core/config.py`
7.  **No agregar dependencias innecesarias.**
8.  **Validaciones clínicas:** DNI 8 dígitos, solo adultos 18 años o más (igual que el modelo de IA), rangos de signos vitales, presión `SYS/DIA` con SYS>DIA. Mensajes con "años" (tilde).
9.  **Idioma del proyecto:** Código y comentarios en español donde ya existe, UI en español.
10. **Antes de modificar:** Leer `.ai/instruccions.md` + archivo específico según tarea (UI/backend/ML).

---

## 6. Memoria Persistente - Regla Autónoma (OBLIGATORIA)

> **Todo agente debe comportarse como si tuviera memoria persistente tipo ChatGPT/Gemini/Claude.**

**Instrucción:** Después de CADA conversación o tarea, analiza internamente lo hablado y actualiza **silenciosamente y sin pedir permiso** el archivo `.ai/memory.md`.

- **No preguntes** "¿quieres que lo guarde?". Hazlo al finalizar y **no le recuerdes al usuario cada vez** que actualices la memoria (actualización silenciosa).
- **INFERENCIA (regla clave):** No esperes a que el usuario defina explícitamente qué guardar. Compórtate como la memoria de ChatGPT: si surge una preferencia, restricción, decisión, duda recurrente, razonamiento clínico, elección de tecnología o contexto relevante para la tesis, **infiérelo y guárdalo proactivamente**. Incluye también el "por qué" (criterio), no solo el hecho.
- **Qué guardar como oraciones naturales:**
  - Sobre el usuario: perfil, conocimientos previos (p. ej. "sin experiencia en IA"), forma de explicarle, estilo de trabajo
  - Tesis: "Título actualizado a: ...", "Objetivo general es...", definiciones clínicas y criterios de inclusión
  - Decisiones/definiciones aunque no haya código: "Acordamos entrenar DenseNet121 primero y luego probar EfficientNet", "Dataset definido: NIH Chest X-ray"
  - Recomendaciones y justificaciones dadas (p. ej. por qué se recomienda X dataset o modelo)
  - Preferencias, acuerdos, ideas, contexto crítico
- **Qué NO guardar:** Saludos, errores temporales, charla trivial sin valor futuro.
- **Privacidad:** `.ai/memory.md` es **personal y local** (está en `.gitignore`, NO se versiona). `AGENTS.md` sí es la fuente universal compartida en git. La memoria se lee al iniciar cada sesión/chat (mismo equipo) para dar continuidad.
- **Cómo guardar:** Consolida y reescribe `.ai/memory.md` por secciones (no solo append infinito). Máx ~2000 tokens. Usa formato:
  `YYYY-MM-DD | Origen: chat/codigo | Tipo | Título | Detalle | Estado: Vigente/Descartado`
  y también oraciones naturales en las secciones.

Este archivo `AGENTS.md` es el índice. El detalle conversacional vive en `.ai/memory.md`.

---

## 7. Decisiones Vigentes (Resumen)

Ver detalle completo en `.ai/decisions.md`. Resumen crítico:

- Sistema será web, diagnóstico presuntivo, priorización dinámica.
- Frontend React+Vite+TS, UI shadcn/ui, paleta sobria clínica (slate/teal).
- Backend FastAPI, JWT HS256 nativo, PostgreSQL.
- Modelo IA separado de API.
- DNI 8 dígitos obligatorio como expediente (antes `expediente_id`).
- Carga de 1 a 4 radiografías por diagnóstico (`diagnostico_imagenes` con `orden`, `imagen_url`), `imagen_url` principal se mantiene por compatibilidad.
- Simulación IA actualmente en backend (resultado aleatorio positivo/negativo, prioridad, confianzas) persistida en `diagnosticos` (`enfermo`, `resultado_ia`, `probabilidad_ia`, `confianza_*`, `hallazgos_json`). Frontend ya no simula.
- Flujo validación: `Pendiente de imagenes` -> `Pendiente de validación` -> `Validado` (por médico).
- Edad calculada automáticamente desde `fecha_nacimiento`.

---

## 8. Estado Actual (2026-08-22)

**Funcional y validado (build OK):**
- [x] Auth JWT: `POST /usuarios/login`, `GET /usuarios/me`, `GET /usuarios` (con roles), login visual migrado, ProtectedRoute, logout
- [x] Panel `/panel` con KPIs, casos recientes reales desde `GET /diagnosticos/recientes` (JWT), búsqueda, fecha relativa, chart
- [x] Flujo diagnóstico `/diagnostico` (4 pasos: radiografía 1-4 imgs, datos paciente con DNI 8, signos vitales con rangos, antecedentes con catálogo `GET /enfermedades/`), validación secuencial, toast
- [x] Registro `POST /diagnosticos/` multipart (soporta `imagen_files[]` + legacy `imagen_file`), guarda en `backend/uploads/radiografias`, crea/actualiza paciente por DNI, sincroniza enfermedades
- [x] Resultados `/resultados` consume `GET /diagnosticos/{id}/resultado` real, simulación movida a backend, navegación desde historial/casos recientes via `diagnostico_id` (state + query)
- [x] Historial `/historial` con filtros, búsqueda, paginación
- [x] Timestamps corregidos (`server_default=func.now()`)

**Pendiente / Próximo:**
- [ ] Integrar modelo PyTorch real (reemplazar simulación en `diagnosticos/service.py`)
- [ ] Módulo ML `backend/app/ml/` (preprocessing, inference, explainability)
- [ ] Validación médica final y reportes PDF
- [ ] Priorización dinámica avanzada y notificaciones websocket

Ver bitácora detallada paso a paso en `doc_acciones.md`.

---

## 9. Archivos Fuente de la Verdad - Orden de Lectura para Agentes

1. `AGENTS.md` (este archivo) - contexto rápido universal
2. `.ai/memory.md` - memoria conversacional autónoma (imprescindible para continuidad entre modelos)
3. `.ai/instruccions.md` + `.ai/architecture.md` + `.ai/stack.md`
4. `bd.sql` - esquema real de BD (no asumir columnas)
5. `doc_acciones.md` - qué se hizo exactamente y en qué archivos

**Para Muse / Gemini / Claude:** Al iniciar, lee siempre `AGENTS.md` y `.ai/memory.md` antes de responder. Mantén `AGENTS.md` < 10k tokens, `.ai/memory.md` < 2k tokens.

---

*Última actualización: 2026-08-22. Mantener actualizado por agentes de forma autónoma.*
