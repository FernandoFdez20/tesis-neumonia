import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { PanelMedico } from './pages/PanelMedico'; 
import { Diagnostico } from './pages/Diagnostico';
import { Resultados } from './pages/Resultados';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    // 1. BrowserRouter envuelve toda la app y la conecta con la URL del navegador
    <BrowserRouter>
      
      {/* 2. Routes es el contenedor donde definimos los caminos posibles */}
      <Routes>
        
        {/* 3. Route define qué componente se muestra en qué URL */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PanelMedico />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <PanelMedico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/diagnostico"
          element={
            <ProtectedRoute>
              <Diagnostico />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resultados"
          element={
            <ProtectedRoute>
              <Resultados />
            </ProtectedRoute>
          }
        />

        {/* Alias de compatibilidad con rutas del proyecto fuente */}
        <Route path="/diagnosis" element={<Navigate to="/diagnostico" replace />} />
        <Route path="/results" element={<Navigate to="/resultados" replace />} />
        
        {/* Si alguien entra a la raíz "/", lo redirigimos al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Si escriben una URL que no existe, mostramos un error 404 simple */}
        <Route path="*" element={<h2>Error 404: Página no encontrada</h2>} />
        
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;