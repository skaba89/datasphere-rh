'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-slate-600 mb-6">
              L'application a rencontré une erreur inattendue. Vous pouvez recharger la page
              ou retourner à l'accueil.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                  Détails techniques
                </summary>
                <pre className="mt-2 p-3 bg-slate-50 rounded text-xs text-slate-600 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleHome}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Accueil
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#27698a] hover:bg-[#1f5570] rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recharger
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
