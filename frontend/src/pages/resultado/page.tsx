import { PageHeader } from "@/components/shared/page-header"
import { ResumenCaso } from "@/components/resultado/resumen-caso"
import { obtenerEstiloEstadoClinico } from "@/lib/estado-clinico"
import { useEffect, useState } from "react"
import { useLocation, useNavigate, Navigate } from "react-router-dom"
import {
  ArrowLeft,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Images,
  ShieldAlert,
  FileImage,
  FolderOpen,
  Printer,
  Stethoscope,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { StaggerContainer, StaggerItem } from "@/components/shared/stagger-animation"

import { RegistroDiagnosticoFinalDialog } from "@/components/diagnostico/registro-diagnostico-final-dialog"

import { Crb65Resultado } from "@/components/atenciones/crb65-resultado"
import { PrioridadFinal } from "@/components/diagnostico/prioridad-final"
import { InfoPacienteAtencion } from "@/components/resultado/info-paciente-atencion"
import { generarReportePdf } from "@/services/reporte-pdf.service"
import { getDiagnosticoPorAtencion } from "@/services/diagnosticos.service"
import { getAtencionPorId, type AtencionResponse } from "@/services/atenciones.service"
import { type DiagnosticoImagen, type DiagnosticoResponse } from "@/types/diagnostico"
import { PATHS } from "@/routes/paths"
import { PERMISOS, useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { urlConToken } from "@/lib/archivos"

function esDicom(url: string) {
  return url.toLowerCase().endsWith(".dcm")
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "No registrada"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fecha))
}

function badgeHallazgo(hallazgo: boolean | null) {
  if (hallazgo === true) return <Badge variant="grave">Positivo</Badge>
  if (hallazgo === false) return <Badge variant="leve">Negativo</Badge>
  return <Badge variant="outline">Pendiente</Badge>
}

function TarjetaImagenResultado({ 
  img, 
  esReferencia 
}: { 
  img: DiagnosticoImagen; 
  esReferencia?: boolean;
}) {
  const positivo = img.hallazgo_positivo === true
  const pendiente = img.hallazgo_positivo == null || img.probabilidad_ia == null
  const prob = (Number(img.probabilidad_ia) || 0) * 100
  const confianza = Number(img.confianza_radiografica) || 0
  const esDcm = esDicom(img.imagen_url)
  // Convención con el backend: el PNG vive junto al DICOM (abc.dcm -> abc.png).
  // Si aún no existe (imágenes subidas antes), se muestra el placeholder DICOM.
  const [sinVistaPrevia, setSinVistaPrevia] = useState(false)
  const vistaPng = esDcm ? img.imagen_url.replace(/\.dcm$/i, ".png") : null

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/40 bg-card transition-all duration-200 hover:shadow-md border-l-[4px]",
        esReferencia 
          ? positivo ? "border-l-red-500 shadow-red-500/10 ring-1 ring-red-500/20" : "border-l-emerald-500 shadow-emerald-500/10 ring-1 ring-emerald-500/20"
          : pendiente ? "border-l-muted-foreground/30" : positivo ? "border-l-red-500/40" : "border-l-emerald-500/40"
      )}
    >
      {/* Cabecera: vista + hallazgo */}
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-border/40 bg-muted/30 relative">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs font-bold text-muted-foreground">#{img.orden}</span>
          <Badge variant="outline" className="font-bold">
            Vista {img.tipo_vista ?? "—"}
          </Badge>
          {esReferencia && (
            <Badge 
              variant="secondary" 
              className="ml-1 text-[10px] uppercase tracking-wider bg-primary/10 text-primary border-primary/20 cursor-help"
              title="Seleccionada automáticamente por presentar la mayor probabilidad de neumonía (peor escenario clínico)."
            >
              Imagen Principal
            </Badge>
          )}
        </div>
        {badgeHallazgo(img.hallazgo_positivo)}
      </div>

      {/* Imagen */}
      <div className="flex items-center justify-center bg-slate-950/90 min-h-[220px] p-3">
        {esDcm && vistaPng && !sinVistaPrevia ? (
          <div className="w-full">
            <img
              src={urlConToken(vistaPng)}
              alt={`Radiografía ${img.tipo_vista ?? ""}`}
              className="max-h-[280px] w-full object-contain rounded-lg"
              loading="lazy"
              onError={() => setSinVistaPrevia(true)}
            />
            <div className="mt-2 flex justify-center">
              <Button variant="secondary" size="sm" className="rounded-lg font-bold" asChild>
                <a href={urlConToken(img.imagen_url)} target="_blank" rel="noreferrer">
                  Abrir original
                </a>
              </Button>
            </div>
          </div>
        ) : esDcm ? (
          <div className="flex flex-col items-center text-center text-slate-300 py-8">
            <FileImage className="size-12 mb-2 opacity-70" />
            <span className="text-sm font-bold">Archivo DICOM</span>
            <span className="text-xs opacity-60 mt-1 max-w-[220px] truncate">
              {img.imagen_url.split("/").pop()}
            </span>
            <Button variant="secondary" size="sm" className="mt-3 rounded-lg font-bold" asChild>
              <a href={urlConToken(img.imagen_url)} target="_blank" rel="noreferrer">
                Abrir original
              </a>
            </Button>
          </div>
        ) : (
          <img
            src={urlConToken(img.imagen_url)}
            alt={`Radiografía ${img.tipo_vista ?? ""}`}
            className="max-h-[280px] w-full object-contain rounded-lg"
            loading="lazy"
          />
        )}
      </div>

      {/* Resultado independiente de esta imagen */}
      <div className="space-y-4 p-4">
        {pendiente ? (
          <p className="text-sm font-medium text-muted-foreground/75">
            Esta vista aún no tiene resultado de IA registrado.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                  positivo
                    ? "bg-red-500/8 text-red-600 border-red-500/15"
                    : "bg-emerald-500/8 text-emerald-600 border-emerald-500/15"
                )}
              >
                {positivo ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
              </div>
              <div className="min-w-0">
                <p className="font-extrabold tracking-tight text-foreground/90 leading-tight">
                  {positivo ? "Positivo para neumonía" : "Sin signos de neumonía"}
                </p>
                <p className="text-xs text-muted-foreground/70 font-medium mt-0.5">
                  Resultado independiente · umbral 0.50
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
                  Probabilidad
                </span>
                <span className="text-xl font-extrabold tabular-nums tracking-tight text-foreground/90">
                  {prob.toFixed(2)}
                  <span className="text-xs font-bold text-muted-foreground/70">%</span>
                </span>
              </div>
              <Progress
                value={prob}
                className={cn("h-2", positivo ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500")}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60">
                  Confianza radiográfica
                </span>
                <span className="text-xl font-extrabold tabular-nums tracking-tight text-foreground/90">
                  {confianza.toFixed(2)}
                  <span className="text-xs font-bold text-muted-foreground/70">%</span>
                </span>
              </div>
              <Progress value={confianza} className="h-2" />
            </div>
          </>
        )}

        <p className="text-[11px] text-muted-foreground/60 font-medium">
          Analizada el {formatearFecha(img.created_at)}
        </p>
      </div>
    </div>
  )
}

export default function ResultadoPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const atencionId = location.state?.atencionId as number | undefined

  const [diagnostico, setDiagnostico] = useState<DiagnosticoResponse | null>(null)
  const [atencion, setAtencion] = useState<AtencionResponse | null>(null)

  const handleRecargar = async () => {
    if (!atencionId) return
    const diag = await getDiagnosticoPorAtencion(atencionId)
    setDiagnostico(diag)
  }

  const [cargando, setCargando] = useState(true)

  // HU-04: validar el diagnóstico y emitir el reporte PDF dependen de
  // permisos concretos, no del rol. El backend también los exige (403).
  const { tienePermiso } = useAuth()
  const puedeValidar = tienePermiso(PERMISOS.DIAGNOSTICO_VALIDAR)
  const puedePdf = tienePermiso(PERMISOS.REPORTE_PDF)
  const [modalValidacionAbierto, setModalValidacionAbierto] = useState(false)
  const [generandoReporte, setGenerandoReporte] = useState(false)

  async function handleReportePdf() {
    if (generandoReporte || !diagnostico) return
    setGenerandoReporte(true)
    try {
      await generarReportePdf(diagnostico, atencion)
    } catch (error) {
      console.error("No se pudo generar el reporte PDF", error)
    } finally {
      setGenerandoReporte(false)
    }
  }


  useEffect(() => {
    if (!atencionId) return

    const loadData = async () => {
      try {
        const [diag, at] = await Promise.all([
          getDiagnosticoPorAtencion(atencionId),
          getAtencionPorId(atencionId).catch(() => null),
        ])
        setDiagnostico(diag)
        setAtencion(at)
      } catch (error) {
        console.error("Error al cargar el diagnóstico", error)
      } finally {
        setCargando(false)
      }
    }

    loadData()
  }, [atencionId])

  // Si acceden directamente a /resultado sin atencionId, redirigir a atenciones
  if (!atencionId) {
    return <Navigate to={PATHS.ATTENTIONS} replace />
  }

  if (cargando) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="space-y-2 pb-1">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[280px] rounded-2xl" />
          <Skeleton className="h-[280px] rounded-2xl" />
        </div>
        <Skeleton className="h-[160px] rounded-2xl" />
      </div>
    )
  }

  if (!diagnostico) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Card className="max-w-lg text-center">
          <CardHeader className="items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-600">
              <AlertTriangle className="size-6" />
            </div>
            <CardTitle>No se encontraron resultados</CardTitle>
            <CardDescription>
              No hay un diagnóstico asociado a esta atención médica o hubo un error al cargar los datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => navigate(PATHS.ATTENTIONS)} className="gap-2 rounded-xl font-bold">
              <ArrowLeft className="size-4" />
              Volver a atenciones
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const imagenes = [...(diagnostico.imagenes ?? [])].sort((a, b) => a.orden - b.orden)
  const conResultado = imagenes.filter((i) => i.probabilidad_ia != null)
  const nPositivas = imagenes.filter((i) => i.hallazgo_positivo === true).length
  const discordantes = nPositivas > 0 && nPositivas < conResultado.length
  const esPositivo = diagnostico.enfermo === true

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Soporte diagnóstico · Inteligencia artificial"
        title="Resultado del análisis IA"
        description="Revisa el resumen del caso y consulta después el fundamento clínico y el análisis de cada radiografía."
        actions={<>
          <Button variant="outline" onClick={() => navigate(PATHS.ATTENTIONS)} className="gap-2 rounded-lg">
            <ArrowLeft className="size-4" /> Atenciones
          </Button>
          {puedePdf && (
            <Button variant="outline" onClick={handleReportePdf} disabled={generandoReporte} className="gap-2 rounded-lg" title="Descargar reporte en PDF con diagnóstico, gravedad, radiografías y datos del paciente">
              <Printer className="size-4" />{generandoReporte ? "Generando..." : "Reporte PDF"}
            </Button>
          )}
          {puedeValidar && diagnostico.estado_validacion !== "Validado" && (
            <Button onClick={() => setModalValidacionAbierto(true)} className={cn("gap-2 rounded-lg", obtenerEstiloEstadoClinico(diagnostico.estado_validacion).boton)}>
              <Stethoscope className="size-4" /> Validar diagnóstico
            </Button>
          )}
        </>}
      />

      <ResumenCaso diagnostico={diagnostico} atencion={atencion} />

      {/* ── Resumen consolidado + confianza global ── */}
      <StaggerContainer className="grid gap-4 xl:grid-cols-[1.1fr_1fr] items-stretch" delay={80}>
        <StaggerItem index={0} className="h-full">
          <div className="space-y-4">
          <Card
            size="sm"
            className={cn(
              "border-l-[3px] hover:border-l-[4px]",
              esPositivo ? "border-l-red-500/70" : "border-l-emerald-500/70"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border transition-all duration-300",
                    esPositivo
                      ? "bg-red-500/8 text-red-600 border-red-500/15 dark:bg-red-950/35 dark:text-red-400"
                      : "bg-emerald-500/8 text-emerald-600 border-emerald-500/15 dark:bg-emerald-950/35 dark:text-emerald-400"
                  )}
                >
                  <Brain className="size-[18px]" strokeWidth={1.8} />
                </div>
                <div>
                  <CardTitle>Veredicto consolidado</CardTitle>
                </div>
              </div>
              <CardAction className="m-0">
                {esPositivo ? (
                  <Badge variant="grave">Positivo presuntivo</Badge>
                ) : (
                  <Badge variant="leve">Negativo presuntivo</Badge>
                )}
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 rounded-xl border border-border/40 bg-muted/20 p-4">
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl border",
                    esPositivo
                      ? "bg-red-500/8 text-red-600 border-red-500/15"
                      : "bg-emerald-500/8 text-emerald-600 border-emerald-500/15"
                  )}
                >
                  {esPositivo ? <AlertTriangle className="size-6" /> : <CheckCircle2 className="size-6" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold tracking-tight text-foreground/90 leading-tight">
                    {diagnostico.enfermo === true ? "Positivo para neumonía" : diagnostico.enfermo === false ? "Sin signos de neumonía" : "Pendiente de análisis"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground/75 leading-relaxed">
                    {nPositivas} de {conResultado.length} vista{conResultado.length === 1 ? "" : "s"} con hallazgos
                    compatibles con neumonía.
                  </p>
                </div>
              </div>
              {discordantes && (
                <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3.5 text-sm">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
                  <p className="font-medium text-muted-foreground/80 leading-relaxed">
                    Las vistas muestran resultados distintos entre sí. El detalle por imagen está abajo;
                    se recomienda correlación clínica.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <PrioridadFinal diagnostico={diagnostico} atencion={atencion} />
          </div>
        </StaggerItem>

        <StaggerItem index={1} className="h-full">
          <Card size="sm" className="h-full border-l-[3px] border-l-blue-500/70 hover:border-l-[4px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl border bg-blue-500/8 text-blue-600 border-blue-500/15 dark:bg-blue-950/35 dark:text-blue-400">
                  <Stethoscope className="size-[18px]" strokeWidth={1.8} />
                </div>
                <div>
                  <CardTitle>Evaluación clínica CRB-65</CardTitle>
                  <CardDescription>Score clínico · independiente del resultado de IA</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Crb65Resultado
                puntaje={atencion?.crb65_puntaje}
                gravedad={atencion?.crb65_gravedad}
                detalle={atencion?.crb65_detalle}
              />
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      <StaggerContainer delay={90}>
        <StaggerItem index={0}>
          <InfoPacienteAtencion atencion={atencion} />
        </StaggerItem>
      </StaggerContainer>

      {/* ── Resultados independientes por imagen ── */}
      <StaggerContainer className="space-y-4" delay={100}>
        <StaggerItem index={0}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <Images className="size-5 text-primary" />
                Resultados por imagen
              </h2>
              <p className="text-sm text-muted-foreground">
                Cada vista AP/PA tiene su propia probabilidad, confianza y hallazgo.
              </p>
            </div>
            <Badge variant="outline" className="font-mono w-fit">
              {imagenes.length}/2 vistas
            </Badge>
          </div>
        </StaggerItem>
        <StaggerItem index={1}>
          {imagenes.length === 0 ? (
            <Card size="sm">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="size-14 rounded-full bg-muted/40 flex items-center justify-center mb-3">
                  <FolderOpen className="size-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-bold text-foreground">Sin imágenes asociadas</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Esta atención aún no tiene radiografías AP/PA registradas para mostrar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {imagenes.map((img) => (
                <TarjetaImagenResultado 
                  key={img.id} 
                  img={img} 
                  esReferencia={diagnostico.imagen_referencia_id === img.id}
                />
              ))}
            </div>
          )}
        </StaggerItem>
      </StaggerContainer>

      {/* ── Advertencia clínica (sobria, no alarmista) ── */}
      <StaggerContainer delay={60}>
        <StaggerItem index={0}>
          <Card size="sm" className="border-amber-500/20 bg-amber-500/[0.04]">
            <CardContent className="flex gap-4 pt-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600">
                <ShieldAlert className="size-[18px]" strokeWidth={1.8} />
              </div>
              <div className="text-sm space-y-1">
                <p className="font-bold text-foreground/90">Advertencia clínica · Diagnóstico presuntivo</p>
                <p className="text-muted-foreground/80 leading-relaxed font-medium">
                  Estos resultados son un apoyo generado por inteligencia artificial y{" "}
                  <strong className="text-foreground/90">no reemplazan el criterio médico profesional</strong>.
                  Deben ser evaluados y validados por un médico especialista antes de definir el tratamiento del paciente.
                </p>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* ── MODAL DE VALIDACION ── */}
      <RegistroDiagnosticoFinalDialog
        diagnosticoId={diagnostico.id}
        abierto={modalValidacionAbierto}
        onCambioAbierto={setModalValidacionAbierto}
        onValidadoExitosamente={handleRecargar}
      />

    </div>
  )
}
