const { readFileSync } = require("node:fs")
const { resolve } = require("node:path")
const { test } = require("node:test")
const assert = require("node:assert/strict")
const ts = require("typescript")

function cargar(ruta, dependencias = require) {
  const modulo = { exports: {} }
  const fuente = readFileSync(resolve(__dirname, "..", ruta), "utf8")
  const js = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  new Function("require", "module", "exports", js)(dependencias, modulo, modulo.exports)
  return modulo.exports
}

const auth = cargar("src/hooks/use-auth.ts")
const { obtenerAccionAtencion } = cargar("src/lib/accion-atencion.ts", (nombre) =>
  nombre === "@/hooks/use-auth" ? auth : require(nombre))
const { obtenerEstiloEstadoClinico } = cargar("src/lib/estado-clinico.ts")
const estados = ["Pendiente de evaluación", "Derivado a radiografía", "Diagnostico pendiente", "Pendiente de validación", "Validado", "Sin atención pendiente"]

test("cada estado tiene un color propio y su botón conserva el color del badge", () => {
  const colores = estados.map((estado) => {
    const estilo = obtenerEstiloEstadoClinico(estado)
    const colorBadge = estilo.badge.match(/bg-([a-z]+)-/)[1]
    assert.equal(estilo.boton.match(/bg-([a-z]+)-/)[1], colorBadge)
    return colorBadge
  })
  assert.equal(new Set(colores).size, estados.length)
})

test("las acciones permitidas corresponden con cada etapa", () => {
  const permisos = () => true
  assert.equal(obtenerAccionAtencion(estados[0], permisos).tipo, "evaluar")
  assert.equal(obtenerAccionAtencion(estados[1], permisos).tipo, "radiografia")
  assert.equal(obtenerAccionAtencion(estados[2], permisos).tipo, "radiografia")
  assert.equal(obtenerAccionAtencion(estados[3], permisos).etiqueta, "Revisar y validar")
  assert.equal(obtenerAccionAtencion(estados[4], permisos).etiqueta, "Ver diagnóstico y reporte")
  assert.equal(obtenerAccionAtencion(estados[5], permisos), null)
})

test("un usuario sin permiso no obtiene acciones clínicas", () => {
  for (const estado of estados) assert.equal(obtenerAccionAtencion(estado, () => false), null)
})

test("consultar resultados no concede validación ni PDF", () => {
  const consulta = (permiso) => permiso === auth.PERMISOS.RESULTADOS_VER
  assert.equal(obtenerAccionAtencion(estados[3], consulta).etiqueta, "Ver resultado")
  assert.equal(obtenerAccionAtencion(estados[4], consulta).etiqueta, "Ver diagnóstico")
  assert.equal(obtenerAccionAtencion(estados[0], consulta), null)
  assert.equal(obtenerAccionAtencion(estados[1], consulta), null)
})
