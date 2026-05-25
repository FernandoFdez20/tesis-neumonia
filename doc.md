# Frontend
pnpm create vite frontend --template react-ts

cd frontend

pnpm install

pnpm add tailwindcss @tailwindcss/vite

vite.config.ts
'''
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
'''

index.css
'''
@import "tailwindcss";
'''

### Shadcn

pnpm dlx shadcn@latest init

pnpm add -D @types/node

Edita tsconfig.json
Agrega esto dentro de "compilerOptions":
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}


Edita vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

pnpm approve-builds

pnpm dlx shadcn@latest init

Instalar componentes:
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add sidebar

pnpm add react-router-dom axios

pnpm add lucide-react

pnpm add @tanstack/react-query

pnpm add clsx tailwind-merge
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

pip install fastapi uvicorn

mkdir app
para correrlo: uvicorn main:app --reload