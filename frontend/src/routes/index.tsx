import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/page";
import PacientesPage from "@/pages/pacientes/page";
import { AppLayout } from "@/layouts/app-layout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PATHS } from "@/routes/paths";

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
                        <Route path={PATHS.PATIENTS} element={<PacientesPage />} />
                        <Route path={PATHS.REGISTER_PATIENT} element={null} />
                        <Route path={PATHS.NEW_ATTENTION} element={null} />
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" closeButton />
        </TooltipProvider>
    );
}
