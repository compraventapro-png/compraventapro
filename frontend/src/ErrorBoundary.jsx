import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30 text-2xl font-black">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-white mb-2">Ocurrió un detalle al cambiar de vista</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              El navegador o una extensión intentó modificar la página. Ya protegimos el sistema para que no se pierdan tus datos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-5 py-3 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-950/50"
              >
                Volver a intentar
              </button>
              <button
                onClick={this.handleReload}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm rounded-xl transition"
              >
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
