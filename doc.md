# Frontend
pnpm create vite@latest frontend --template react
cd frontend
pnpm install
# Instalamos axios para las peticiones HTTP al backend
pnpm add axios

pnpm run dev

pnpm add lucide-react # import para el login
pnpm add -D @tailwindcss/vite

En vite.config.js
```
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

en index.css
@import "tailwindcss";

pnpm add -D tailwindcss postcss autoprefixer
pnpm add react-router-dom # para que permita rutas en el frontend


# backend

mkdir backend
cd backend
python -m venv venv

pip install fastapi uvicorn sqlmodel --torch torchvision python-multipart
pip install sqlalchemy psycopg2-binary pydantic[email] pydantic-settings

para correrlo: uvicorn main:app --reload