// src/routes/paths.ts

export const PATHS = {
    // Auth
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",

    // Dashboard
    DASHBOARD: "/dashboard",

    // Patients
    PATIENTS: "/patients",
    NEW_PATIENT: "/patients/new",

    // Diagnosis
    DIAGNOSIS: "/diagnosis",
    UPLOAD_XRAY: "/diagnosis/upload",

    // Reports
    REPORTS: "/reports",

    // Settings
    SETTINGS: "/settings",
} as const;