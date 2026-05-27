import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/page";
import NuevaAtencionPage from "@/pages/pacientes/nueva-atencion/page";
import { AppLayout } from "@/layouts/app-layout";
import { usePatientRegistration } from "@/components/patients/use-patient-registration";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PATHS } from "@/routes/paths";

function OpenRegisterPatientDialog() {
    const navigate = useNavigate();
    const { openNewPatientDialog } = usePatientRegistration();

    useEffect(() => {
        openNewPatientDialog();
        navigate(PATHS.DASHBOARD, { replace: true });
    }, [navigate, openNewPatientDialog]);

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
                        <Route path={PATHS.REGISTER_PATIENT} element={<OpenRegisterPatientDialog />} />
                        <Route path={PATHS.NEW_ATTENTION} element={<NuevaAtencionPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" closeButton />
        </TooltipProvider>
    );
}
