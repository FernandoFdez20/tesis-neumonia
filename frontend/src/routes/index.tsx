import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import AtencionesPage from "@/pages/atenciones/page";
import DashboardPage from "@/pages/dashboard/page";
import HistorialPage from "@/pages/historial/page";
import PacientesPage from "@/pages/pacientes/page";
import RadiografiasPage from "@/pages/radiografias/page";
import CargarRadiografiaPage from "@/pages/radiografias/cargar/page";
import ResultadoPage from "@/pages/resultado/page";
import UsuariosPage from "@/pages/usuarios/page";
import { AppLayout } from "@/layouts/app-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useAuth, PERMISOS } from "@/hooks/use-auth";
import { PATHS } from "@/routes/paths";

function ProtectedRoute() {
    const { token } = useAuth();
    if (!token) {
        return <Navigate to={PATHS.LOGIN} replace />;
    }
    return <Outlet />;
}

/**
 * HU-03 — El Administrador gestiona cuentas y roles, pero no accede a datos
 * clínicos. Si intenta entrar a una sección clínica se le devuelve al panel
 * de usuarios. El backend responde 403 por su parte: esto solo evita mostrar
 * pantallas vacías.
 */
function ClinicoRoute() {
    const { esClinico } = useAuth();
    if (!esClinico) {
        return <Navigate to={PATHS.USERS} replace />;
    }
    return <Outlet />;
}

/** Ruta exclusiva del Administrador. */
function AdminRoute() {
    const { esAdmin } = useAuth();
    if (!esAdmin) {
        return <Navigate to={PATHS.DASHBOARD} replace />;
    }
    return <Outlet />;
}

/**
 * HU-04 — Cada sección se muestra solo si el usuario tiene el permiso.
 * Si no lo tiene, se cae a la sección por defecto en vez de pintar vacío.
 */
function ConPermiso({ children, requiere }: { children: React.ReactNode; requiere: string }) {
    const { tienePermiso } = useAuth();
    const esAdmin = tienePermiso(PERMISOS.USUARIOS_GESTIONAR);
    const destino = esAdmin ? PATHS.USERS : PATHS.DASHBOARD;
    if (tienePermiso(requiere)) {
        return <>{children}</>;
    }
    return <Navigate to={destino} replace />;
}

export default function AppRoutes() {
    return (
        <TooltipProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path={PATHS.LOGIN} element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        {/* Layout de administración: el Admin no ve menús clínicos */}
                        <Route element={<AdminRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path={PATHS.USERS} element={<UsuariosPage />} />
                            </Route>
                        </Route>

                        {/* Layout clínico: Enfermería y Especialista */}
                        <Route element={<ClinicoRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path={PATHS.APP} element={<Navigate to={PATHS.DASHBOARD} replace />} />
                                <Route path={PATHS.DASHBOARD} element={<ConPermiso requiere={PERMISOS.DASHBOARD_VER}><DashboardPage /></ConPermiso>} />
                                <Route path={PATHS.HISTORY} element={<ConPermiso requiere={PERMISOS.HISTORIAL_VER}><HistorialPage /></ConPermiso>} />
                                <Route path={PATHS.PATIENTS} element={<ConPermiso requiere={PERMISOS.PACIENTES_VER}><PacientesPage /></ConPermiso>} />
                                <Route path={PATHS.ATTENTIONS} element={<ConPermiso requiere={PERMISOS.ATENCIONES_VER}><AtencionesPage /></ConPermiso>} />
                                <Route path={PATHS.RADIOGRAPHY} element={<ConPermiso requiere={PERMISOS.RADIOGRAFIAS_CARGAR}><RadiografiasPage /></ConPermiso>} />
                                <Route path={PATHS.UPLOAD_RADIOGRAPHY} element={<ConPermiso requiere={PERMISOS.RADIOGRAFIAS_CARGAR}><CargarRadiografiaPage /></ConPermiso>} />
                                <Route path={PATHS.RESULTS} element={<ConPermiso requiere={PERMISOS.RESULTADOS_VER}><ResultadoPage /></ConPermiso>} />
                                <Route path={PATHS.REGISTER_PATIENT} element={null} />
                                <Route path={PATHS.NEW_ATTENTION} element={null} />
                            </Route>
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" closeButton />
        </TooltipProvider>
    );
}