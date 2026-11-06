const { readFileSync } = require("node:fs")
const { resolve } = require("node:path")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")
const React = require("react")
const { renderToStaticMarkup } = require("react-dom/server")

function cargar(ruta, dependencias = require) {
  const modulo = { exports: {} }
  const fuente = readFileSync(resolve(__dirname, "..", ruta), "utf8")
  const js = ts.transpileModule(fuente, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  new Function("require", "module", "exports", js)(dependencias, modulo, modulo.exports)
  return modulo.exports
}

const datosAtencion = cargar("src/lib/datos-atencion.ts")
const datos = {
  documento_paciente: "12345678", nombre_paciente: "Paciente sintético",
  fecha_atencion: "2026-10-21", hora_atencion: "00:17", motivo_consulta: "Falta de aire",
  temperatura: "37.5", frecuencia_cardiaca: "88", frecuencia_respiratoria: "22",
  saturacion_o2: "96", presion_arterial: "120/80", tiempo_evolucion_dias: "5",
  sintomas_principales: "Tos seca", observaciones: "Reevaluar evolución", confusion: false,
  estado_atencion: "pendiente-evaluacion",
}

test("el servicio envía motivo, fecha y hora sin sustituir síntomas ni observaciones", async () => {
  let guardada
  const api = {
    get: async (ruta) => ({ data: ruta.startsWith("/pacientes/dni/") ? { id: 7 } : guardada }),
    post: async (ruta, payload) => {
      assert.equal(ruta, "/atenciones/")
      guardada = { ...payload, id: 12, fecha_registro: "2026-11-04T12:00:00" }
      return { data: guardada }
    },
  }
  const servicio = cargar("src/services/atenciones.service.ts", () => ({ __esModule: true, default: api }))
  const creada = await servicio.registrarAtencion(datos)
  assert.equal(creada.paciente_id, 7)
  assert.equal(creada.motivo_consulta, datos.motivo_consulta)
  assert.equal(creada.fecha_atencion, datos.fecha_atencion)
  assert.equal(creada.hora_atencion, datos.hora_atencion)
  assert.equal(creada.sintomas_principales, "Tos seca | Obs: Reevaluar evolución")
  assert.equal(creada.temperatura, 37.5)
  assert.equal(creada.confusion, false)
  assert.deepEqual(await servicio.getAtencionPorId(12), creada)
})

test("la fecha local seleccionada conserva el día y la hora, incluida medianoche", () => {
  for (const hora of ["00:17:00", "23:59:00"]) {
    const fecha = new Date(datosAtencion.obtenerFechaHoraAtencion({ ...datos, hora_atencion: hora }))
    assert.equal(fecha.getDate(), 21)
    assert.equal(fecha.getMonth(), 9)
    assert.equal(fecha.getHours(), Number(hora.slice(0, 2)))
  }
  const anterior = { fecha_registro: "2026-10-20T11:45:00", sintomas_principales: "Síntoma histórico" }
  assert.equal(datosAtencion.obtenerFechaHoraAtencion(anterior), anterior.fecha_registro)
  assert.equal(datosAtencion.obtenerMotivoConsulta(anterior), anterior.sintomas_principales)
  assert.equal(datosAtencion.obtenerMotivoConsulta(datos), "Falta de aire")
})

function envoltorio({ children }) { return React.createElement("div", null, children) }

test("el panel muestra los conteos de la API con las cuatro categorías de prioridad", () => {
  const conteos = { Baja: 2, Moderada: 3, Alta: 4, Crítica: 5 }
  const { default: Dashboard } = cargar("src/pages/dashboard/page.tsx", (nombre) => {
    if (nombre === "@tanstack/react-query") return { useQuery: () => ({ data: { conteos, casos: [] } }) }
    if (nombre === "@/types/diagnostico") return cargar("src/types/diagnostico.ts")
    if (nombre === "@/components/shared/stagger-animation") return { StaggerContainer: envoltorio, StaggerItem: envoltorio }
    if (nombre === "@/components/shared/page-header") return { PageHeader: () => null }
    if (nombre === "@/components/dashboard/quick-actions") return { QuickActions: () => null }
    if (nombre === "@/components/dashboard/recent-attentions-table") return { RecentAttentionsTable: () => null }
    if (nombre === "@/components/dashboard/priority-cases") return { PriorityCases: () => null }
    if (nombre === "@/components/dashboard/dashboard-skeleton") return { DashboardSkeleton: () => null }
    if (nombre === "@/services/diagnosticos.service") return { getPrioridadesPendientes: () => {} }
    return require(nombre)
  })
  const texto = renderToStaticMarkup(React.createElement(Dashboard)).replace(/<[^>]*>/g, " ")
  for (const [prioridad, cantidad] of Object.entries(conteos)) {
    assert.match(texto, new RegExp(`Prioridad ${prioridad}\\s+${cantidad}`))
  }
  assert.doesNotMatch(texto, /Prioridad Leve/)
})

test("el resumen recupera motivo, síntomas y fecha/hora seleccionados", () => {
  const { InfoPacienteAtencion } = cargar("src/components/resultado/info-paciente-atencion.tsx", (nombre) => {
    if (nombre === "@/lib/datos-atencion") return datosAtencion
    if (nombre === "@/components/ui/card") return {
      Card: envoltorio, CardHeader: envoltorio, CardContent: envoltorio, CardTitle: envoltorio,
    }
    if (nombre === "@/components/ui/badge") return { Badge: envoltorio }
    return require(nombre)
  })
  const texto = renderToStaticMarkup(React.createElement(InfoPacienteAtencion, { atencion: {
    ...datos, id: 12, paciente_id: 7, fecha_registro: "2026-11-04T12:00:00",
  } })).replace(/<[^>]*>/g, " ")
  assert.match(texto, /Falta de aire/)
  assert.match(texto, /Tos seca/)
  assert.match(texto, /21 oct/)
  assert.match(texto, /(?:00:17|12:17 a\.)/)
})

test("el PDF conserva el motivo y la fecha/hora elegidos junto a los síntomas", async () => {
  let documento
  const { jsPDF } = require("jspdf")
  const { generarReportePdf } = cargar("src/services/reporte-pdf.service.ts", (nombre) => {
    if (nombre === "@/lib/datos-atencion") return datosAtencion
    if (nombre === "@/lib/archivos") return { urlConToken: (url) => url }
    if (nombre === "jspdf") return { jsPDF: function (...args) {
      documento = new jsPDF(...args)
      documento.save = () => {}
      return documento
    } }
    return require(nombre)
  })
  await generarReportePdf({ atencion_medica_id: 12, enfermo: false, imagenes: [] }, {
    ...datos, id: 12, paciente_id: 7, fecha_registro: "2026-11-04T12:00:00",
  })
  const pdf = documento.output()
  assert.match(pdf, /Falta de aire/)
  assert.match(pdf, /Tos seca/)
  assert.match(pdf, /21 de octubre de 2026/)
  assert.match(pdf, /(?:00:17|12:17 a\.)/)
})
