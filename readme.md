# 🫁 Sistema Web para Diagnóstico Presuntivo de Neumonía

![Estado](https://img.shields.io/badge/Estado-En_Desarrollo-blue)
![Frontend](https://img.shields.io/badge/Frontend-React_%2B_Vite-646CFF?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![IA](https://img.shields.io/badge/IA-PyTorch-EE4C2C?logo=pytorch&logoColor=white)

Aplicación web basada en deep learning para el diagnóstico presuntivo de neumonía y priorización dinámica de casos según gravedad en pacientes adultos. Diseñado para optimizar el flujo de trabajo del personal médico en el hospital de Chiclayo.

## 🚀 Tecnologías (Stack "Lean Engineering")

Este proyecto está dividido en dos partes principales y utiliza las siguientes tecnologías:

### Frontend
* **React:** Interfaz de usuario basada en componentes.
* **Vite:** Entorno de desarrollo rápido y empaquetador.
* **Axios:** Cliente HTTP para consumo de la API.
* **pnpm:** Gestor de paquetes eficiente.

### Backend & IA
* **FastAPI:** Framework web de alto rendimiento.
* **PyTorch:** Inferencia del modelo de Deep Learning.
* **SQLModel / PostgreSQL:** ORM y Base de datos relacional.
* **Uvicorn:** Servidor ASGI.

---

## 📂 Estructura del Proyecto

El repositorio sigue una arquitectura de monorepo simple:

- `backend/` : API REST y lógica de IA.
  - `main.py` : Punto de entrada de FastAPI.
  - `venv/` : Entorno virtual de Python.
- `frontend/` : Interfaz de usuario.
  - `src/App.jsx` : Componente principal.
  - `src/main.jsx` : Punto de entrada de React.
  - `package.json` : Dependencias del frontend.
  - `vite.config.js` : Configuración de Vite.

---

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local. Necesitarás tener instalados **Python 3.x**, **Node.js** y **pnpm**.

### 1. Levantar el Backend (FastAPI)

Abre una terminal, navega a la carpeta del proyecto y ejecuta:

`cd backend`

Crear y activar el entorno virtual:
`python -m venv venv`
`source venv/bin/activate` *(En Windows usa: venv\Scripts\activate)*

Instalar dependencias:
`pip install fastapi uvicorn sqlmodel torch torchvision python-multipart`

Iniciar el servidor en modo desarrollo:
`uvicorn main:app --reload`

La API estará disponible en `http://localhost:8000`.

### 2. Levantar el Frontend (React + Vite)

Abre una **nueva terminal** (manteniendo el backend corriendo), navega a la carpeta del proyecto y ejecuta:

`cd frontend`

Instalar dependencias:
`pnpm install`

Iniciar el servidor de desarrollo:
`pnpm dev`

La interfaz web estará disponible en `http://localhost:5173`.

---

## 📡 Endpoints Principales (API)

* `GET /` : Verificación de estado del servidor.
* `GET /estado-ia` : Verificación de la carga del modelo PyTorch.
* *(Próximamente)* `POST /diagnosticar/` : Endpoint para procesar radiografías.

---
## frontend:

src/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── pages/
│   ├── auth/
│   ├── nurse/
│   ├── doctor/
│   └── technician/
├── routes/
├── services/
├── hooks/
├── lib/
├── types/
├── store/
└── main.tsx

## backend
backend/
├── app/
│
├── main.py
│
├── api/
│   ├── deps.py
│   ├── router.py
│   └── middleware/
│
├── core/
│   ├── config.py
│   ├── security.py
│   ├── database.py
│   ├── exceptions.py
│   ├── logger.py
│   └── constants.py
│
├── modules/
│   │
│   ├── auth/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   ├── models.py
│   │   ├── dependencies.py
│   │   └── utils.py
│   │
│   ├── users/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   │
│   ├── patients/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   │
│   ├── xrays/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   │
│   ├── diagnosis/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   ├── models.py
│   │   └── inference.py
│   │
│   ├── reports/
│   │   ├── routes.py
│   │   ├── service.py
│   │   ├── pdf_generator.py
│   │   └── schemas.py
│   │
│   └── notifications/
│       ├── websocket.py
│       ├── service.py
│       └── schemas.py
│
├── ml/
│   ├── models/
│   ├── preprocessing/
│   ├── inference/
│   ├── explainability/
│   └── prioritization/
│
├── shared/
│   ├── utils/
│   ├── enums/
│   ├── types/
│   └── validators/
│
├── tests/
│
├── requirements.txt
│
└── .env
## 👨‍💻 Autor
**Fernando Fernandez** *Desarrollado como proyecto de tesis en ingeniería de tecnologías de la información.*