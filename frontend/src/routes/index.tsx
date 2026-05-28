import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import { useRegistroAtencion } from "@/components/atenciones/use-registro-atencion";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/page";
import { AppLayout } from "@/layouts/app-layout";
import { useRegistroPaciente } from "@/components/pacientes/use-registro-paciente";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PATHS } from "@/routes/paths";

function AbrirDialogoRegistrarPaciente() {
    const navigate = useNavigate();
    const { abrirDialogoNuevoPaciente } = useRegistroPaciente();

    useEffect(() => {
        abrirDialogoNuevoPaciente();
        navigate(PATHS.DASHBOARD, { replace: true });
    }, [navigate, abrirDialogoNuevoPaciente]);

    return null;
}

function AbrirDialogoNuevaAtencion() {
    const navigate = useNavigate();
    const { abrirDialogoNuevaAtencion } = useRegistroAtencion();

    useEffect(() => {
        abrirDialogoNuevaAtencion();
        navigate(PATHS.DASHBOARD, { replace: true });
    }, [navigate, abrirDialogoNuevaAtencion]);

    return null;
}

export default function AppRoutes() {
    return (
        <TooltipProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path={PATHS.LOGIN} element={<LoginPage />} />

                    <Route element={<AppLayout />}>
                        <Route path={PATHS.APP} element={<Navigate to={PATHS.DASHBOARD} replace />} />
                        <Route path={PATHS.DASHBOARD} element={<DashboardPage />} />
                        <Route path={PATHS.REGISTER_PATIENT} element={<AbrirDialogoRegistrarPaciente />} />
                        <Route path={PATHS.NEW_ATTENTION} element={<AbrirDialogoNuevaAtencion />} />
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" closeButton />
        </TooltipProvider>
    );
}
