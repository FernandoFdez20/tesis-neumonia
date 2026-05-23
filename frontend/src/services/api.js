const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getStoredToken() {
	return localStorage.getItem('access_token')
}

export async function loginRequest({ correo, password }) {
	// Llamada directa al endpoint de autenticacion
	const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ correo, password }),
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'No se pudo iniciar sesion')
	}

	return data
}

export async function getCurrentUsuario() {
	const token = getStoredToken()

	if (!token) {
		throw new Error('No hay sesion activa')
	}

	const response = await fetch(`${API_BASE_URL}/usuarios/me`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'No se pudo obtener usuario')
	}

	return data
}

export async function getEnfermedadesRequest() {
	// Catalogo publico para llenar el checklist de antecedentes clinicos.
	const response = await fetch(`${API_BASE_URL}/enfermedades/`)
	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'No se pudo obtener catalogo de enfermedades')
	}

	return data
}

export async function createDiagnosticoRequest(payload) {
	const token = getStoredToken()

	if (!token) {
		throw new Error('No hay sesion activa')
	}

	const formData = new FormData()
	Object.entries(payload).forEach(([key, value]) => {
		if (value === undefined || value === null) return
		if (Array.isArray(value)) {
			value.forEach((item) => formData.append(key, item))
			return
		}
		formData.append(key, value)
	})

	const response = await fetch(`${API_BASE_URL}/diagnosticos/`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: formData,
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'No se pudo registrar el diagnostico')
	}

	return data
}

export async function getRecentDiagnosticosRequest(limit = 10) {
	const token = getStoredToken()

	if (!token) {
		throw new Error('No hay sesion activa')
	}

	const response = await fetch(`${API_BASE_URL}/diagnosticos/recientes?limit=${limit}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'No se pudo obtener casos recientes')
	}

	return data
}

export async function getDiagnosticoResultadoRequest(diagnosticoId) {
	const token = getStoredToken()

	if (!token) {
		throw new Error('No hay sesion activa')
	}

	const response = await fetch(`${API_BASE_URL}/diagnosticos/${diagnosticoId}/resultado`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.detail || 'No se pudo obtener resultado del diagnostico')
	}

	return data
}
