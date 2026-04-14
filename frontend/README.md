# Frontend Técnico - NeumoAI

Frontend del Sistema web con deep learning para diagnostico presuntivo de neumonia priorizado dinamicamente segun gravedad en adultos, orientado al HOSPITAL REGIONAL DOCENTE LAS MERCEDES.

## 1) Stack Tecnologico y Entorno

Versiones y herramientas actuales (segun [frontend/package.json](frontend/package.json)):

- React 19.2.4 con JSX
- React DOM 19.2.4
- React Router DOM 7.13.2
- Vite 8.0.3
- Tailwind CSS 4.2.2
- Integracion Tailwind con Vite via @tailwindcss/vite 4.2.2
- Recharts 3.8.1 para visualizacion del grafico semanal
- lucide-react 1.7.0 para iconografia
- pnpm 10.x como gestor de paquetes

Inicializacion local:

1. Entrar a la carpeta frontend.
2. Instalar dependencias:

```bash
pnpm install
```

3. Levantar entorno de desarrollo:

```bash
pnpm dev
```

Nota operativa:
- Si el puerto 5173 esta ocupado, Vite puede mover el servidor a otro puerto.
- Para forzar puerto fijo durante desarrollo:

```bash
pnpm dev --port 5173 --strictPort
```

## 2) Estructura de Directorios (Tree)

Arbol tecnico actual de [frontend/src](frontend/src):

```text
src/
├─ App.jsx
├─ index.css
├─ main.jsx
├─ assets/
├─ components/
│  ├─ ErrorBoundary.jsx
│  └─ dashboard/
│     ├─ MetricCard.jsx
│     ├─ QuickActionButton.jsx
│     ├─ Sidebar.jsx
│     └─ WeeklyActivityChart.jsx
├─ pages/
│  ├─ Login.jsx
│  └─ PanelMedico.jsx
├─ services/
│  └─ api.js
└─ utils/
	 └─ formatoFecha.js
```

Responsabilidades principales:

- [frontend/src/components](frontend/src/components): componentes reutilizables de UI y bloques de layout (presentacionales).
- [frontend/src/pages](frontend/src/pages): pantallas de nivel ruta que ensamblan componentes y datos.
- [frontend/src/main.jsx](frontend/src/main.jsx): bootstrap de React, import global de estilos y montaje de ErrorBoundary.
- [frontend/src/App.jsx](frontend/src/App.jsx): definicion central de rutas y redirecciones con React Router.

## 3) Enrutamiento y Flujo de Navegacion (React Router)

Router actual en [frontend/src/App.jsx](frontend/src/App.jsx):

- El arbol de navegacion se monta dentro de BrowserRouter.
- Routes define los caminos publicos actuales.
- Entrada a raiz /: se aplica redireccion estricta con replace hacia /login mediante Navigate.

Flujo cuando el usuario entra a /:

1. React Router evalua la ruta raiz.
2. Se renderiza Navigate con destino /login y replace activo.
3. El historial reemplaza la entrada actual (no agrega una nueva).
4. Se renderiza la pagina Login.

Rutas actuales:

- /login -> componente Login en [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx)
- /panel -> componente PanelMedico en [frontend/src/pages/PanelMedico.jsx](frontend/src/pages/PanelMedico.jsx)
- / -> redireccion a /login en [frontend/src/App.jsx](frontend/src/App.jsx)
- * -> fallback 404 simple en [frontend/src/App.jsx](frontend/src/App.jsx)

## 4) Arquitectura de Componentes (API Interna)

Componentes clave implementados:

- DashboardPage: corresponde a PanelMedico en [frontend/src/pages/PanelMedico.jsx](frontend/src/pages/PanelMedico.jsx)
- Sidebar: [frontend/src/components/dashboard/Sidebar.jsx](frontend/src/components/dashboard/Sidebar.jsx)
- StatsCard: equivalente actual MetricCard en [frontend/src/components/dashboard/MetricCard.jsx](frontend/src/components/dashboard/MetricCard.jsx)
- ActionButton: equivalente actual QuickActionButton en [frontend/src/components/dashboard/QuickActionButton.jsx](frontend/src/components/dashboard/QuickActionButton.jsx)
- ActivityChart: equivalente actual WeeklyActivityChart en [frontend/src/components/dashboard/WeeklyActivityChart.jsx](frontend/src/components/dashboard/WeeklyActivityChart.jsx)

API de props (componentes reutilizables):

- MetricCard
	- icon: componente de icono lucide-react
	- title: string
	- value: string o numero
	- iconBg: clases Tailwind para fondo del icono
	- iconColor: clases Tailwind para color del icono
	- iconStroke: numero opcional, default 2

- QuickActionButton
	- icon: componente de icono lucide-react
	- label: string
	- colorClass: clases Tailwind para color principal y hover

- WeeklyActivityChart
	- data: arreglo de objetos con forma { dia, detectados, validados }

Implementacion tecnica de ActivityChart con Recharts:

- Usa ResponsiveContainer para ajuste automatico al ancho disponible.
- Usa BarChart con dos series Bar:
	- detectados
	- validados
- Configura ejes X e Y, grid, tooltip y leyenda.
- Usa Cell para color por barra.
- La fuente de datos llega por prop data desde la pagina padre.

## 5) Gestion de Estado y Data Mockeada

Estado actual de la capa de datos:

- No hay llamadas asincronas activas en el dashboard.
- No hay gestion de estado global (Redux, Zustand, Context para negocio, etc.).
- No hay integracion runtime con backend en la pantalla del panel.

Flujo de informacion actual (one-way data flow):

1. [frontend/src/pages/PanelMedico.jsx](frontend/src/pages/PanelMedico.jsx) define arreglos mockeados locales:
	 - kpiCards
	 - quickActions
	 - weeklyActivity
2. La pagina padre mapea esos arreglos.
3. Cada item se pasa por props a componentes hijos presentacionales.
4. Los hijos solo renderizan UI en base a props.

Estado de preparacion para integracion futura:

- La arquitectura ya separa contenedor de pagina y componentes reutilizables.
- Reemplazar data mock por data remota implicara:
	- mover arreglos locales a una capa de fetch en page-level
	- usar services para Axios hacia FastAPI
	- mantener la misma API de props para minimizar cambios en UI.

