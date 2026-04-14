import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Error inesperado en la interfaz',
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log en consola para depuracion durante desarrollo
    console.error('UI crash capturado por ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-content-center bg-slate-50 px-6">
          <div className="max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-rose-700">Error en la interfaz</h2>
            <p className="mt-2 text-slate-700">
              Se produjo un error de runtime. Recarga la pagina y revisa el detalle siguiente.
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100">
              {this.state.errorMessage}
            </pre>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
