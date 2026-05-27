import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "@/pages/auth/LoginPage";
// import DashboardPage from "@/pages/doctor/DashboardPage";
// import PatientsPage from "@/pages/doctor/PatientsPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* <Route path="/dashboard" element={<DashboardPage />} /> */}

                {/* <Route path="/patients" element={<PatientsPage />} /> */}
            </Routes>
        </BrowserRouter>
    );
}