import { BrowserRouter, Navigate, Route, Routes, Outlet } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import AtencionesPage from "@/pages/atenciones/page";
import DashboardPage from "@/pages/dashboard/page";
import PacientesPage from "@/pages/pacientes/page";
import RadiografiasPage from "@/pages/radiografias/page";
import CargarRadiografiaPage from "@/pages/radiografias/cargar/page";
import ResultadoPage from "@/pages/resultado/page";
import { AppLayout } from "@/layouts/app-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PATHS } from "@/routes/paths";

function ProtectedRoute() {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to={PATHS.LOGIN} replace />;
    }
    return <Outlet />;
}

export default function AppRoutes() {
    return (
        <TooltipProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path={PATHS.LOGIN} element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path={PATHS.APP} element={<Navigate to={PATHS.DASHBOARD} replace />} />
                            <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
                            <Route path={PATHS.PATIENTS} element={<PacientesPage />} />
                            <Route path={PATHS.ATTENTIONS} element={<AtencionesPage />} />
                            <Route path={PATHS.RADIOGRAPHY} element={<RadiografiasPage />} />
                            <Route path={PATHS.UPLOAD_RADIOGRAPHY} element={<CargarRadiografiaPage />} />
                            <Route path={PATHS.RESULTS} element={<ResultadoPage />} />
                            <Route path={PATHS.REGISTER_PATIENT} element={null} />
                            <Route path={PATHS.NEW_ATTENTION} element={null} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" closeButton />
        </TooltipProvider>
    );
}
