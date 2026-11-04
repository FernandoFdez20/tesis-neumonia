import { PERMISOS } from "@/hooks/use-auth"

type AccionAtencion = {
  tipo: "evaluar" | "radiografia" | "resultado"
  etiqueta: string
}

export function obtenerAccionAtencion(
  estado: string | undefined,
  tienePermiso: (permiso: string) => boolean,
): AccionAtencion | null {
  if (estado === "Pendiente de evaluación" && tienePermiso(PERMISOS.EXAMEN_FISICO)) {
    return { tipo: "evaluar", etiqueta: "Evaluar atención" }
  }
  if ((estado === "Derivado a radiografía" || estado === "Diagnostico pendiente") && tienePermiso(PERMISOS.RADIOGRAFIAS_CARGAR)) {
    return { tipo: "radiografia", etiqueta: "Cargar radiografía" }
  }
  if (estado === "Pendiente de validación" && tienePermiso(PERMISOS.RESULTADOS_VER)) {
    return {
      tipo: "resultado",
      etiqueta: tienePermiso(PERMISOS.DIAGNOSTICO_VALIDAR) ? "Revisar y validar" : "Ver resultado",
    }
  }
  if (estado === "Validado" && tienePermiso(PERMISOS.RESULTADOS_VER)) {
    return {
      tipo: "resultado",
      etiqueta: tienePermiso(PERMISOS.REPORTE_PDF) ? "Ver diagnóstico y reporte" : "Ver diagnóstico",
    }
  }
  return null
}
