# AGENTS.md - Fuente de la Verdad | Tesis Neumonía

> **Este archivo es la memoria portátil del proyecto.** Debe ser leído por cualquier modelo (Muse, Gemini, Claude, Cursor, Antigravity) al iniciar sesión. Complementa a `.ai/` que contiene el detalle modular.

> **Contexto funcional actualizado:** leer [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md) después de este archivo. Consolida el producto, los cuatro objetivos, el informe aprobado, el flujo clínico, las decisiones de IA y las diferencias conocidas con el código.

---

## 1. Qué es este proyecto

Sistema web clínico para **soporte al diagnóstico presuntivo de neumonía y estratificación de gravedad en adultos**, con priorización dinámica de casos. No reemplaza al médico, solo apoya la decisión clínica.
Autor: **Fernando Fernandez** - Tesis de Ingeniería de Tecnologías de la Información.
Ubicación contexto: Hospital Las Mercedes (referencia clínica).
Estado: Producto funcional terminado en el alcance del informe aprobado, que declara la versión v1.0.0 (22 historias de usuario y 21 requerimientos funcionales). Fase actual: preparación de la presentación final. DenseNet121 v2 ya está integrado; la demostración del escenario clínico usa datos de prueba e imágenes públicas.

---

## 2. Tesis - Definiciones Vigentes

- **Título actualizado:** "Plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en adultos del Hospital Las Mercedes"
- **Objetivo general:** Desarrollar una plataforma web basada en deep learning para el soporte diagnóstico y la estratificación de gravedad de neumonía en pacientes adultos del Hospital Las Mercedes.
- **Objetivos específicos:**
  1. Implementar un modelo de deep learning entrenado para detectar signos radiológicos de neumonía en imágenes de tórax de adultos.
  2. Integrar el modelo predictivo en una plataforma web que permita la carga de imágenes médicas, genere un soporte diagnóstico automatizado y realice la estratificación de gravedad cruzando los resultados visuales con los signos vitales del paciente.
  3. Validar la precisión del modelo y la funcionalidad del sistema mediante pruebas con imágenes de datasets públicos de casos de neumonía en pacientes.
  4. Evaluar la percepción de aceptación tecnológica de la plataforma web por parte de un experto en neumología, considerando factores como utilidad y facilidad de uso.
- **Población objetivo:** Adultos de 18 años o más (validación en formulario y backend; igual que el filtro del modelo).
- **Criterios de inclusión del dataset (FIRMES, 2026-08-23):** Radiografías de tórax de **adultos** únicamente, con vistas **AP (anteroposterior) y PA (posteroanterior)**. Excluir otras proyecciones (lateral, decúbito, etc.).
- **Principio clínico:** Diagnóstico es **presuntivo**, siempre con advertencia clínica. La IA no da diagnóstico definitivo.

Actualizar esta sección cuando cambien el título o los objetivos de la tesis.

---

## 3. Stack Innegociable (Lean Engineering)

**Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Router + Axios/fetch + TanStack Query + pnpm
**Backend:** FastAPI + Python 3.10+ + Uvicorn + SQLAlchemy + PostgreSQL + Pydantic + JWT HS256 (python-jose)
**ML:** PyTorch/torchvision + DenseNet121, pydicom + NumPy + Pillow. Módulo separado por responsabilidad, ejecutado dentro del backend.
**Infra posible:** Docker, Cloud Run

No cambiar stack sin acuerdo explícito. Estas líneas describen la implementación revisada; no autorizan añadir dependencias.

---

## 4. Estructura del Proyecto (Monorepo)

```
tesis-neumonia/
├── AGENTS.md              <- ESTE ARCHIVO (fuente de verdad universal)
├── CONTEXTO_PROYECTO.md   <- Contexto funcional y académico consolidado
├── .ai/                   <- Memoria modular detallada
│   ├── memory.md          <- Memoria conversacional autónoma (tipo ChatGPT)
│   ├── architecture.md    <- Capas y responsabilidades
│   ├── instructions.md    <- Reglas para agentes (alias instruccions.md)
│   ├── ui-rules.md
│   ├── coding-style.md
│   └── agent-workflow.md
├── doc_acciones.md        <- Bitácora técnica de cada funcionalidad implementada
├── frontend/src/
│   ├── pages/             <- Login, dashboard, pacientes, atenciones, radiografías, resultado, historial, usuarios
│   ├── components/        <- UI shadcn y componentes por módulo
│   ├── services/          <- Servicios TypeScript; cliente Axios en lib/api.ts
│   └── routes, hooks, lib, types, layouts
├── backend/app/
│   ├── main.py            <- Carga inicial del modelo, CORS, /uploads con sesión
│   ├── core/ (config, security JWT, database)
│   ├── api/               <- Router /api/v1 y autorización
│   ├── ml/                <- Carga de DenseNet121, inferencia y vistas previas
│   └── modules/
│       ├── auth/
│       ├── usuarios/       <- Cuentas y permisos
│       ├── pacientes/
│       ├── atenciones/
│       ├── diagnosticos/   <- Imágenes, resultados, CRB-65 y priorización
│       └── notificaciones/
├── modelo/                <- Datos, splits, notebooks Colab y pesos entrenados
├── bd.sql                 <- Esquema PostgreSQL fuente de verdad (ENUMs, tablas)
└── readme.md / doc.md
```

Roles BD (`tipo_rol`): `Admin`, `Enfermera`, `Especialista`. Permisos efectivos por rol y desviaciones individuales; el administrador no accede a datos clínicos.
Estados (`tipo_estado_val`): `Sin atención pendiente`, `Pendiente de evaluación`, `Derivado a radiografía`, `Diagnostico pendiente`, `Pendiente de validación`, `Validado`. Ver distinción entre estado visible y persistido en `CONTEXTO_PROYECTO.md`.

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
10. **Antes de modificar:** Leer `CONTEXTO_PROYECTO.md`, `.ai/instruccions.md` y las reglas existentes según la tarea. No asumir que existen archivos mencionados por documentación histórica.

---

## 6. Memoria Persistente - Regla Autónoma (OBLIGATORIA)

> **Todo agente debe comportarse como si tuviera memoria persistente tipo ChatGPT/Gemini/Claude.**

**Instrucción:** Después de CADA conversación o tarea, analiza internamente lo hablado y actualiza **silenciosamente y sin pedir permiso** el archivo `.ai/memory.md`.

- **No preguntes** "¿quieres que lo guarde?". Hazlo al finalizar y **no le recuerdes al usuario cada vez** que actualices la memoria (actualización silenciosa).
- **INFERENCIA (regla clave):** No esperes a que el usuario defina explícitamente qué guardar. Compórtate como la memoria de ChatGPT: si surge una preferencia, restricción, decisión, duda recurrente, razonamiento clínico, elección de tecnología o contexto relevante para la tesis, **infiérelo y guárdalo proactivamente**. Incluye también el "por qué" (criterio), no solo el hecho.
- **Qué guardar como oraciones naturales:**
  - Criterios de colaboración: nivel de explicación, estilo de trabajo y restricciones del proyecto
  - Tesis: "Título actualizado a: ...", "Objetivo general es...", definiciones clínicas y criterios de inclusión
  - Decisiones y definiciones aunque no haya código: modelo seleccionado, dataset, protocolo de evaluación y justificación
  - Recomendaciones y justificaciones dadas (p. ej. por qué se recomienda X dataset o modelo)
  - Preferencias, acuerdos, ideas, contexto crítico
- **Qué NO guardar:** Saludos, errores temporales, charla trivial sin valor futuro.
- **Privacidad:** `.ai/memory.md` es **personal y local** (está en `.gitignore`, NO se versiona). `AGENTS.md` sí es la fuente universal compartida en git. La memoria se lee al iniciar cada sesión/chat (mismo equipo) para dar continuidad.
- **Cómo guardar:** Consolida y reescribe `.ai/memory.md` por secciones (no solo append infinito). Máx ~2000 tokens. Usa formato:
  `YYYY-MM-DD | Origen: chat/codigo | Tipo | Título | Detalle | Estado: Vigente/Descartado`
  y también oraciones naturales en las secciones.

La documentación debe usar redacción directa e impersonal: describir hechos, decisiones y reglas del proyecto, sin atribuirlos a conversaciones, al autor como interlocutor ni al agente que los redactó. Evitar fórmulas como «según el autor», «se pidió» o «se confirmó en el chat». Conservar la autoría, los nombres de archivos y las rutas cuando sean datos documentales.

Este archivo `AGENTS.md` es el índice. `CONTEXTO_PROYECTO.md` conserva el contexto compartido del producto y puede versionarse; `.ai/memory.md` conserva la continuidad personal local. Mantener los resúmenes alineados y distinguir hechos del código, evidencia del informe y verificaciones nuevas.

---

## 7. Decisiones Vigentes (Resumen)

Ver el detalle y las fuentes en `CONTEXTO_PROYECTO.md`. Resumen crítico:

- Sistema será web, diagnóstico presuntivo, priorización dinámica.
- Frontend React+Vite+TS, UI shadcn/ui, paleta sobria clínica (slate/teal).
- Backend FastAPI, JWT HS256 nativo, PostgreSQL.
- Modelo IA separado por responsabilidad en `backend/app/ml/`, cargado una vez dentro de FastAPI; no es un microservicio independiente.
- DNI 8 dígitos obligatorio como expediente (antes `expediente_id`).
- Carga de AP y/o PA, un archivo por vista. Resultado independiente en `diagnostico_imagenes`; referencia consolidada con la mayor probabilidad (`imagen_referencia_id`), sin promedio.
- DenseNet121 v2 real, umbral 0.50, pesos en `modelo/modelos/densenet121_v2_best.pth`. La demostración usa un escenario clínico de prueba, no IA aleatoria.
- Gravedad clínica mediante CRB-65; prioridad final Baja/Moderada/Alta/Crítica mediante seis combinaciones de CRB-65 y resultado IA. No modificar reglas médicas por iniciativa propia.
- Validación por especialista: conserva la IA y registra clasificación médica, concordancia, autor y fecha; finaliza la atención y cierra su alerta.
- Notificaciones persistentes y panel con consultas cada 30 segundos; PDF generado en frontend.
- Edad calculada automáticamente desde `fecha_nacimiento`.

---

## 8. Estado Actual (2026-11-04)

El informe `SCRUM_FERNANDEZ_FERNANDO.pdf` fue revisado y aprobado por las docentes. Documenta la versión v1.0.0 y el alcance funcional completado al 100 %. El código revisado incluye autenticación, usuarios/permisos, pacientes, atenciones, evaluación/derivación, análisis real, prioridad, alertas, validación, historial y PDF.

Flujo actual: login -> paciente -> atención/signos -> evaluación/derivación -> radiografías -> IA + CRB-65/prioridad -> validación -> PDF/historial. Rutas principales: `/dashboard`, `/pacientes`, `/atenciones`, `/radiografias`, `/resultado`, `/historial`, `/usuarios`; API bajo `/api/v1`.

Modelo final documentado: DenseNet121 v2, corrida `20261013_062105`, umbral 0.50. Prueba n=2.104: exactitud 94,49 %, sensibilidad 94,56 %, F1 93,23 %, AUC 0,9885. Dos notebooks de corrida contienen resultados coincidentes. El informe documenta seis escenarios aprobados y paridad de predicciones entre plataforma y notebook.

La documentación reúne el informe, el código, los CSV, los resultados guardados de los notebooks y las verificaciones funcionales registradas en la bitácora. El plan de pulido de navegación, jerarquía visual, registro clínico, visor y contexto de navegación está completado. Las verificaciones deben indicar su alcance y distinguir las métricas del informe de las pruebas ejecutadas sobre cada versión.

Las diferencias históricas y los límites de evaluación se detallan en `CONTEXTO_PROYECTO.md`. Cualquier ampliación funcional requiere definir su alcance antes de implementarla; las recomendaciones opcionales no forman parte de los requisitos de cierre.

La bitácora `doc_acciones.md` describe etapas históricas y no sustituye al contexto actualizado.

---

## 9. Archivos Fuente de la Verdad - Orden de Lectura para Agentes

1. `AGENTS.md` (este archivo) - contexto rápido universal
2. `CONTEXTO_PROYECTO.md` - producto, tesis, flujo, modelo, evidencias y diferencias conocidas
3. `.ai/memory.md` - memoria personal local, si está disponible
4. `.ai/instruccions.md` + `.ai/architecture.md` y reglas existentes pertinentes
5. `bd.sql` + código del módulo afectado - verificar la implementación, no asumir columnas ni comportamiento
6. `doc_acciones.md` - bitácora histórica

**Para cualquier agente:** leer primero `AGENTS.md` y `CONTEXTO_PROYECTO.md`. No depender de que el PDF externo o la memoria local estén presentes en otro equipo. Mantén `AGENTS.md` < 10k tokens, `.ai/memory.md` < 2k tokens.

---

*Última actualización: 2026-11-04. Mantener actualizado por agentes de forma autónoma.*
