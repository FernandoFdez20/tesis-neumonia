import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import type { AtencionResponse } from "@/services/atenciones.service"
import type { DiagnosticoResponse, DiagnosticoImagen } from "@/types/diagnostico"

// Las fuentes estándar de jsPDF solo cubren latin-1: la flecha "→" que usa
// la regla de priorización se corrompe al imprimir ("!'/Crít ica").
// Se normaliza a ASCII antes de escribir en el PDF.
function textoPdf(valor: unknown): string {
  return String(valor ?? "—")
    .replace(/[→⇒]/g, "->")
    .replace(/[‹›«»]/g, '"')
    .normalize("NFC")
}

function fechaLarga(fecha: string | null | undefined): string {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function fechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—"
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

function baseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (apiUrl) return apiUrl.replace("/api/v1", "")
  return "http://localhost:8000"
}

// URL visible de la imagen: el PNG vive junto al DICOM (abc.dcm -> abc.png).
function urlVisible(img: DiagnosticoImagen): string {
  const base = baseUrl()
  if (img.imagen_url.toLowerCase().endsWith(".dcm")) {
    return `${base}${img.imagen_url.replace(/\.dcm$/i, ".png")}`
  }
  return `${base}${img.imagen_url}`
}

type ImagenLista = { dataUrl: string; ancho: number; alto: number }

// Carga la vista previa por <img> + canvas (en vez de fetch/blob):
// 1) evita el bloqueo CORS que sufre fetch en algunos despliegues,
// 2) reduce la imagen a máx. 900 px en JPEG (el PNG a resolución completa
//    pesa varios MB e hincha/rompe el PDF).
// Si una URL falla se prueba con la siguiente; si todas fallan se avisa
// en consola con la URL para diagnosticar y el reporte sigue sin romperse.
function viaCanvas(url: string, maxDim = 900): Promise<ImagenLista | null> {
  return new Promise((resolve) => {
    const fin = setTimeout(() => resolve(null), 20000)
    const el = new Image()
    el.crossOrigin = "anonymous"
    el.onload = () => {
      try {
        const escala = Math.min(1, maxDim / Math.max(el.naturalWidth, el.naturalHeight))
        const w = Math.max(1, Math.round(el.naturalWidth * escala))
        const h = Math.max(1, Math.round(el.naturalHeight * escala))
        const lienzo = document.createElement("canvas")
        lienzo.width = w
        lienzo.height = h
        lienzo.getContext("2d")?.drawImage(el, 0, 0, w, h)
        const dataUrl = lienzo.toDataURL("image/jpeg", 0.85)
        clearTimeout(fin)
        resolve({ dataUrl, ancho: w, alto: h })
      } catch {
        clearTimeout(fin)
        resolve(null)
      }
    }
    el.onerror = () => {
      clearTimeout(fin)
      resolve(null)
    }
    el.src = url
  })
}

async function cargarImagen(urls: string[]): Promise<ImagenLista | null> {
  for (const url of urls) {
    const r = await viaCanvas(url)
    if (r) return r
  }
  console.warn("[Reporte PDF] no se pudo incrustar la vista previa:", urls[0])
  return null
}

/**
 * Genera un PDF clínico real (no impresión del navegador) con
 * diagnóstico, gravedad, radiografías y datos del paciente.
 */
export async function generarReportePdf(
  diagnostico: DiagnosticoResponse,
  atencion: AtencionResponse | null
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const codigo = `AT-${String(diagnostico.atencion_medica_id).padStart(4, "0")}`
  const positivo = diagnostico.enfermo === true
  const veredicto =
    diagnostico.enfermo === true
      ? "POSITIVO presuntivo para neumonia"
      : diagnostico.enfermo === false
        ? "NEGATIVO presuntivo (sin signos de neumonia)"
        : "Pendiente de analisis"
  const detalle = (diagnostico.prioridad_detalle ?? {}) as Record<string, unknown>
  const imagenes = [...(diagnostico.imagenes ?? [])].sort((a, b) => a.orden - b.orden)

  // Franja de cabecera institucional
  doc.setFillColor(23, 92, 140)
  doc.rect(0, 0, 210, 30, "F")
  doc.setTextColor(255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text("PLATAFORMA CLINICA · SOPORTE DIAGNOSTICO DE NEUMONIA EN ADULTOS", 14, 10)
  doc.setFontSize(16)
  doc.text("Reporte de soporte diagnostico presuntivo", 14, 18)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(textoPdf(`${codigo} · Emitido el ${fechaLarga(new Date().toISOString())}`), 14, 24)

  let y = 36
  const seccion = (titulo: string, filas: [string, string][]) => {
    if (y > 258) {
      doc.addPage()
      y = 14
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(23, 92, 140)
    doc.text(textoPdf(titulo), 14, y)
    doc.setDrawColor(23, 92, 140)
    doc.line(14, y + 1.5, 196, y + 1.5)
    autoTable(doc, {
      startY: y + 4,
      margin: { left: 14, right: 14 },
      body: filas.map(([k, v]) => [textoPdf(k), textoPdf(v)]),
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, overflow: "linebreak", textColor: 20 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 52, fillColor: [235, 243, 249], textColor: 40 },
        1: { cellWidth: "auto" },
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  seccion("1. Datos del paciente", [
    ["Nombres y apellidos", atencion?.paciente_nombre ?? "—"],
    ["DNI", atencion?.paciente_dni ?? "—"],
    ["Edad", atencion?.paciente_edad != null ? `${atencion.paciente_edad} años` : "—"],
    ["Sexo", atencion?.paciente_sexo ?? "—"],
  ])

  seccion("2. Atencion y signos vitales", [
    ["Fecha de atencion", fechaCorta(atencion?.fecha_registro)],
    ["Motivo de consulta", atencion?.sintomas_principales ?? "—"],
    ["Temperatura", atencion?.temperatura != null ? `${atencion.temperatura} °C` : "—"],
    ["Frecuencia cardiaca", atencion?.frecuencia_cardiaca != null ? `${atencion.frecuencia_cardiaca} lpm` : "—"],
    ["Frecuencia respiratoria", atencion?.frecuencia_respiratoria != null ? `${atencion.frecuencia_respiratoria} rpm` : "—"],
    ["Saturacion O2", atencion?.saturacion_o2 != null ? `${atencion.saturacion_o2} %` : "—"],
    ["Presion arterial", atencion?.presion_arterial ?? "—"],
    ["Examen fisico", atencion?.examen_fisico ?? "—"],
  ])

  // Veredicto destacado (banner, no solo tabla)
  if (y > 250) {
    doc.addPage()
    y = 14
  }
  doc.setFillColor(...(positivo ? [253, 232, 232] as [number, number, number] : [209, 250, 229] as [number, number, number]))
  doc.setDrawColor(...(positivo ? [220, 38, 38] as [number, number, number] : [5, 150, 105] as [number, number, number]))
  doc.roundedRect(14, y, 182, 16, 2, 2, "FD")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(...(positivo ? [153, 27, 27] as [number, number, number] : [6, 95, 70] as [number, number, number]))
  doc.text(textoPdf(`Veredicto: ${veredicto}`), 18, y + 10)
  y += 22
  doc.setTextColor(0)

  seccion("3. Resultado de IA por vista (DenseNet121, umbral 0.50)", [
    ...imagenes.map(
      (img): [string, string] => [
        `Vista ${img.tipo_vista ?? "—"} (#${img.orden})`,
        img.probabilidad_ia == null
          ? "Pendiente"
          : `${img.hallazgo_positivo ? "Positivo" : "Negativo"} · prob. ${(Number(img.probabilidad_ia) * 100).toFixed(2)} % · conf. ${Number(img.confianza_radiografica ?? 0).toFixed(2)} %`,
      ]
    ),
  ])

  // Radiografías incrustadas con su pie de resultado
  if (imagenes.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = 14
    }
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(23, 92, 140)
    doc.text("4. Radiografias analizadas", 14, y)
    doc.setDrawColor(23, 92, 140)
    doc.line(14, y + 1.5, 196, y + 1.5)
    y += 6

    // Se prueba primero la vista previa PNG y luego el archivo original.
    const cargadas = await Promise.all(
      imagenes.map((img) => cargarImagen([urlVisible(img), `${baseUrl()}${img.imagen_url}`]))
    )
    const conImagen = imagenes
      .map((img, i) => ({ img, foto: cargadas[i] }))
      .filter((x) => x.foto !== null)
    const altoCaja = conImagen.length > 1 ? 58 : 80
    const altoPie = 16
    const anchoCaja = conImagen.length > 1 ? 88 : 120
    let x = conImagen.length > 1 ? 14 : (210 - anchoCaja) / 2
    conImagen.forEach(({ img, foto }, idx) => {
      if (y + altoCaja + altoPie + 4 > 285) {
        doc.addPage()
        y = 14
        x = conImagen.length > 1 ? 14 : (210 - anchoCaja) / 2
      }
      const f = foto as ImagenLista
      const escala = Math.min(anchoCaja / f.ancho, altoCaja / f.alto)
      const w = f.ancho * escala
      const h = f.alto * escala
      try {
        doc.addImage(f.dataUrl, "JPEG", x + (anchoCaja - w) / 2, y, w, h)
      } catch {
        doc.setFontSize(9)
        doc.text("Imagen no disponible", x + 4, y + 10)
      }
      // Pie con etiqueta + probabilidad + confianza de ESTA vista
      const esPos = img.hallazgo_positivo === true
      const etiqueta = img.hallazgo_positivo == null ? "Pendiente" : esPos ? "Positivo" : "Negativo"
      const cx = x + anchoCaja / 2
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(...(esPos ? [153, 27, 27] as [number, number, number] : [6, 95, 70] as [number, number, number]))
      doc.text(textoPdf(`Vista ${img.tipo_vista ?? "?"} · ${etiqueta}`), cx, y + altoCaja + 5, { align: "center", maxWidth: anchoCaja })
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(0)
      doc.text(
        textoPdf(
          img.probabilidad_ia != null
            ? `Probabilidad: ${(Number(img.probabilidad_ia) * 100).toFixed(2)} % · Confianza: ${Number(img.confianza_radiografica ?? 0).toFixed(2)} %`
            : "Sin resultado de IA registrado"
        ),
        cx,
        y + altoCaja + 10,
        { align: "center", maxWidth: anchoCaja }
      )
      if (conImagen.length > 1) {
        x += anchoCaja + 6
        if (idx % 2 === 1) {
          x = 14
          y += altoCaja + altoPie + 6
        }
      } else {
        y += altoCaja + altoPie + 6
      }
    })
    if (conImagen.length > 1 && conImagen.length % 2 === 1) y += altoCaja + altoPie + 6
    if (conImagen.length === 0) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text("Imagenes no disponibles en este reporte (verlas en el sistema).", 14, y)
      y += 8
    }
    if (conImagen.length !== imagenes.length) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text("Nota: alguna vista previa no pudo incrustarse (ver el sistema).", 14, y)
      y += 8
    }
    y += 2
  }

  seccion("5. Gravedad y priorizacion", [
    ["CRB-65", atencion?.crb65_puntaje != null ? `${atencion.crb65_puntaje} pts · ${atencion.crb65_gravedad ?? "—"}` : "—"],
    ["Prioridad final", diagnostico.prioridad_final ?? "—"],
    ["Regla aplicada", String(detalle.regla_aplicada ?? "—")],
    ["Estado de validacion", diagnostico.estado_validacion ?? "—"],
  ])

  seccion("6. Validacion medica", [
    ["Clasificacion del medico", diagnostico.clasificacion_medico ?? "Pendiente"],
    ["Descripcion clinica", diagnostico.diagnostico_descripcion ?? "—"],
    ["Concordancia con IA", diagnostico.concordancia_ia ?? "—"],
    ["Fecha de validacion", fechaLarga(diagnostico.fecha_validacion)],
  ])

  // Advertencia + firmas
  if (y > 240) {
    doc.addPage()
    y = 14
  }
  doc.setFillColor(255, 251, 235)
  doc.setDrawColor(180, 120, 20)
  const aviso = textoPdf(
    "Advertencia clinica: resultado presuntivo generado por inteligencia artificial como apoyo " +
      "diagnostico. No reemplaza el criterio medico profesional y requiere validacion por un medico " +
      "especialista antes de definir tratamiento."
  )
  const lineas = doc.splitTextToSize(aviso, 178)
  const altoAviso = lineas.length * 4.5 + 10
  doc.roundedRect(14, y, 182, altoAviso, 2, 2, "FD")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(120, 70, 0)
  doc.text("Advertencia clinica:", 18, y + 6)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0)
  lineas.forEach((linea: string, i: number) => {
    doc.text(linea, 18, y + 11 + i * 4.5)
  })
  const yFirmas = y + altoAviso + 18
  doc.text("___________________________", 20, yFirmas)
  doc.text("Medico validador · Firma y sello", 20, yFirmas + 5)
  doc.text("___________________________", 130, yFirmas)
  doc.text("Fecha y hora de emision", 130, yFirmas + 5)

  // Pie con numeración
  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text(`Respaldo clinico · ${codigo} · Pagina ${i} de ${paginas}`, 14, 290)
  }

  doc.save(`Reporte_${codigo}_${atencion?.paciente_dni ?? "paciente"}.pdf`)
}
