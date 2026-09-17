import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { UploadCloud, FileImage, X, Play, ArrowLeft, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PATHS } from "@/routes/paths"
import { getAtencionPorId, type AtencionResponse } from "@/services/atenciones.service"
import { cargarRadiografias, getDiagnosticoPorAtencion, vistaPreviaDicom } from "@/services/diagnosticos.service"

// We will assume that `getAtencionPorId` is added in the service.
// Let's create the component first, and then we will check the service.

type TipoVista = "AP" | "PA"

export default function CargarRadiografiaPage() {
  const { atencionId } = useParams()
  const navigate = useNavigate()
  
  const [atencion, setAtencion] = useState<AtencionResponse | null>(null)
  const [cargandoInfo, setCargandoInfo] = useState(true)
  const [procesando, setProcesando] = useState(false)

  // Estados para archivos
  const [archivoAP, setArchivoAP] = useState<File | null>(null)
  const [archivoPA, setArchivoPA] = useState<File | null>(null)
  const [previewAP, setPreviewAP] = useState<string | null>(null)
  const [previewPA, setPreviewPA] = useState<string | null>(null)
  const [cargandoPreviewAP, setCargandoPreviewAP] = useState(false)
  const [cargandoPreviewPA, setCargandoPreviewPA] = useState(false)

  // Contador para descartar respuestas de vista previa que lleguen tarde
  // (si el usuario cambia de archivo antes de que responda el backend).
  const secuenciaPreview = useRef({ AP: 0, PA: 0 })

  const inputRefAP = useRef<HTMLInputElement>(null)
  const inputRefPA = useRef<HTMLInputElement>(null)

  const revocarPreview = (url: string | null) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url)
  }

  const pedirVistaPreviaDicom = async (file: File, tipo: TipoVista) => {
    const setCargando = tipo === "AP" ? setCargandoPreviewAP : setCargandoPreviewPA
    const setPreview = tipo === "AP" ? setPreviewAP : setPreviewPA
    const secuencia = ++secuenciaPreview.current[tipo]
    setCargando(true)
    try {
      const url = await vistaPreviaDicom(file)
      // Solo aplica si el usuario no cambió de archivo mientras tanto
      if (secuenciaPreview.current[tipo] === secuencia) {
        setPreview((anterior) => {
          revocarPreview(anterior)
          return url
        })
      } else {
        revocarPreview(url)
      }
    } catch {
      if (secuenciaPreview.current[tipo] === secuencia) {
        toast.error("No se pudo previsualizar el DICOM. Se analizará al iniciar el análisis.")
      }
    } finally {
      if (secuenciaPreview.current[tipo] === secuencia) setCargando(false)
    }
  }

  const asignarArchivo = (tipo: TipoVista, file: File | null) => {
    const setArchivo = tipo === "AP" ? setArchivoAP : setArchivoPA
    const setPreview = tipo === "AP" ? setPreviewAP : setPreviewPA
    const previewActual = tipo === "AP" ? previewAP : previewPA

    // Invalida vistas previas en curso de este lado
    secuenciaPreview.current[tipo]++
    revocarPreview(previewActual)
    setPreview(null)
    if (tipo === "AP") setCargandoPreviewAP(false)
    else setCargandoPreviewPA(false)
    setArchivo(file)

    if (!file) return
    const esDicom = file.name.toLowerCase().endsWith(".dcm")
    if (esDicom) {
      // El navegador no muestra DICOM: se pide el PNG al backend (sin guardar nada).
      pedirVistaPreviaDicom(file, tipo)
    } else {
      setPreview(URL.createObjectURL(file))
    }
  }

  // Revocar previews al salir de la página
  useEffect(() => {
    return () => {
      revocarPreview(previewAP)
      revocarPreview(previewPA)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    async function load() {
      try {
        if (!atencionId) return
        const atencionData = await getAtencionPorId(Number(atencionId))
        setAtencion(atencionData)

        // Intentar cargar imágenes existentes
        try {
          const diag = await getDiagnosticoPorAtencion(Number(atencionId))
          if (diag && diag.imagenes) {
            const imgAP = diag.imagenes.find(img => img.tipo_vista === "AP")
            const imgPA = diag.imagenes.find(img => img.tipo_vista === "PA")
            
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
            const baseUrl = apiUrl.replace("/api/v1", "")

            const fetchFile = async (url: string, nombre: string) => {
              const res = await fetch(`${baseUrl}${url}`)
              const blob = await res.blob()
              return new File([blob], nombre, { type: blob.type })
            }

            if (imgAP) {
              const file = await fetchFile(imgAP.imagen_url, "vista_AP.dcm")
              asignarArchivo("AP", file)
            }
            if (imgPA) {
              const file = await fetchFile(imgPA.imagen_url, "vista_PA.dcm")
              asignarArchivo("PA", file)
            }
          }
        } catch (e) {
          // Si da 404, significa que aún no tiene diagnóstico
        }
      } catch (error) {
        toast.error("Error al cargar datos del paciente.")
        navigate(PATHS.RADIOGRAPHY)
      } finally {
        setCargandoInfo(false)
      }
    }
    load()
  }, [atencionId, navigate])

  const validarArchivo = (file: File) => {
    const isImage = file.type.startsWith('image/')
    const isDicom = file.name.toLowerCase().endsWith('.dcm') || file.type === 'application/dicom'
    if (!isImage && !isDicom) {
      toast.error(`Formato no válido: ${file.name}`)
      return false
    }
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: TipoVista) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!validarArchivo(file)) return
      asignarArchivo(tipo, file)
    }
  }

  const removeFile = (tipo: TipoVista) => {
    asignarArchivo(tipo, null)
    if (tipo === "AP") {
      if (inputRefAP.current) inputRefAP.current.value = ""
    } else {
      if (inputRefPA.current) inputRefPA.current.value = ""
    }
  }

  const handleLimpiar = () => {
    removeFile("AP")
    removeFile("PA")
  }

  const handleGuardar = async () => {
    if (!archivoAP && !archivoPA) {
      toast.error("Debe subir al menos una imagen (AP o PA).")
      return
    }

    try {
      setProcesando(true)
      await cargarRadiografias(Number(atencionId), archivoAP, archivoPA)
      toast.success("Radiografías guardadas correctamente.")
      navigate(PATHS.RADIOGRAPHY)
    } catch (error) {
      toast.error("Error al cargar las imágenes. Intente nuevamente.")
    } finally {
      setProcesando(false)
    }
  }

  if (cargandoInfo) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!atencion) return null

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6 max-w-7xl mx-auto w-full">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(PATHS.RADIOGRAPHY)} className="shrink-0 -ml-2">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ImageIcon className="size-6 text-primary" />
              Cargar Radiografías
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Suba las imágenes DICOM o estándar para iniciar el diagnóstico IA.
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") ? (
            <Button variant="outline" onClick={() => navigate(PATHS.RESULTS, { state: { atencionId: atencion.id } })} className="flex-1 sm:flex-none">
              Ver Resultados IA
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleLimpiar} disabled={procesando} className="flex-1 sm:flex-none">
                Limpiar todo
              </Button>
              <Button onClick={handleGuardar} disabled={procesando || (!archivoAP && !archivoPA)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Play className="size-4" />
                {procesando ? "Procesando..." : "Iniciar Análisis"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info del paciente */}
      <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-background">
              AT-{String(atencion.id).padStart(4, '0')}
            </Badge>
            <Badge className="bg-emerald-500/10 text-emerald-700">
              {atencion.paciente_estado_clinico}
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {atencion.paciente_nombre} <span className="text-muted-foreground font-medium text-base">({atencion.paciente_edad} años)</span>
          </h3>
        </div>
        <div className="text-sm bg-background p-3 rounded-xl border max-w-sm w-full">
          <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground block mb-1">Motivo de consulta</span>
          <span className="font-medium text-foreground/80 line-clamp-2">{atencion.sintomas_principales || "No registrado"}</span>
        </div>
      </div>

      {/* Zonas de carga */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* VISTA AP */}
        <div className="flex flex-col h-full bg-card border shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
            <div>
              <h4 className="font-bold text-foreground">Vista Anteroposterior (AP)</h4>
              <p className="text-xs text-muted-foreground">Requerido (Recomendado)</p>
            </div>
            {archivoAP && !["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") && (
              <Button variant="ghost" size="icon" onClick={() => removeFile("AP")} disabled={procesando} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 size-8">
                <X className="size-4" />
              </Button>
            )}
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {!archivoAP ? (
              <div 
                onClick={() => !["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") && inputRefAP.current?.click()}
                className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
                  ["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") 
                    ? "border-muted bg-muted/5 cursor-not-allowed"
                    : "border-primary/20 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                }`}
              >
                <input type="file" ref={inputRefAP} className="hidden" accept="image/jpeg, image/png, .dcm, application/dicom" onChange={(e) => handleFileChange(e, "AP")} disabled={procesando || ["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "")} />
                <UploadCloud className="size-12 text-muted-foreground/40 mb-4" />
                <p className="font-medium text-foreground">Seleccionar vista AP</p>
                <p className="text-xs text-muted-foreground mt-1">DICOM, JPG o PNG</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative bg-muted/10 rounded-xl border p-4 group">
                {previewAP ? (
                  <img src={previewAP} alt="Preview AP" className="max-h-[300px] object-contain rounded-lg shadow-sm" />
                ) : cargandoPreviewAP ? (
                  <div className="flex flex-col items-center text-primary py-8">
                    <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full mb-3" />
                    <span className="font-bold text-sm">Generando vista previa...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-primary">
                    <FileImage className="size-16 mb-2 opacity-80" />
                    <span className="font-bold">Archivo DICOM</span>
                  </div>
                )}
                <div className="mt-4 bg-background px-3 py-1.5 rounded border text-sm font-medium w-full text-center truncate">
                  {archivoAP.name} <span className="text-muted-foreground text-xs ml-1">({(archivoAP.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VISTA PA */}
        <div className="flex flex-col h-full bg-card border shadow-sm rounded-2xl overflow-hidden">
          <div className="bg-muted/30 p-4 border-b flex justify-between items-center">
            <div>
              <h4 className="font-bold text-foreground">Vista Posteroanterior (PA)</h4>
              <p className="text-xs text-muted-foreground">Opcional</p>
            </div>
            {archivoPA && !["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") && (
              <Button variant="ghost" size="icon" onClick={() => removeFile("PA")} disabled={procesando} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 size-8">
                <X className="size-4" />
              </Button>
            )}
          </div>
          <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
            {!archivoPA ? (
              <div 
                onClick={() => !["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") && inputRefPA.current?.click()}
                className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
                  ["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "") 
                    ? "border-muted bg-muted/5 cursor-not-allowed"
                    : "border-primary/20 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                }`}
              >
                <input type="file" ref={inputRefPA} className="hidden" accept="image/jpeg, image/png, .dcm, application/dicom" onChange={(e) => handleFileChange(e, "PA")} disabled={procesando || ["Pendiente de validación", "Validado"].includes(atencion.paciente_estado_clinico || "")} />
                <UploadCloud className="size-12 text-muted-foreground/40 mb-4" />
                <p className="font-medium text-foreground">Seleccionar vista PA</p>
                <p className="text-xs text-muted-foreground mt-1">DICOM, JPG o PNG</p>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center relative bg-muted/10 rounded-xl border p-4 group">
                {previewPA ? (
                  <img src={previewPA} alt="Preview PA" className="max-h-[300px] object-contain rounded-lg shadow-sm" />
                ) : cargandoPreviewPA ? (
                  <div className="flex flex-col items-center text-primary py-8">
                    <div className="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full mb-3" />
                    <span className="font-bold text-sm">Generando vista previa...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-primary">
                    <FileImage className="size-16 mb-2 opacity-80" />
                    <span className="font-bold">Archivo DICOM</span>
                  </div>
                )}
                <div className="mt-4 bg-background px-3 py-1.5 rounded border text-sm font-medium w-full text-center truncate">
                  {archivoPA.name} <span className="text-muted-foreground text-xs ml-1">({(archivoPA.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
