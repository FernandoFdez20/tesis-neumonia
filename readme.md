# 🫁 Sistema Web para Diagnóstico Presuntivo de Neumonía

![Estado](https://img.shields.io/badge/Estado-En_Desarrollo-blue)
![Frontend](https://img.shields.io/badge/Frontend-React_%2B_Vite_%2B_TS-646CFF?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![IA](https://img.shields.io/badge/IA-PyTorch-EE4C2C?logo=pytorch&logoColor=white)

Aplicación web basada en *deep learning* para el diagnóstico presuntivo de neumonía y priorización dinámica de casos según gravedad en pacientes adultos. Diseñado para optimizar el flujo de trabajo del personal médico en centros de salud.

---

## 🚀 Tecnologías (Stack "Lean Engineering")

Este proyecto está dividido en dos partes principales y utiliza las siguientes tecnologías modernas:

### 🎨 Frontend
* **React + TypeScript:** Interfaz de usuario basada en componentes tipados estáticamente.
* **Vite:** Entorno de desarrollo rápido y empaquetador ultrarrápido.
* **Tailwind CSS / shadcn-ui:** Herramientas para la creación de componentes de UI minimalistas y accesibles.
* **Axios:** Cliente HTTP para comunicación fluida con la API.
* **pnpm:** Gestor de paquetes eficiente en espacio y rapidez.

### ⚙️ Backend & IA
* **FastAPI:** Framework web moderno y de alto rendimiento para construir APIs con Python.
* **PyTorch:** Framework utilizado para la inferencia del modelo de *Deep Learning* de clasificación.
* **SQLModel / PostgreSQL:** Solución robusta de ORM y base de datos relacional orientada a objetos.
* **Uvicorn:** Servidor ASGI para despliegues asíncronos rápidos.

---

## 📂 Estructura del Proyecto

El repositorio sigue una arquitectura de monorepo que separa de manera limpia los dominios.

### Estructura del Frontend (`frontend/`)

```text
frontend/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── pages/
│   │   ├── auth/
│   │   ├── nurse/
│   │   ├── doctor/
│   │   └── technician/
│   ├── routes/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   ├── store/
│   └── main.tsx
```

### Estructura del Backend (`backend/`)

```text
backend/
├── app/
│   ├── main.py
│   ├── api/
│   │   ├── deps.py
│   │   ├── router.py
│   │   └── middleware/
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   ├── logger.py
│   │   └── constants.py
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   ├── dependencies.py
│   │   │   └── utils.py
│   │   ├── users/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── patients/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── xrays/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   ├── diagnosis/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   ├── repository.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   └── inference.py
│   │   ├── reports/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   ├── pdf_generator.py
│   │   │   └── schemas.py
│   │   └── notifications/
│   │       ├── websocket.py
│   │       ├── service.py
│   │       └── schemas.py
│   ├── ml/
│   │   ├── models/
│   │   ├── preprocessing/
│   │   ├── inference/
│   │   ├── explainability/
│   │   └── prioritization/
│   ├── shared/
│   │   ├── utils/
│   │   ├── enums/
│   │   ├── types/
│   │   └── validators/
│   └── tests/
├── requirements.txt
└── .env
```

---

## ⚙️ Instalación y Configuración Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local. Necesitarás tener instalados **Python 3.10+**, **Node.js 18+** y **pnpm**.

### 1. Levantar el Backend (FastAPI)

Abre una terminal, navega a la carpeta del proyecto y ejecuta:

```bash
# Navegar al directorio del backend
cd backend

# Crear y activar el entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate

# Instalar dependencias base e IA
pip install fastapi uvicorn sqlmodel torch torchvision python-multipart

# Iniciar el servidor en modo desarrollo
uvicorn app.main:app --reload
```
> 💡 La API estará disponible en `http://localhost:8000`.

### 2. Levantar el Frontend (React + Vite)

Abre una **nueva terminal** (manteniendo el backend corriendo automáticamente), navega a la carpeta del frontend y ejecuta:

```bash
# Navegar al directorio del frontend
cd frontend

# Instalar dependencias con pnpm
pnpm install

# Iniciar el servidor de desarrollo
pnpm dev
```
> 💡 La interfaz web estará disponible en `http://localhost:5173`.

---

## 📡 Endpoints Principales (API)

* `GET /` : Verificación de estado de salud del servidor (Health Check).
* `GET /estado-ia` : Verificación en caliente de la carga del modelo PyTorch.
* `POST /diagnosticar/` : *(Próximamente)* Endpoint para subir, procesar y diagnosticar radiografías.

---

## 👨‍💻 Autor

**Fernando Fernandez**  
*Desarrollado como proyecto de tesis en ingeniería de tecnologías de la información.*