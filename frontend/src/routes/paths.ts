// src/routes/paths.ts

export const PATHS = {
    // Auth
    LOGIN: "/login",
    FORGOT_PASSWORD: "/forgot-password",

    // App
    APP: "/app",
    DASHBOARD: "/dashboard",

    // Pacientes
    PATIENTS: "/pacientes",
    REGISTER_PATIENT: "/pacientes/registrar",
    NEW_ATTENTION: "/pacientes/nueva-atencion",

    // Atenciones
    ATTENTIONS: "/atenciones",
    RADIOGRAPHY: "/radiografias",
    UPLOAD_RADIOGRAPHY: "/radiografias/cargar/:atencionId",

    // Diagnóstico
    DIAGNOSIS: "/diagnostico",
    DIAGNOSIS_DETAIL: "/diagnostico/:codigoAtencion",
    RESULTS: "/resultado",
} as const;
