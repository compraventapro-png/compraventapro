import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { 
  Package, ShoppingCart, ShoppingBag, LayoutDashboard, 
  Plus, Minus, AlertTriangle, CheckCircle, TrendingUp, DollarSign,
  Boxes, Trash2, LogIn, LogOut, Search, UserCheck, 
  FileDown, Image as ImageIcon, Upload, X, Pencil,
  History, Users, ToggleLeft, ToggleRight, RefreshCw, Printer, Receipt, Loader2,
  Calendar, Activity, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler,
  Title, Tooltip, Legend
);

// Logotipo Oficial Vectorial Premium — Carnicería RM (Opción A: Escudo Gourmet & Calidad)
export const LogoCarniceriaRM = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b91c1c" />
        <stop offset="45%" stopColor="#881337" />
        <stop offset="100%" stopColor="#450a0a" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="45%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5" />
      </filter>
    </defs>
    {/* Silueta de Escudo Gourmet */}
    <path 
      d="M50 4 L88 18 C88 58 68 85 50 96 C32 85 12 58 12 18 Z" 
      fill="url(#shieldGrad)" 
      stroke="url(#goldGrad)" 
      strokeWidth="3.5"
      filter="url(#shadowFilter)"
    />
    {/* Pespunte dorado interior */}
    <path 
      d="M50 11 L81 22 C81 54 64 77 50 87 C36 77 19 54 19 22 Z" 
      fill="none" 
      stroke="url(#goldGrad)" 
      strokeWidth="1.2" 
      strokeDasharray="2.5 2"
      opacity="0.85"
    />
    {/* Silueta estilizada de cabeza de res y cuernos */}
    <path 
      d="M32 29 C34 23 40 21 44 25 C41 28 40 32 43 35 C46 33 54 33 57 35 C60 32 59 28 56 25 C60 21 66 23 68 29 C62 32 58 38 57 42 C55 44 45 44 43 42 C42 38 38 32 32 29 Z" 
      fill="url(#goldGrad)" 
    />
    {/* Tres Estrellas Gourmet de Calidad */}
    <path d="M50 16 L51.2 19.5 L55 19.8 L52.2 22.2 L53 25.8 L50 23.8 L47 25.8 L47.8 22.2 L45 19.8 L48.8 19.5 Z" fill="url(#goldGrad)" />
    <circle cx="36" cy="20" r="1.8" fill="url(#goldGrad)" />
    <circle cx="64" cy="20" r="1.8" fill="url(#goldGrad)" />
    {/* Monograma RM en el centro */}
    <text 
      x="50" 
      y="66" 
      textAnchor="middle" 
      fill="#ffffff" 
      fontSize="24" 
      fontWeight="900" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      letterSpacing="1.5"
      style={{ filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.8))' }}
    >
      RM
    </text>
    {/* Cinta / Banner inferior */}
    <rect x="20" y="73.5" width="60" height="11.5" rx="5.75" fill="#18181b" stroke="url(#goldGrad)" strokeWidth="1.2" />
    <text 
      x="50" 
      y="82" 
      textAnchor="middle" 
      fill="url(#goldGrad)" 
      fontSize="6.8" 
      fontWeight="900" 
      letterSpacing="1.2"
      fontFamily="system-ui, sans-serif"
    >
      CARNICERÍA
    </text>
  </svg>
);

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const isAdmin = user?.rol === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'dashboard' : 'pos'); // 'dashboard', 'inventory', 'pos', 'ventas', 'usuarios'
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Auth form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all', 'low_stock'
  const [dashboardData, setDashboardData] = useState(null);
  const [ventasSemana, setVentasSemana] = useState([]);
  const [chartType, setChartType] = useState('line'); // 'line' (Área / Línea suave) | 'bar' (Barras)

  // Fecha actual en español para los paneles (ej: "Miércoles, 21 de octubre de 2026")
  const getFechaActualFormateada = () => {
    try {
      const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const str = new Date().toLocaleDateString('es-ES', opciones);
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch (e) {
      return new Date().toLocaleDateString('es-ES');
    }
  };
  const fechaActualTexto = getFechaActualFormateada();

  // Moneda global: 'Bs' (Bolivianos) o '$' (Dólares)
  const [moneda, setMoneda] = useState(localStorage.getItem('moneda') || 'Bs');
  const currencySymbol = moneda === 'Bs' ? 'Bs ' : '$ ';

  const cambiarMoneda = (nueva) => {
    setMoneda(nueva);
    localStorage.setItem('moneda', nueva);
  };

  // Sistema de Notificaciones Toast elegante
  const [toast, setToast] = useState(null); // { type: 'success' | 'error' | 'warning' | 'info', message: '' }
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Función auxiliar de fecha local YYYY-MM-DD
  const getFechaLocalStr = (fecha = new Date()) => {
    try {
      const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
      if (isNaN(d.getTime())) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Historial de ventas
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);
  const [fechaFiltroVentas, setFechaFiltroVentas] = useState('hoy'); // 'hoy' por defecto
  const [vendedorFiltroVentas, setVendedorFiltroVentas] = useState('todos'); // 'todos', 'admin', 'vendedor'
  const [ventaEliminarConfirm, setVentaEliminarConfirm] = useState(null);

  // Gestión de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' });

  // Estados de carga para evitar doble clic (lag protection)
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeletingVenta, setIsDeletingVenta] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Cart for POS (Sale)
  const [cart, setCart] = useState([]);
  const [saleSuccess, setSaleSuccess] = useState('');
  const [saleError, setSaleError] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'qr' | 'tarjeta'
  const [montoRecibido, setMontoRecibido] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteNit, setClienteNit] = useState('');
  const [ticketData, setTicketData] = useState(null); // datos del ticket post-venta

  // New Product Modal/Form
  const [newProduct, setNewProduct] = useState({
    sku: '', nombre: '', descripcion: '', imagen_url: '', precio_compra: '', precio_venta: '', stock_actual: 0, stock_minimo: 5
  });
  const [imagePreview, setImagePreview] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const fileInputRef = useRef(null);

  // Quick Purchase (Stock in)
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(5);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseMsg, setPurchaseMsg] = useState('');

  // Edit & Delete
  const [editingProduct, setEditingProduct] = useState(null); // producto que se está editando
  const [editImagePreview, setEditImagePreview] = useState('');
  const editFileInputRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // producto a eliminar

  useEffect(() => {
    // Interceptor global para capturar sesiones expiradas
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const detail = error.response?.data?.detail;
          if (detail && typeof detail === 'string' && detail.toLowerCase().includes('token')) {
            showToast('Tu sesión ha expirado. Por favor ingresa nuevamente.', 'error');
            handleLogout();
          }
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (token) {
      loadProducts();
      loadVentas();
      if (isAdmin) {
        loadDashboard();
        loadVentasSemana();
      } else {
        setActiveTab('pos');
      }
    }
  }, [token, user]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get('/productos/');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const res = await api.get('/dashboard/resumen');
      setDashboardData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadVentasSemana = async () => {
    try {
      const res = await api.get('/dashboard/ventas-semana');
      setVentasSemana(res.data);
    } catch (err) { console.error(err); }
  };

  const loadVentas = async () => {
    try {
      setLoadingVentas(true);
      const res = await api.get('/ventas/');
      setVentas(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingVentas(false); }
  };

  const handleEliminarVenta = async (ventaId) => {
    if (isDeletingVenta) return;
    setIsDeletingVenta(true);
    try {
      await api.delete(`/ventas/${ventaId}`);
      showToast('Venta anulada y stock devuelto al inventario', 'success');
      setVentaEliminarConfirm(null);
      if (ventaDetalle?.id === ventaId) setVentaDetalle(null);
      loadVentas();
      loadProducts();
      if (isAdmin) loadDashboard();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al anular venta', 'error');
    } finally {
      setIsDeletingVenta(false);
    }
  };

  // Imprimir Reporte de Ventas Formal a Color (Hoja Carta / Apaisada) con Cabecera Carmesí
  const imprimirReporteVentasFormal = (ventasFiltradas, fechaLabel, vendedorLabel) => {
    if (!ventasFiltradas || ventasFiltradas.length === 0) {
      showToast('No hay ventas para imprimir en este rango', 'warning');
      return;
    }
    const totalRecaudado = ventasFiltradas.reduce((a, v) => a + v.total, 0);
    const totalAdmin = ventasFiltradas.filter(v => (v.usuario_rol || 'admin').toLowerCase() === 'admin').reduce((a, v) => a + v.total, 0);
    const totalVendedores = ventasFiltradas.filter(v => (v.usuario_rol || '').toLowerCase() === 'vendedor').reduce((a, v) => a + v.total, 0);

    const win = window.open('', '_blank', 'width=950,height=900');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Reporte de Ventas - Carnicería RM</title>
      <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
        @page { size: letter; margin: 12mm 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px 0; background: #fff; }
        .report-wrapper { max-width: 820px; margin: 0 auto; }
        
        .header {
          background: linear-gradient(135deg, #991b1b 0%, #881337 55%, #4c0519 100%) !important;
          color: #ffffff !important;
          padding: 22px 26px;
          border-radius: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          box-shadow: 0 4px 14px rgba(136, 19, 55, 0.25);
        }
        .brand-wrap { display: flex; align-items: center; gap: 16px; }
        .badge-tag {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2) !important;
          color: #fef08a !important;
          padding: 3px 12px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
          border: 1px solid rgba(255,255,255,0.25);
        }
        .brand-name { font-size: 25px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
        .brand-sub { font-size: 12px; font-weight: 600; color: #ffe4e6; margin-top: 2px; }
        
        .report-badge-box {
          background: #ffffff !important;
          color: #4c0519 !important;
          font-family: monospace;
          font-size: 14px;
          font-weight: 900;
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          border: 1px solid #ffe4e6;
          text-align: center;
        }
        .report-date { font-size: 11px; color: #fecdd3; margin-top: 5px; font-weight: 600; text-align: right; }
        
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc !important; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 14px; font-size: 11px; margin-bottom: 18px; }
        .meta-col strong { color: #0f172a; }
        .meta-title { font-size: 9.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.8px; }

        .table-container { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 18px; }
        .table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        .table th { background: #f1f5f9 !important; color: #475569; padding: 10px 12px; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid #cbd5e1; }
        .table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
        .table tr:nth-child(even) { background: #fafafa !important; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .summary-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; gap: 15px; }
        .qr-box { display: flex; align-items: center; gap: 12px; background: #f8fafc !important; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; font-size: 10px; color: #64748b; }
        .qr-box img { width: 65px; height: 65px; border-radius: 6px; background: #fff; padding: 2px; border: 1px solid #cbd5e1; }
        
        .totals-card { width: 340px; background: #f8fafc !important; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; font-size: 11.5px; }
        .totals-card .line { display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569; }
        .totals-card .line.main {
          background: #eef2ff !important;
          border: 1.5px solid #c7d2fe;
          border-radius: 10px;
          padding: 8px 12px;
          color: #1e1b4b;
          font-weight: 900;
          font-size: 13.5px;
          margin-top: 6px;
        }
        .totals-card .line.main span:last-child {
          font-size: 16px;
          color: #4338ca;
          font-family: monospace;
        }
        
        .footer-note { text-align: center; margin-top: 25px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-style: italic; }
      </style></head><body>
        <div class="report-wrapper">
          <div class="header">
            <div class="brand-wrap">
              <svg viewBox="0 0 100 100" width="70" height="70" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
                <defs>
                  <linearGradient id="rShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#b91c1c" />
                    <stop offset="45%" stop-color="#881337" />
                    <stop offset="100%" stop-color="#450a0a" />
                  </linearGradient>
                  <linearGradient id="rGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="45%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#b45309" />
                  </linearGradient>
                </defs>
                <path d="M50 4 L88 18 C88 58 68 85 50 96 C32 85 12 58 12 18 Z" fill="url(#rShieldGrad)" stroke="url(#rGoldGrad)" stroke-width="4" />
                <path d="M50 11 L81 22 C81 54 64 77 50 87 C36 77 19 54 19 22 Z" fill="none" stroke="url(#rGoldGrad)" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.85" />
                <path d="M32 29 C34 23 40 21 44 25 C41 28 40 32 43 35 C46 33 54 33 57 35 C60 32 59 28 56 25 C60 21 66 23 68 29 C62 32 58 38 57 42 C55 44 45 44 43 42 C42 38 38 32 32 29 Z" fill="url(#rGoldGrad)" />
                <path d="M50 16 L51.2 19.5 L55 19.8 L52.2 22.2 L53 25.8 L50 23.8 L47 25.8 L47.8 22.2 L45 19.8 L48.8 19.5 Z" fill="url(#rGoldGrad)" />
                <circle cx="36" cy="20" r="2" fill="url(#rGoldGrad)" />
                <circle cx="64" cy="20" r="2" fill="url(#rGoldGrad)" />
                <text x="50" y="66" text-anchor="middle" fill="#ffffff" font-size="25" font-weight="900" font-family="Arial, sans-serif" letter-spacing="1.5">RM</text>
                <rect x="20" y="73.5" width="60" height="12" rx="6" fill="#18181b" stroke="url(#rGoldGrad)" stroke-width="1.2" />
                <text x="50" y="82.5" text-anchor="middle" fill="url(#rGoldGrad)" font-size="7" font-weight="900" letter-spacing="1.2" font-family="Arial, sans-serif">CARNICERÍA</text>
              </svg>
              <div>
                <div class="badge-tag">REPORTE OFICIAL DE VENTAS · CORTES SELECTOS</div>
                <h1 class="brand-name">Carnicería RM</h1>
                <div class="brand-sub">Control y Balance de Ventas en Tiempo Real</div>
              </div>
            </div>
            <div>
              <div class="report-badge-box">
                ${ventasFiltradas.length} VENTAS
              </div>
              <div class="report-date">
                ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-col">
              <div class="meta-title">CRITERIOS DE FILTRADO</div>
              <div>Período: <strong>${fechaLabel || 'Todas las fechas'}</strong></div>
              <div>Vendedor: <strong>${vendedorLabel || 'Todos los vendedores'}</strong></div>
            </div>
            <div class="meta-col" style="text-align:right;">
              <div class="meta-title">DATOS DE AUDITORÍA</div>
              <div>Emitido por: <strong>${user?.nombre || user?.email} (${(user?.rol || 'admin').toUpperCase()})</strong></div>
              <div>Moneda: <strong>${currencySymbol.trim() === 'Bs' ? 'Bolivianos (BOB)' : 'Dólares (USD)'}</strong></div>
            </div>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:6%;" class="text-center">N°</th>
                  <th style="width:10%;">VENTA #</th>
                  <th style="width:16%;">FECHA / HORA</th>
                  <th style="width:18%;">VENDIDO POR</th>
                  <th style="width:35%;">CORTES / PRODUCTOS COMPRADOS</th>
                  <th style="width:15%;" class="text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${ventasFiltradas.map((v, idx) => {
                  const itemsText = (v.detalles || []).map(d => {
                    const prod = products.find(p => p.id === d.producto_id);
                    const nombre = d.producto?.nombre || prod?.nombre || `Item #${d.producto_id}`;
                    return `<strong>${d.cantidad}x</strong> ${nombre}`;
                  }).join(', ');
                  const esAdmin = (v.usuario_rol || 'admin').toLowerCase() === 'admin';
                  const nombreVendedor = v.usuario_nombre || (esAdmin ? 'Administrador' : 'Vendedor');

                  return `
                    <tr>
                      <td class="text-center" style="color:#64748b; font-weight:bold;">${idx + 1}</td>
                      <td style="font-family:monospace; font-weight:bold; color:#0f172a;">#${v.id}</td>
                      <td style="color:#475569;">
                        ${new Date(v.creado_en).toLocaleDateString('es-ES')} <small style="color:#94a3b8;">${new Date(v.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
                      </td>
                      <td>
                        <span style="display:inline-block; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:bold; ${esAdmin ? 'background:#ede9fe; color:#5b21b6;' : 'background:#dcfce7; color:#166534;'}">
                          ${esAdmin ? '👑' : '🧑'} ${nombreVendedor}
                        </span>
                      </td>
                      <td style="color:#334155;">${itemsText || 'Venta rápida'}</td>
                      <td class="text-right" style="font-weight:900; font-family:monospace; color:#0f172a;">${currencySymbol}${v.total.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="summary-container">
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`CarniceriaRM|ReporteVentas|Total:${totalRecaudado}|Ventas:${ventasFiltradas.length}|Fecha:${new Date().toISOString()}`)}" />
              <div>
                <div style="font-weight:bold; color:#0f172a; font-size:11px;">REPORTE OFICIAL CERTIFICADO</div>
                <div>Carnicería RM · Sistema POS</div>
                <div style="color:#059669; font-weight:bold; margin-top:2px;">✓ Sincronizado con Supabase</div>
              </div>
            </div>

            <div class="totals-card">
              <div class="line">
                <span>Transacciones realizadas:</span>
                <strong>${ventasFiltradas.length}</strong>
              </div>
              <div class="line">
                <span>Vendido por Admin:</span>
                <strong style="color:#5b21b6;">${currencySymbol}${totalAdmin.toFixed(2)}</strong>
              </div>
              <div class="line">
                <span>Vendido por Vendedores:</span>
                <strong style="color:#166534;">${currencySymbol}${totalVendedores.toFixed(2)}</strong>
              </div>
              <div class="line">
                <span>Ticket promedio:</span>
                <strong>${currencySymbol}${(totalRecaudado / (ventasFiltradas.length || 1)).toFixed(2)}</strong>
              </div>
              <div class="line main">
                <span>TOTAL RECAUDADO:</span>
                <span>${currencySymbol}${totalRecaudado.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer-note">
            Documento de control interno generado automáticamente por el Sistema Carnicería RM · Cortes Selectos
          </div>
        </div>
      </body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  // Exportar reporte de ventas filtradas a PDF (descarga de archivo)
  const exportarReporteVentasPDF = (ventasFiltradas, fechaLabel, vendedorLabel) => {
    if (!ventasFiltradas || ventasFiltradas.length === 0) {
      showToast('No hay ventas para exportar en este rango', 'warning');
      return;
    }
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado Carnicería RM
    doc.setFillColor(153, 27, 27); // red-800 / Carmesí Gourmet
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Carnicería RM — Reporte Oficial de Ventas', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cortes Selectos · Período: ${fechaLabel || 'Todas'} · Vendedor: ${vendedorLabel || 'Todos'} · Moneda: ${currencySymbol.trim()}`, 14, 21);
    doc.text(`Emitido: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, pageWidth - 14, 21, { align: 'right' });

    // Filas para la tabla
    const rows = ventasFiltradas.map((v, idx) => {
      const itemsText = (v.detalles || []).map(d => {
        const prod = products.find(p => p.id === d.producto_id);
        const nombre = d.producto?.nombre || prod?.nombre || `Item #${d.producto_id}`;
        return `${d.cantidad}x ${nombre}`;
      }).join(', ');

      const esAdmin = (v.usuario_rol || 'admin').toLowerCase() === 'admin';
      const vendedorStr = v.usuario_nombre || (esAdmin ? 'Admin' : 'Vendedor');

      return [
        (idx + 1).toString(),
        `#${v.id}`,
        `${new Date(v.creado_en).toLocaleDateString('es-ES')} ${new Date(v.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        vendedorStr,
        itemsText || 'Venta registrada',
        `${currencySymbol}${v.total.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: 34,
      head: [['N°', 'ID', 'Fecha / Hora', 'Vendedor', 'Cortes / Productos Comprados', 'Total']],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: [153, 27, 27], // Carmesí Carnicería RM
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: { fontSize: 8, valign: 'middle' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 14 },
        2: { cellWidth: 32 },
        3: { cellWidth: 26 },
        4: { cellWidth: 78 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      }
    });

    const finalY = doc.lastAutoTable.finalY + 8;
    const totalRecaudado = ventasFiltradas.reduce((a, v) => a + v.total, 0);
    const totalAdmin = ventasFiltradas.filter(v => (v.usuario_rol || 'admin').toLowerCase() === 'admin').reduce((a, v) => a + v.total, 0);
    const totalVendedores = ventasFiltradas.filter(v => (v.usuario_rol || '').toLowerCase() === 'vendedor').reduce((a, v) => a + v.total, 0);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, pageWidth - 28, 24, 3, 3, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen del Período:', 18, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Transacciones: ${ventasFiltradas.length}`, 18, finalY + 14);
    doc.text(`Admin: ${currencySymbol}${totalAdmin.toFixed(2)} · Vendedores: ${currencySymbol}${totalVendedores.toFixed(2)}`, 18, finalY + 20);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL RECAUDADO: ${currencySymbol}${totalRecaudado.toFixed(2)}`, pageWidth - 18, finalY + 14, { align: 'right' });

    doc.save(`Reporte_Ventas_CarniceriaRM_${fechaLabel ? fechaLabel.replace(/[^a-zA-Z0-9]/g, '_') : 'General'}.pdf`);
    showToast('Reporte de Carnicería RM descargado en PDF', 'success');
  };

  const loadUsuarios = async () => {
    try {
      setLoadingUsuarios(true);
      const res = await api.get('/usuarios/');
      setUsuarios(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingUsuarios(false); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isCreatingUser) return;
    setIsCreatingUser(true);
    try {
      await api.post('/usuarios/', newUser);
      setShowUserModal(false);
      setNewUser({ nombre: '', email: '', password: '', rol: 'vendedor' });
      loadUsuarios();
      showToast('Usuario creado con éxito', 'success');
    } catch (err) { 
      showToast(err.response?.data?.detail || 'Error al crear usuario', 'error'); 
    } finally {
      setIsCreatingUser(false);
    }
  };

  const toggleUsuario = async (id) => {
    try {
      await api.patch(`/usuarios/${id}/toggle`);
      loadUsuarios();
      showToast('Estado del usuario actualizado', 'info');
    } catch (err) { showToast(err.response?.data?.detail || 'Error', 'error'); }
  };

  // Image upload and compress to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para optimizar peso (máx 350x350)
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 350;
        const MAX_HEIGHT = 350;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setImagePreview(dataUrl);
        setNewProduct(prev => ({ ...prev, imagen_url: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview('');
    setNewProduct(prev => ({ ...prev, imagen_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Imprimir Catálogo Formal a Color (Hoja Carta) con Cabecera Carmesí Oficial
  const imprimirCatalogoFormal = (productosAImprimir, filtroLabel) => {
    const prods = productosAImprimir || products;
    if (!prods || prods.length === 0) {
      showToast('No hay productos en el catálogo para imprimir', 'warning');
      return;
    }
    const totalStock = prods.reduce((acc, p) => acc + p.stock_actual, 0);
    const totalValuadoVenta = prods.reduce((acc, p) => acc + (p.stock_actual * p.precio_venta), 0);
    const totalValuadoCompra = prods.reduce((acc, p) => acc + (p.stock_actual * (p.precio_compra || 0)), 0);

    const win = window.open('', '_blank', 'width=950,height=900');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Catálogo de Inventario - Carnicería RM</title>
      <style>
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
        @page { size: letter; margin: 12mm 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px 0; background: #fff; }
        .catalog-wrapper { max-width: 820px; margin: 0 auto; }
        
        .header {
          background: linear-gradient(135deg, #991b1b 0%, #881337 55%, #4c0519 100%) !important;
          color: #ffffff !important;
          padding: 22px 26px;
          border-radius: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          box-shadow: 0 4px 14px rgba(136, 19, 55, 0.25);
        }
        .brand-wrap { display: flex; align-items: center; gap: 16px; }
        .badge-tag {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2) !important;
          color: #fef08a !important;
          padding: 3px 12px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
          border: 1px solid rgba(255,255,255,0.25);
        }
        .brand-name { font-size: 25px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
        .brand-sub { font-size: 12px; font-weight: 600; color: #ffe4e6; margin-top: 2px; }
        
        .badge-box {
          background: #ffffff !important;
          color: #4c0519 !important;
          font-family: monospace;
          font-size: 14px;
          font-weight: 900;
          padding: 8px 16px;
          border-radius: 12px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          border: 1px solid #ffe4e6;
          text-align: center;
        }
        .catalog-date { font-size: 11px; color: #fecdd3; margin-top: 5px; font-weight: 600; text-align: right; }
        
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc !important; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 14px; font-size: 11px; margin-bottom: 18px; }
        .meta-col strong { color: #0f172a; }
        .meta-title { font-size: 9.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.8px; }

        .table-container { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; margin-bottom: 18px; }
        .table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        .table th { background: #f1f5f9 !important; color: #475569; padding: 10px 12px; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid #cbd5e1; }
        .table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .table tr:nth-child(even) { background: #fafafa !important; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .photo-thumb { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1; display: block; margin: 0 auto; background: #fff; }
        .no-photo { width: 38px; height: 38px; border-radius: 8px; background: #f1f5f9; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; margin: 0 auto; }

        .summary-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; gap: 15px; }
        .qr-box { display: flex; align-items: center; gap: 12px; background: #f8fafc !important; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; font-size: 10px; color: #64748b; }
        .qr-box img { width: 65px; height: 65px; border-radius: 6px; background: #fff; padding: 2px; border: 1px solid #cbd5e1; }
        
        .totals-card { width: 340px; background: #f8fafc !important; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 18px; font-size: 11.5px; }
        .totals-card .line { display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569; }
        .totals-card .line.main {
          background: #eef2ff !important;
          border: 1.5px solid #c7d2fe;
          border-radius: 10px;
          padding: 8px 12px;
          color: #1e1b4b;
          font-weight: 900;
          font-size: 13.5px;
          margin-top: 6px;
        }
        .totals-card .line.main span:last-child {
          font-size: 16px;
          color: #4338ca;
          font-family: monospace;
        }
        
        .footer-note { text-align: center; margin-top: 25px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-style: italic; }
      </style></head><body>
        <div class="catalog-wrapper">
          <div class="header">
            <div class="brand-wrap">
              <svg viewBox="0 0 100 100" width="70" height="70" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
                <defs>
                  <linearGradient id="cShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#b91c1c" />
                    <stop offset="45%" stop-color="#881337" />
                    <stop offset="100%" stop-color="#450a0a" />
                  </linearGradient>
                  <linearGradient id="cGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="45%" stop-color="#f59e0b" />
                    <stop offset="100%" stop-color="#b45309" />
                  </linearGradient>
                </defs>
                <path d="M50 4 L88 18 C88 58 68 85 50 96 C32 85 12 58 12 18 Z" fill="url(#cShieldGrad)" stroke="url(#cGoldGrad)" stroke-width="4" />
                <path d="M50 11 L81 22 C81 54 64 77 50 87 C36 77 19 54 19 22 Z" fill="none" stroke="url(#cGoldGrad)" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.85" />
                <path d="M32 29 C34 23 40 21 44 25 C41 28 40 32 43 35 C46 33 54 33 57 35 C60 32 59 28 56 25 C60 21 66 23 68 29 C62 32 58 38 57 42 C55 44 45 44 43 42 C42 38 38 32 32 29 Z" fill="url(#cGoldGrad)" />
                <path d="M50 16 L51.2 19.5 L55 19.8 L52.2 22.2 L53 25.8 L50 23.8 L47 25.8 L47.8 22.2 L45 19.8 L48.8 19.5 Z" fill="url(#cGoldGrad)" />
                <circle cx="36" cy="20" r="2" fill="url(#cGoldGrad)" />
                <circle cx="64" cy="20" r="2" fill="url(#cGoldGrad)" />
                <text x="50" y="66" text-anchor="middle" fill="#ffffff" font-size="25" font-weight="900" font-family="Arial, sans-serif" letter-spacing="1.5">RM</text>
                <rect x="20" y="73.5" width="60" height="12" rx="6" fill="#18181b" stroke="url(#cGoldGrad)" stroke-width="1.2" />
                <text x="50" y="82.5" text-anchor="middle" fill="url(#cGoldGrad)" font-size="7" font-weight="900" letter-spacing="1.2" font-family="Arial, sans-serif">CARNICERÍA</text>
              </svg>
              <div>
                <div class="badge-tag">CATÁLOGO OFICIAL · CORTES SELECTOS & PRODUCTOS</div>
                <h1 class="brand-name">Carnicería RM</h1>
                <div class="brand-sub">Reporte de Inventario, Precios y Existencias en Tienda</div>
              </div>
            </div>
            <div>
              <div class="badge-box">
                ${prods.length} ARTÍCULOS
              </div>
              <div class="catalog-date">
                ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-col">
              <div class="meta-title">INFORMACIÓN DEL CATÁLOGO</div>
              <div>Filtro: <strong>${filtroLabel || 'Catálogo General'}</strong></div>
              <div>Moneda oficial: <strong>${currencySymbol.trim() === 'Bs' ? 'Bolivianos (BOB)' : 'Dólares (USD)'}</strong></div>
            </div>
            <div class="meta-col" style="text-align:right;">
              <div class="meta-title">DATOS DE AUDITORÍA</div>
              <div>Generado por: <strong>${user?.nombre || user?.email} (${(user?.rol || 'admin').toUpperCase()})</strong></div>
              <div>Estado de sincronización: <strong style="color:#059669;">Conectado a Supabase</strong></div>
            </div>
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:8%;" class="text-center">FOTO</th>
                  <th style="width:14%;">SKU</th>
                  <th style="width:34%;">PRODUCTO / CORTE</th>
                  ${isAdmin ? `<th style="width:14%;" class="text-right">P. COMPRA</th>` : ''}
                  <th style="width:14%;" class="text-right">P. VENTA</th>
                  <th style="width:16%;" class="text-center">EXISTENCIA</th>
                </tr>
              </thead>
              <tbody>
                ${prods.map(p => {
                  const stockStatus = p.stock_actual <= 0 
                    ? { label: 'AGOTADO', bg: '#ffe4e6', color: '#9f1239' } 
                    : p.stock_actual <= p.stock_minimo 
                      ? { label: 'STOCK BAJO', bg: '#fef3c7', color: '#92400e' } 
                      : { label: 'DISPONIBLE', bg: '#dcfce7', color: '#166534' };

                  return `
                    <tr>
                      <td class="text-center">
                        ${p.imagen_url 
                          ? `<img src="${p.imagen_url}" class="photo-thumb" alt="${p.nombre}" />` 
                          : `<div class="no-photo">Sin foto</div>`
                        }
                      </td>
                      <td style="font-family:monospace; font-weight:bold; color:#0f172a;">${p.sku}</td>
                      <td>
                        <div style="font-weight:700; color:#0f172a;">${p.nombre}</div>
                        ${p.descripcion ? `<div style="font-size:10px; color:#64748b; margin-top:2px;">${p.descripcion}</div>` : ''}
                      </td>
                      ${isAdmin ? `<td class="text-right" style="font-family:monospace; color:#64748b;">${currencySymbol}${p.precio_compra.toFixed(2)}</td>` : ''}
                      <td class="text-right" style="font-weight:900; font-family:monospace; color:#0f172a; font-size:12px;">${currencySymbol}${p.precio_venta.toFixed(2)}</td>
                      <td class="text-center">
                        <span style="display:inline-block; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:bold; background:${stockStatus.bg}; color:${stockStatus.color};">
                          ${p.stock_actual} unid. (${stockStatus.label})
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="summary-container">
            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`CarniceriaRM|Catalogo|TotalArticulos:${prods.length}|StockTotal:${totalStock}|Valuacion:${totalValuadoVenta}|Fecha:${new Date().toISOString()}`)}" />
              <div>
                <div style="font-weight:bold; color:#0f172a; font-size:11px;">CATÁLOGO OFICIAL CERTIFICADO</div>
                <div>Carnicería RM · Cortes Selectos</div>
                <div style="color:#059669; font-weight:bold; margin-top:2px;">✓ Registro Oficial de Precios</div>
              </div>
            </div>

            <div class="totals-card">
              <div class="line">
                <span>Artículos en catálogo:</span>
                <strong>${prods.length} productos</strong>
              </div>
              <div class="line">
                <span>Unidades en existencia:</span>
                <strong>${totalStock} unid.</strong>
              </div>
              ${isAdmin ? `
                <div class="line">
                  <span>Valor de costo (compra):</span>
                  <strong style="color:#64748b;">${currencySymbol}${totalValuadoCompra.toFixed(2)}</strong>
                </div>
              ` : ''}
              <div class="line main">
                <span>VALOR TOTAL VENTA:</span>
                <span>${currencySymbol}${totalValuadoVenta.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="footer-note">
            Catálogo y lista de precios emitido por el Sistema Carnicería RM · Calidad y Frescura Garantizada
          </div>
        </div>
      </body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFillColor(153, 27, 27); // red-800 Carnicería RM
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Carnicería RM — Reporte de Inventario y Cortes', 14, 13);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 14, 20);
    doc.text(`Generado por: ${user?.nombre || user?.email} (${user?.rol?.toUpperCase()})`, pageWidth - 14, 20, { align: 'right' });

    // Preparar filas para la tabla
    const tableData = products.map((p, idx) => {
      const stockStatus = p.stock_actual <= 0 ? 'AGOTADO' : (p.stock_actual <= p.stock_minimo ? 'BAJO' : 'OK');
      return [
        (idx + 1).toString(),
        '', // Espacio para la imagen
        p.sku,
        p.nombre,
        isAdmin ? `${currencySymbol}${p.precio_compra.toFixed(2)}` : 'N/A',
        `${currencySymbol}${p.precio_venta.toFixed(2)}`,
        `${p.stock_actual} unid.`,
        stockStatus
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [['#', 'Foto', 'SKU', 'Producto', `P. Compra (${currencySymbol.trim()})`, `P. Venta (${currencySymbol.trim()})`, 'Stock', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo 600
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        valign: 'middle',
        minCellHeight: 14,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 16 },
        2: { fontStyle: 'bold', cellWidth: 24 },
        3: { cellWidth: 50 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
        6: { halign: 'center', cellWidth: 20 },
        7: { halign: 'center', fontStyle: 'bold', cellWidth: 20 }
      },
      didDrawCell: (data) => {
        // Dibujar miniatura de la imagen si existe
        if (data.column.index === 1 && data.cell.section === 'body') {
          const product = products[data.row.index];
          if (product && product.imagen_url && product.imagen_url.startsWith('data:image')) {
            try {
              const dim = 11;
              const x = data.cell.x + (data.cell.width - dim) / 2;
              const y = data.cell.y + (data.cell.height - dim) / 2;
              doc.addImage(product.imagen_url, 'JPEG', x, y, dim, dim);
            } catch (err) {
              console.error('Error dibujando imagen en PDF:', err);
            }
          }
        }
      }
    });

    // Resumen al pie
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalStock = products.reduce((acc, p) => acc + p.stock_actual, 0);
    const totalValuado = products.reduce((acc, p) => acc + (p.stock_actual * p.precio_venta), 0);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, finalY, pageWidth - 28, 22, 3, 3, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen General:', 18, finalY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Artículos en Catálogo: ${products.length}`, 18, finalY + 14);
    doc.text(`Unidades Totales en Existencia: ${totalStock}`, 100, finalY + 14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Valor Total de Venta: ${currencySymbol}${totalValuado.toFixed(2)}`, pageWidth - 18, finalY + 14, { align: 'right' });

    doc.save(`Inventario_CarniceriaRM_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Catálogo de Carnicería RM descargado en PDF', 'success');
  };

  // Login / Register handler
  const handleAuth = async (e) => {
    e.preventDefault();
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError('');
    try {
      if (isRegistering) {
        await api.post('/auth/register', {
          nombre: authName,
          email: authEmail,
          password: authPassword,
          rol: 'admin'
        });
      }
      const res = await api.post('/auth/login', {
        email: authEmail,
        password: authPassword
      });
      const receivedToken = res.data.access_token;
      const receivedUser = res.data.usuario;
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Error al autenticar');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  // Cart Management
  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_actual) {
        showToast('No hay más stock disponible para este producto', 'warning');
        return;
      }
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock_actual <= 0) {
        showToast('Producto sin stock disponible', 'warning');
        return;
      }
      setCart([...cart, { 
        product_id: product.id, 
        nombre: product.nombre, 
        price: product.precio_venta, 
        quantity: 1, 
        stock_max: product.stock_actual,
        imagen_url: product.imagen_url
      }]);
    }
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.stock_max) {
      showToast(`Stock máximo disponible: ${item.stock_max} unid.`, 'warning');
      setCart(cart.map(i => i.product_id === productId ? { ...i, quantity: item.stock_max } : i));
      return;
    }

    setCart(cart.map(i => i.product_id === productId ? { ...i, quantity: newQuantity } : i));
  };

  const clearCart = () => {
    setCart([]);
    setMontoRecibido('');
    setClienteNombre('');
    setClienteNit('');
    setSaleError('');
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Submit Sale (Checkout) con protección contra doble clic
  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmittingSale) return;
    if (metodoPago === 'efectivo') {
      const recibido = parseFloat(montoRecibido || 0);
      if (recibido < cartTotal) {
        setSaleError(`Monto insuficiente. Faltan ${currencySymbol}${(cartTotal - recibido).toFixed(2)}`);
        return;
      }
    }
    setSaleError('');
    setSaleSuccess('');
    setIsSubmittingSale(true);
    try {
      const resVenta = await api.post('/ventas/checkout', {
        items: cart.map(item => ({
          producto_id: item.product_id,
          cantidad: item.quantity
        }))
      });
      const vuelto = metodoPago === 'efectivo' ? Math.max(0, parseFloat(montoRecibido || 0) - cartTotal) : 0;
      const ventaId = resVenta.data?.id || Math.floor(1000 + Math.random() * 9000);
      setTicketData({
        nroFactura: `FAC-${String(ventaId).padStart(5, '0')}`,
        items: [...cart],
        total: cartTotal,
        metodoPago,
        montoRecibido: parseFloat(montoRecibido || cartTotal),
        vuelto,
        cliente: clienteNombre.trim() || 'Consumidor Final',
        nit: clienteNit.trim() || 'S/N',
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        fecha: new Date().toLocaleDateString('es-ES'),
        cajero: user?.nombre || user?.email || 'Administrador',
      });
      setCart([]);
      setMontoRecibido('');
      setClienteNombre('');
      setClienteNit('');
      showToast('¡Venta realizada con éxito!', 'success');
      loadProducts();
      loadVentas();
      if (isAdmin) loadDashboard();
    } catch (err) {
      setSaleError(err.response?.data?.detail || 'Error al procesar la venta');
      showToast(err.response?.data?.detail || 'Error al procesar la venta', 'error');
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Abrir modal de nuevo producto (con SKU generado por defecto opcional)
  const openNewProductModal = () => {
    const defaultSku = `PROD-${Date.now().toString().slice(-4)}`;
    setNewProduct({
      sku: defaultSku,
      nombre: '',
      descripcion: '',
      imagen_url: '',
      precio_compra: '',
      precio_venta: '',
      stock_actual: 0,
      stock_minimo: 5
    });
    setImagePreview('');
    setShowProductModal(true);
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (isSavingProduct) return;
    setIsSavingProduct(true);
    const finalSku = (newProduct.sku && newProduct.sku.trim()) 
      ? newProduct.sku.trim() 
      : `PROD-${Date.now().toString().slice(-4)}`;
    try {
      await api.post('/productos/', {
        sku: finalSku,
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion,
        imagen_url: newProduct.imagen_url || null,
        precio_compra: parseFloat(newProduct.precio_compra || 0),
        precio_venta: parseFloat(newProduct.precio_venta),
        stock_actual: parseInt(newProduct.stock_actual || 0),
        stock_minimo: parseInt(newProduct.stock_minimo || 5)
      });
      setShowProductModal(false);
      setNewProduct({ sku: '', nombre: '', descripcion: '', imagen_url: '', precio_compra: '', precio_venta: '', stock_actual: 0, stock_minimo: 5 });
      setImagePreview('');
      loadProducts();
      if (isAdmin) loadDashboard();
      showToast('¡Producto registrado con éxito!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al crear producto', 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Quick Purchase (Stock Entry)
  const handleStockEntry = async (e) => {
    e.preventDefault();
    if (!purchaseProduct || isAddingStock) return;
    setIsAddingStock(true);
    try {
      await api.post('/compras/', {
        items: [{
          producto_id: purchaseProduct.id,
          cantidad: parseInt(purchaseQty),
          precio_unit: parseFloat(purchasePrice || purchaseProduct.precio_compra)
        }],
        observacion: 'Entrada rápida de inventario'
      });
      showToast('¡Stock incrementado con éxito!', 'success');
      setPurchaseProduct(null);
      loadProducts();
      if (isAdmin) loadDashboard();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error en compra', 'error');
    } finally {
      setIsAddingStock(false);
    }
  };

  // Abrir modal de edición con datos del producto
  const openEditModal = (producto) => {
    setEditingProduct({
      id: producto.id,
      sku: producto.sku,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      imagen_url: producto.imagen_url || '',
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
    });
    setEditImagePreview(producto.imagen_url || '');
  };

  // Cambio de imagen en modal de edición
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Selecciona una imagen válida', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 350;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h *= MAX/w; w = MAX; } }
        else { if (h > MAX) { w *= MAX/h; h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEditImagePreview(dataUrl);
        setEditingProduct(prev => ({ ...prev, imagen_url: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      await api.put(`/productos/${editingProduct.id}`, {
        sku: editingProduct.sku,
        nombre: editingProduct.nombre,
        descripcion: editingProduct.descripcion,
        imagen_url: editingProduct.imagen_url || null,
        precio_compra: parseFloat(editingProduct.precio_compra || 0),
        precio_venta: parseFloat(editingProduct.precio_venta),
        stock_actual: parseInt(editingProduct.stock_actual),
        stock_minimo: parseInt(editingProduct.stock_minimo),
      });
      setEditingProduct(null);
      setEditImagePreview('');
      loadProducts();
      if (isAdmin) loadDashboard();
      showToast('Cambios guardados con éxito', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al guardar cambios', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Eliminar (desactivar) producto con confirmación
  const handleDeleteProduct = async (producto) => {
    if (isDeletingProduct) return;
    setIsDeletingProduct(true);
    try {
      await api.delete(`/productos/${producto.id}`);
      setDeleteConfirm(null);
      loadProducts();
      if (isAdmin) loadDashboard();
      showToast('Producto desactivado del inventario', 'info');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al eliminar producto', 'error');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Auth Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Luces de fondo decorativas estilo gourmet */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-rose-900/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden flex flex-col md:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Lado Izquierdo: Vitrina de Marca Carnicería RM (Opción A Gourmet) */}
          <div className="md:w-5/12 bg-gradient-to-br from-neutral-950 via-rose-950 to-neutral-900 text-white p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-rose-900/40 relative overflow-hidden">
            {/* Patrón sutil de fondo */}
            <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3.5 mb-6">
                <LogoCarniceriaRM className="w-14 h-14 flex-shrink-0 drop-shadow-xl" />
                <div>
                  <h1 className="text-xl font-black tracking-wide text-white leading-tight">CARNICERÍA RM</h1>
                  <span className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase">Cortes Selectos & Calidad</span>
                </div>
              </div>

              <div className="my-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-3">
                  <Sparkles size={12} className="text-amber-400" /> Sistema de Gestión Integral
                </span>
                <h2 className="text-2xl font-black text-white leading-snug">
                  Tradición y Calidad en Cada Corte
                </h2>
                <p className="text-xs text-rose-200/80 mt-2 leading-relaxed">
                  Control de inventario de carnes, existencias en tiempo real, punto de venta ágil y facturación electrónica.
                </p>
              </div>

              {/* Beneficios clave */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-rose-800/60 border border-rose-600/40 flex items-center justify-center text-amber-300 text-[10px] font-bold">✓</div>
                  <span>Pesaje y control de existencias exactas</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-rose-800/60 border border-rose-600/40 flex items-center justify-center text-amber-300 text-[10px] font-bold">✓</div>
                  <span>Facturación y tickets térmicos al instante</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-rose-800/60 border border-rose-600/40 flex items-center justify-center text-amber-300 text-[10px] font-bold">✓</div>
                  <span>Monedas duales (Bolivianos Bs / Dólares $)</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-rose-900/50 flex items-center justify-between text-[11px] text-rose-300/70 font-medium">
              <span>Carnicería RM © 2026</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Servidor Activo
              </span>
            </div>
          </div>

          {/* Lado Derecho: Formulario de Autenticación */}
          <div className="md:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-white">
            <div className="mb-6">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600">Acceso Seguro</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {isRegistering ? 'Crear Cuenta de Acceso' : 'Ingresar al Sistema'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isRegistering ? 'Completa los datos para registrar un usuario administrador' : 'Ingresa tus credenciales para administrar ventas e inventario'}
              </p>
            </div>

            {authError && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2.5">
                <AlertTriangle size={18} className="flex-shrink-0 text-rose-600" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4" autoComplete="off">
              {isRegistering && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      autoComplete="off"
                      placeholder="ej. Roberto Morales"
                      value={authName} 
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition" 
                    />
                    <UserCheck size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Correo Electrónico *</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required 
                    autoComplete="new-password"
                    placeholder="ejemplo@tienda.com"
                    value={authEmail} 
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition" 
                  />
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Contraseña *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required 
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={authPassword} 
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition" 
                  />
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  >
                    {showPassword ? <EyeOff size={18} className="text-rose-600" /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="w-full py-3 bg-gradient-to-r from-red-700 via-rose-700 to-red-800 hover:from-red-800 hover:to-rose-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2 mt-2"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {isRegistering ? 'Creando cuenta...' : 'Iniciando sesión...'}
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                className="text-xs font-bold text-rose-700 hover:text-rose-800 hover:underline transition"
              >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Primer usuario? Regístrate aquí'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredPOSProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventoryProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                          p.sku.toLowerCase().includes(inventorySearch.toLowerCase());
    if (inventoryFilter === 'low_stock') {
      return matchesSearch && p.stock_actual <= p.stock_minimo;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar — Concepto 1: Carmesí Gourmet & Black Edition */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-neutral-950 via-neutral-900 to-rose-950 text-white flex flex-col p-5 shadow-2xl border-r border-rose-950/40 relative overflow-hidden">
        {/* Luz ambiental sutil decorativa en la esquina superior */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-rose-900/15 rounded-full blur-2xl pointer-events-none" />

        {/* Tarjeta del Logotipo */}
        <div className="relative z-10 flex items-center gap-3.5 mb-7 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
          <LogoCarniceriaRM className="w-11 h-11 flex-shrink-0 drop-shadow-lg" />
          <div className="min-w-0">
            <h1 className="font-black text-base leading-tight tracking-wide text-white truncate">Carnicería RM</h1>
            <span className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase flex items-center gap-1 mt-0.5">
              <Sparkles size={11} className="text-amber-400" /> CORTES SELECTOS
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 relative z-10">
          {/* 1. Dashboard (solo admin) */}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('dashboard'); loadVentasSemana(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm group ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-950/60 border-l-4 border-amber-400' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5 hover:translate-x-1.5'
              }`}
            >
              <LayoutDashboard size={18} className={activeTab === 'dashboard' ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-300 transition-colors'} />
              <span>Panel de Control (KPI)</span>
            </button>
          )}

          {/* 2. Catálogo / Inventario */}
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm group ${
              activeTab === 'inventory' 
                ? 'bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-950/60 border-l-4 border-amber-400' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 hover:translate-x-1.5'
            }`}
          >
            <Package size={18} className={activeTab === 'inventory' ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-300 transition-colors'} />
            <span>Inventario / Catálogo</span>
          </button>

          {/* 3. Punto de Venta (POS) */}
          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm group ${
              activeTab === 'pos' 
                ? 'bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-950/60 border-l-4 border-amber-400' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 hover:translate-x-1.5'
            }`}
          >
            <ShoppingCart size={18} className={activeTab === 'pos' ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-300 transition-colors'} />
            <span>Punto de Venta (POS)</span>
          </button>

          {/* 4. Historial de Ventas (Admin y Vendedor) */}
          <button 
            onClick={() => { setActiveTab('ventas'); loadVentas(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm group ${
              activeTab === 'ventas' 
                ? 'bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-950/60 border-l-4 border-amber-400' 
                : 'text-slate-300 hover:text-white hover:bg-white/5 hover:translate-x-1.5'
            }`}
          >
            <History size={18} className={activeTab === 'ventas' ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-300 transition-colors'} />
            <span>Historial de Ventas</span>
          </button>

          {/* 5. Gestión de Usuarios (solo admin) */}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('usuarios'); loadUsuarios(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 text-sm group ${
                activeTab === 'usuarios' 
                  ? 'bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 text-white shadow-lg shadow-rose-950/60 border-l-4 border-amber-400' 
                  : 'text-slate-300 hover:text-white hover:bg-white/5 hover:translate-x-1.5'
              }`}
            >
              <Users size={18} className={activeTab === 'usuarios' ? 'text-amber-300' : 'text-slate-400 group-hover:text-amber-300 transition-colors'} />
              <span>Gestión de Usuarios</span>
            </button>
          )}
        </nav>

        {/* Tarjeta del Usuario Inferior */}
        <div className="pt-4 border-t border-white/10 relative z-10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                isAdmin 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                {isAdmin ? 'ADMIN' : 'VENDEDOR'}
              </span>
              <span className="text-xs text-white/90 font-semibold truncate">{user?.nombre || user?.email}</span>
            </div>
            <button 
              onClick={handleLogout} 
              title="Cerrar sesión" 
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto bg-slate-50/90">
        {/* Encabezado Superior con Título del Panel y Fecha Actual */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-5 border-b border-slate-200/80 gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {activeTab === 'dashboard' && <><LayoutDashboard className="text-rose-700" size={22} /> Panel de Control & Métricas</>}
              {activeTab === 'inventory' && <><Package className="text-rose-700" size={22} /> Catálogo de Inventario</>}
              {activeTab === 'pos' && <><ShoppingCart className="text-rose-700" size={22} /> Punto de Venta (POS)</>}
              {activeTab === 'ventas' && <><History className="text-rose-700" size={22} /> Historial y Reporte de Ventas</>}
              {activeTab === 'usuarios' && <><Users className="text-rose-700" size={22} /> Gestión y Control de Usuarios</>}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'dashboard' && 'Rendimiento general, KPI financieros y estadísticas en tiempo real'}
              {activeTab === 'inventory' && 'Control de existencias, precios, margen de ganancia y stock'}
              {activeTab === 'pos' && 'Registro ágil de pedidos, cálculo de cobros y emisión de facturas'}
              {activeTab === 'ventas' && 'Auditoría de compras pasadas, reimpresión y balances'}
              {activeTab === 'usuarios' && 'Control de accesos y cuentas del sistema'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm">
              <Calendar size={15} className="text-rose-700" />
              <span>{fechaActualTexto}</span>
            </div>
          </div>
        </div>

        {purchaseMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
            <CheckCircle size={20} className="text-emerald-500" />
            {purchaseMsg}
          </div>
        )}

        {/* TAB: POS (PUNTO DE VENTA) */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6">
            {/* Catalogo de Productos */}
            <div className="flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-6">
                <div className="relative w-full sm:w-80">
                  <Search size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar producto o SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                {isAdmin && (
                  <button 
                    onClick={openNewProductModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
                  >
                    <Plus size={16} />
                    Nuevo Producto
                  </button>
                )}
              </div>

              {loadingProducts ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">Cargando catálogo...</div>
              ) : filteredPOSProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
                  <Package size={48} className="text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No hay productos que coincidan</p>
                  {isAdmin && (
                    <button 
                      onClick={openNewProductModal}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                    >
                      + Crear Producto
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredPOSProducts.map(p => (
                    <div 
                      key={p.id} 
                      className={`p-4 bg-white rounded-2xl border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                        p.stock_actual <= p.stock_minimo ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Foto del producto en la tarjeta */}
                        <div className="w-full h-36 bg-slate-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center border border-slate-100">
                          {p.imagen_url ? (
                            <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center text-slate-300">
                              <ImageIcon size={32} />
                              <span className="text-[10px] mt-1 text-slate-400">Sin foto</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{p.sku}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            p.stock_actual <= 0 ? 'bg-rose-100 text-rose-700' :
                            p.stock_actual <= p.stock_minimo ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            Stock: {p.stock_actual}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">{p.nombre}</h3>
                        {p.descripcion && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.descripcion}</p>}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-lg font-extrabold text-slate-900 block mb-2">{currencySymbol}{Number(p.precio_venta || 0).toFixed(2)}</span>
                        <div className="flex gap-2 w-full">
                          {isAdmin && (
                            <button 
                              onClick={() => { setPurchaseProduct(p); setPurchasePrice(p.precio_compra); }}
                              className="flex-none px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                              title="Entrada de Stock (Compra)"
                            >
                              + Stock
                            </button>
                          )}
                          <button 
                            onClick={() => addToCart(p)}
                            disabled={p.stock_actual <= 0}
                            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                              p.stock_actual <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 
                              cart.some(item => item.product_id === p.id) ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' :
                              'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            <ShoppingCart size={14} />
                            {cart.some(item => item.product_id === p.id) 
                              ? `En carrito (${cart.find(item => item.product_id === p.id).quantity}) +` 
                              : 'Vender'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel de Venta / Carrito */}
            <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-fit">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <ShoppingCart className="text-indigo-600" size={20} />
                <h2 className="font-bold text-slate-800 text-lg">Carrito de Venta</h2>
                <div className="ml-auto flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
                    {cart.reduce((a, b) => a + b.quantity, 0)} items
                  </span>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline"
                      title="Vaciar todo el carrito"
                    >
                      Vaciar
                    </button>
                  )}
                </div>
              </div>

              {saleError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {saleError}
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 flex flex-col items-center">
                  <ShoppingBag size={40} className="mb-2 text-slate-300" />
                  <p className="text-sm">El carrito está vacío</p>
                  <p className="text-xs text-slate-400">Haz clic en "Vender" o "+ Añadir" en cualquier producto</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product_id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0">
                          {item.imagen_url ? (
                            <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.nombre}</p>
                          <p className="text-[11px] text-slate-500">{currencySymbol}{item.price.toFixed(2)} c/u</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">
                            {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button 
                            onClick={() => removeFromCart(item.product_id)} 
                            className="text-[10px] text-slate-400 hover:text-rose-600 transition inline-flex items-center gap-0.5 mt-0.5"
                          >
                            <Trash2 size={11} /> Quitar
                          </button>
                        </div>
                      </div>

                      {/* Control Interactivo de Cantidad */}
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500">Cantidad (máx. {item.stock_max}):</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition font-bold"
                            title="Disminuir"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.stock_max}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) updateCartQuantity(item.product_id, val);
                            }}
                            className="w-12 text-center text-xs font-bold text-slate-800 border rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock_max}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition font-bold ${
                              item.quantity >= item.stock_max
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                            title="Aumentar"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* --- SECCIÓN DE COBRO --- */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 font-medium">Total a cobrar:</span>
                  <span className="text-2xl font-black text-slate-900">{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>

                {cart.length > 0 && (
                  <>
                    {/* Nombre del cliente y NIT/CI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Cliente (opcional)</label>
                        <input
                          type="text"
                          placeholder="Consumidor Final"
                          value={clienteNombre}
                          onChange={e => setClienteNombre(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">NIT / CI (opcional)</label>
                        <input
                          type="text"
                          placeholder="ej. 8493021"
                          value={clienteNit}
                          onChange={e => setClienteNit(e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Método de Pago</label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        {[
                          { id: 'efectivo', icon: '💵', label: 'Efectivo' },
                          { id: 'qr',       icon: '📱', label: 'QR / Trans.' },
                          { id: 'tarjeta',  icon: '💳', label: 'Tarjeta' },
                        ].map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setMetodoPago(m.id); setMontoRecibido(''); setSaleError(''); }}
                            className={`py-2 rounded-xl text-xs font-semibold border-2 transition flex flex-col items-center gap-0.5 ${
                              metodoPago === m.id
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-base">{m.icon}</span>
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Monto recibido + Vuelto (solo efectivo) */}
                    {metodoPago === 'efectivo' && (
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 uppercase">Monto Recibido ({currencySymbol.trim()})</label>
                          <input
                            type="number"
                            min={cartTotal}
                            step="0.01"
                            placeholder={`Mín. ${currencySymbol}${cartTotal.toFixed(2)}`}
                            value={montoRecibido}
                            onChange={e => { setMontoRecibido(e.target.value); setSaleError(''); }}
                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                          />
                        </div>
                        {parseFloat(montoRecibido) >= cartTotal && (
                          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                            <span className="text-xs font-semibold text-emerald-700">Vuelto a dar:</span>
                            <span className="text-lg font-black text-emerald-700">
                              {currencySymbol}{(parseFloat(montoRecibido) - cartTotal).toFixed(2)}
                            </span>
                          </div>
                        )}
                        {montoRecibido && parseFloat(montoRecibido) < cartTotal && (
                          <div className="flex justify-between items-center bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                            <span className="text-xs font-semibold text-rose-700">Falta:</span>
                            <span className="text-base font-black text-rose-700">
                              {currencySymbol}{(cartTotal - parseFloat(montoRecibido)).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje QR / Tarjeta */}
                    {(metodoPago === 'qr' || metodoPago === 'tarjeta') && (
                      <div className={`rounded-xl px-3 py-2 text-xs font-medium text-center border ${
                        metodoPago === 'qr' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'
                      }`}>
                        {metodoPago === 'qr' ? '📱 Pago por QR / Transferencia — Confirmar cuando el cliente haya pagado' : '💳 Pago con Tarjeta — Confirmar cuando se apruebe la transacción'}
                      </div>
                    )}
                  </>
                )}

                {/* Botón confirmar */}
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isSubmittingSale}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                    cart.length === 0 || isSubmittingSale ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  {isSubmittingSale ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Procesando venta...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      {metodoPago === 'efectivo' ? 'Cobrar en Efectivo' : metodoPago === 'qr' ? 'Confirmar Pago QR' : 'Confirmar Pago Tarjeta'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INVENTARIO */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isAdmin ? 'Catálogo de Inventario' : 'Catálogo de Productos y Precios'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAdmin ? 'Gestión de existencias sincronizada con Supabase PostgreSQL' : 'Consulta de existencias y precios al público'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {/* Botón Imprimir Catálogo Formal a Color (Idéntico a la Factura) */}
                <button 
                  onClick={() => imprimirCatalogoFormal(
                    filteredInventoryProducts, 
                    inventoryFilter === 'low_stock' ? 'Productos con Stock Bajo' : 'Catálogo Completo'
                  )}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 hover:from-red-800 hover:to-rose-900 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-200 transition"
                  title="Imprimir catálogo oficial formal a color (Hoja Carta)"
                >
                  <Printer size={16} />
                  Imprimir Catálogo Formal
                </button>

                {/* Botón Descargar Reporte PDF */}
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
                  title="Descargar archivo PDF"
                >
                  <FileDown size={16} />
                  Descargar PDF
                </button>

                {isAdmin && (
                  <button 
                    onClick={openNewProductModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
                  >
                    <Plus size={16} />
                    Nuevo Producto
                  </button>
                )}
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda en Inventario */}
            <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filtrar por nombre o SKU..." 
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => setInventoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    inventoryFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todos ({products.length})
                </button>
                <button 
                  onClick={() => setInventoryFilter('low_stock')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                    inventoryFilter === 'low_stock' ? 'bg-amber-600 text-white' : 'bg-white border text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <AlertTriangle size={12} />
                  Stock Bajo ({products.filter(p => p.stock_actual <= p.stock_minimo).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center">Foto</th>
                    <th className="px-6 py-3 font-semibold">SKU</th>
                    <th className="px-6 py-3 font-semibold">Producto</th>
                    {isAdmin && <th className="px-6 py-3 font-semibold">P. Compra</th>}
                    <th className="px-6 py-3 font-semibold">P. Venta</th>
                    {isAdmin && <th className="px-6 py-3 font-semibold">Margen</th>}
                    <th className="px-6 py-3 font-semibold">Stock</th>
                    <th className="px-6 py-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 6} className="px-6 py-8 text-center text-slate-400">
                        No se encontraron productos con el filtro aplicado
                      </td>
                    </tr>
                  ) : (
                    filteredInventoryProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-center">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden mx-auto border border-slate-200 flex items-center justify-center">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-700">{p.sku}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{p.nombre}</p>
                          {p.descripcion && <p className="text-xs text-slate-400">{p.descripcion}</p>}
                        </td>
                        {isAdmin && <td className="px-6 py-4 text-slate-600">{currencySymbol}{Number(p.precio_compra || 0).toFixed(2)}</td>}
                        <td className="px-6 py-4 font-bold text-slate-900">{currencySymbol}{Number(p.precio_venta || 0).toFixed(2)}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-emerald-600 font-semibold">
                            +{currencySymbol}{(Number(p.precio_venta || 0) - Number(p.precio_compra || 0)).toFixed(2)}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                            p.stock_actual <= p.stock_minimo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {p.stock_actual <= p.stock_minimo && <AlertTriangle size={12} />}
                            {p.stock_actual} unid.
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAdmin ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => { setPurchaseProduct(p); setPurchasePrice(p.precio_compra); }}
                                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                              >
                                + Abastecer
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition"
                                title="Editar producto"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(p)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                title="Eliminar producto"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => { setActiveTab('pos'); addToCart(p); }}
                              disabled={p.stock_actual <= 0}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                p.stock_actual <= 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              Vender
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Métricas Clave del Negocio</h2>
              <button onClick={() => { loadDashboard(); loadVentasSemana(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition">
                <RefreshCw size={13} /> Actualizar
              </button>
            </div>

            {/* KPI Cards con Fondo de Color Completo y Elegante */}
            {(() => {
              const hoyStrLocal = getFechaLocalStr(new Date());
              const ventasHoyDirectas = ventas.filter(v => getFechaLocalStr(v.creado_en) === hoyStrLocal);
              const totalVentasHoyDirecto = ventasHoyDirectas.reduce((acc, v) => acc + v.total, 0);
              const numVentasHoyDirecto = ventasHoyDirectas.length;

              const totalVentasHoyFinal = (dashboardData?.total_ventas_hoy && dashboardData.total_ventas_hoy > 0)
                ? dashboardData.total_ventas_hoy
                : totalVentasHoyDirecto;

              const numVentasHoyFinal = (dashboardData?.num_ventas_hoy && dashboardData.num_ventas_hoy > 0)
                ? dashboardData.num_ventas_hoy
                : numVentasHoyDirecto;

              const kpis = [
                {
                  id: 'productos',
                  label: 'Productos Activos',
                  value: dashboardData?.total_productos ?? products.length,
                  sublabel: 'En catálogo de carnicería',
                  bgGradient: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900',
                  shadowColor: 'shadow-blue-900/25',
                  borderColor: 'border-blue-500/40',
                  iconBg: 'bg-white/20 text-white border-white/25',
                  Icon: Package,
                },
                {
                  id: 'stock',
                  label: 'Alertas Stock Mínimo',
                  value: dashboardData?.productos_stock_bajo ?? products.filter(p => p.stock_actual <= p.stock_minimo).length,
                  sublabel: (dashboardData?.productos_stock_bajo ?? 0) > 0 ? 'Requieren abastecer' : 'Stock en niveles óptimos',
                  bgGradient: 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700',
                  shadowColor: 'shadow-amber-900/25',
                  borderColor: 'border-amber-400/40',
                  iconBg: 'bg-white/20 text-white border-white/25',
                  Icon: AlertTriangle,
                },
                {
                  id: 'ventas',
                  label: `Ventas Hoy (${currencySymbol.trim()})`,
                  value: `${currencySymbol}${totalVentasHoyFinal.toFixed(2)}`,
                  sublabel: 'Recaudación del día',
                  bgGradient: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900',
                  shadowColor: 'shadow-emerald-950/25',
                  borderColor: 'border-emerald-500/40',
                  iconBg: 'bg-white/20 text-white border-white/25',
                  Icon: TrendingUp,
                },
                {
                  id: 'transacciones',
                  label: 'Transacciones Hoy',
                  value: numVentasHoyFinal,
                  sublabel: 'Tickets y notas emitidas',
                  bgGradient: 'bg-gradient-to-br from-red-700 via-rose-800 to-neutral-950',
                  shadowColor: 'shadow-rose-950/30',
                  borderColor: 'border-rose-600/40',
                  iconBg: 'bg-white/20 text-amber-300 border-white/25',
                  Icon: DollarSign,
                },
              ];

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpis.map(({ id, label, value, sublabel, bgGradient, shadowColor, borderColor, iconBg, Icon }) => (
                    <div 
                      key={id} 
                      className={`relative overflow-hidden p-5 rounded-2xl ${bgGradient} ${borderColor} border shadow-lg ${shadowColor} flex items-center justify-between transition-all duration-200 hover:scale-[1.02]`}
                    >
                      {/* Círculo de luz decorativo de fondo */}
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                      <div className="relative z-10">
                        <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider">{label}</p>
                        <p className="text-3xl font-black text-white mt-1 tracking-tight drop-shadow-sm font-mono">{value}</p>
                        <p className="text-[10px] text-white/70 font-medium mt-1">{sublabel}</p>
                      </div>

                      <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md border ${iconBg} shadow-sm flex-shrink-0 ml-3`}>
                        <Icon size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Gráfica de ventas últimos 7 días */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-base">Ventas — Últimos 7 días</h3>
                    {ventasSemana.length > 0 && (
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                        Total: {currencySymbol}{ventasSemana.reduce((sum, d) => sum + (d.total || 0), 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Tendencia de recaudación acumulada por día
                  </p>
                </div>

                {/* Alternador de tipo de gráfica: Línea / Área vs Barras */}
                <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
                  <button
                    onClick={() => setChartType('line')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                      chartType === 'line' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    <Activity size={14} />
                    Línea Suave (Área)
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                      chartType === 'bar' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    <BarChart3 size={14} />
                    Barras
                  </button>
                </div>
              </div>

              {ventasSemana.length > 0 ? (
                <div className="h-72 w-full">
                  {chartType === 'line' ? (
                    <Line
                      data={{
                        labels: ventasSemana.map(d => d.fecha),
                        datasets: [{
                          label: `Total (${currencySymbol.trim()})`,
                          data: ventasSemana.map(d => d.total),
                          borderColor: '#4f46e5',
                          backgroundColor: (context) => {
                            const ctx = context.chart.ctx;
                            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
                            gradient.addColorStop(0, 'rgba(79, 70, 229, 0.32)');
                            gradient.addColorStop(1, 'rgba(79, 70, 229, 0.01)');
                            return gradient;
                          },
                          fill: true,
                          tension: 0.38,
                          borderWidth: 3,
                          pointRadius: 5,
                          pointHoverRadius: 8,
                          pointBackgroundColor: '#ffffff',
                          pointBorderColor: '#4f46e5',
                          pointBorderWidth: 2.5,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: '#0f172a',
                            titleFont: { size: 12, weight: 'bold' },
                            bodyFont: { size: 13, weight: 'bold' },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                              title: (items) => `Día: ${items[0].label}`,
                              label: (ctx) => ` Venta: ${currencySymbol}${Number(ctx.raw || 0).toFixed(2)}`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (v) => `${currencySymbol}${v}`,
                              font: { size: 11 },
                              color: '#64748b'
                            },
                            grid: { color: '#f1f5f9' },
                            border: { dash: [4, 4] }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '500' }, color: '#64748b' }
                          }
                        }
                      }}
                    />
                  ) : (
                    <Bar
                      data={{
                        labels: ventasSemana.map(d => d.fecha),
                        datasets: [{
                          label: `Total (${currencySymbol.trim()})`,
                          data: ventasSemana.map(d => d.total),
                          backgroundColor: 'rgba(99,102,241,0.75)',
                          borderColor: 'rgba(79,70,229,1)',
                          borderWidth: 2,
                          borderRadius: 8,
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: '#0f172a',
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                              title: (items) => `Día: ${items[0].label}`,
                              label: (ctx) => ` Venta: ${currencySymbol}${Number(ctx.raw || 0).toFixed(2)}`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (v) => `${currencySymbol}${v}`,
                              font: { size: 11 },
                              color: '#64748b'
                            },
                            grid: { color: '#f1f5f9' }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '500' }, color: '#64748b' }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <TrendingUp size={40} className="text-slate-200 mb-2" />
                  <p className="text-sm">Sin ventas en los últimos 7 días</p>
                </div>
              )}
            </div>

            {/* Resumen adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Compras Hoy</p>
                <p className="text-2xl font-black text-rose-500">{currencySymbol}{Number(dashboardData?.total_compras_hoy || 0).toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">{dashboardData?.num_compras_hoy ?? 0} entradas de mercadería</p>
              </div>
              <div className="p-5 bg-indigo-900 text-white rounded-2xl shadow-sm flex flex-col justify-between">
                <h3 className="font-bold">Supabase PostgreSQL</h3>
                <p className="text-xs text-indigo-300 mt-1">Sincronizado en tiempo real en la nube</p>
                <a href="https://compraventapro.onrender.com/docs" target="_blank" rel="noreferrer"
                  className="mt-3 inline-block px-4 py-2 bg-white text-indigo-900 rounded-xl font-bold text-xs hover:bg-indigo-50 transition">
                  Swagger API ↗
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HISTORIAL DE VENTAS */}
        {activeTab === 'ventas' && (() => {
          // Filtrado preciso con fecha local
          const hoyStr = getFechaLocalStr(new Date());

          const ventasFiltradas = ventas.filter(v => {
            // 1. Filtro de fecha
            let pasaFecha = true;
            const fechaVenta = getFechaLocalStr(v.creado_en);
            if (fechaFiltroVentas === 'hoy') {
              pasaFecha = (fechaVenta === hoyStr);
            } else if (fechaFiltroVentas) {
              pasaFecha = (fechaVenta === fechaFiltroVentas);
            }

            // 2. Filtro de vendedor
            let pasaVendedor = true;
            const rol = (v.usuario_rol || 'admin').toLowerCase();
            const esMio = Boolean(
              (v.usuario_id && user?.id && String(v.usuario_id) === String(user.id)) || 
              (v.usuario_nombre && user?.nombre && v.usuario_nombre.trim().toLowerCase() === user.nombre.trim().toLowerCase()) ||
              (v.usuario_nombre && user?.email && v.usuario_nombre.trim().toLowerCase() === user.email.trim().toLowerCase())
            );

            if (vendedorFiltroVentas === 'admin') {
              pasaVendedor = (rol === 'admin');
            } else if (vendedorFiltroVentas === 'vendedor') {
              pasaVendedor = (rol === 'vendedor');
            } else if (vendedorFiltroVentas === 'mis_ventas') {
              pasaVendedor = esMio;
            }

            return pasaFecha && pasaVendedor;
          });

          const totalRecaudadoFiltrado = ventasFiltradas.reduce((a, v) => a + v.total, 0);
          const totalAdmin = ventasFiltradas.filter(v => (v.usuario_rol || 'admin').toLowerCase() === 'admin').reduce((a, v) => a + v.total, 0);
          const totalVendedores = ventasFiltradas.filter(v => (v.usuario_rol || '').toLowerCase() === 'vendedor').reduce((a, v) => a + v.total, 0);

          const ventasHoyCount = ventas.filter(v => getFechaLocalStr(v.creado_en) === hoyStr).length;
          const ventasAdminCount = ventas.filter(v => (v.usuario_rol || 'admin').toLowerCase() === 'admin').length;
          const ventasVendedorCount = ventas.filter(v => (v.usuario_rol || '').toLowerCase() === 'vendedor').length;
          const misVentasCount = ventas.filter(v => 
            (v.usuario_id && user?.id && String(v.usuario_id) === String(user.id)) || 
            (v.usuario_nombre && user?.nombre && v.usuario_nombre.trim().toLowerCase() === user.nombre.trim().toLowerCase()) ||
            (v.usuario_nombre && user?.email && v.usuario_nombre.trim().toLowerCase() === user.email.trim().toLowerCase())
          ).length;
          const misVentasTotal = ventasFiltradas.filter(v => 
            (v.usuario_id && user?.id && String(v.usuario_id) === String(user.id)) || 
            (v.usuario_nombre && user?.nombre && v.usuario_nombre.trim().toLowerCase() === user.nombre.trim().toLowerCase()) ||
            (v.usuario_nombre && user?.email && v.usuario_nombre.trim().toLowerCase() === user.email.trim().toLowerCase())
          ).reduce((a, v) => a + v.total, 0);

          const fechaLabel = fechaFiltroVentas === 'hoy' 
            ? `Ventas de Hoy (${hoyStr})` 
            : fechaFiltroVentas 
              ? `Ventas del ${fechaFiltroVentas}` 
              : 'Historial Completo';

          const vendedorLabel = vendedorFiltroVentas === 'admin'
            ? 'Solo Administrador'
            : vendedorFiltroVentas === 'vendedor'
              ? 'Solo Vendedores'
              : vendedorFiltroVentas === 'mis_ventas'
                ? `Mis Ventas (${user?.nombre || user?.email || 'Vendedor'})`
                : 'Todos los Vendedores';

          return (
            <div className="space-y-4">
              {/* Barra superior con Título, Botones de Impresión y Acciones */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <History className="text-rose-700" size={22} />
                    Historial y Reporte de Ventas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Auditoría de compras por vendedor, balance diario e impresión formal
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  {/* Botón Principal: Imprimir Reporte Formal a Color (Idéntico a la Factura) */}
                  <button
                    onClick={() => imprimirReporteVentasFormal(ventasFiltradas, fechaLabel, vendedorLabel)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 hover:from-red-800 hover:to-rose-900 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition"
                    title="Imprimir reporte formal a color (Hoja Carta)"
                  >
                    <Printer size={15} /> Imprimir Reporte Formal
                  </button>

                  {/* Botón Secundario: Descargar PDF */}
                  <button
                    onClick={() => exportarReporteVentasPDF(ventasFiltradas, fechaLabel, vendedorLabel)}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                    title="Descargar archivo PDF digital"
                  >
                    <FileDown size={14} /> PDF
                  </button>

                  <button 
                    onClick={loadVentas} 
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                    title="Refrescar lista"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              {/* Barra de Filtros Dual: Por Fecha (Hoy por defecto) y Por Vendedor (Admin vs Vendedor) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* 1. Filtro por Fecha */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={13} className="text-rose-600" /> Fecha:
                  </span>
                  
                  <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-sm">
                    <button
                      onClick={() => setFechaFiltroVentas('hoy')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        fechaFiltroVentas === 'hoy'
                          ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Hoy</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${fechaFiltroVentas === 'hoy' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'}`}>
                        {ventasHoyCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setFechaFiltroVentas('')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        fechaFiltroVentas === ''
                          ? 'bg-gradient-to-r from-red-700 to-rose-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Todas</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${fechaFiltroVentas === '' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {ventas.length}
                      </span>
                    </button>
                  </div>

                  {/* Selector de fecha personalizada */}
                  <input
                    type="date"
                    value={fechaFiltroVentas === 'hoy' ? hoyStr : fechaFiltroVentas}
                    onChange={(e) => setFechaFiltroVentas(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium shadow-sm"
                    title="Escoger una fecha específica"
                  />
                </div>

                {/* 2. Filtro por Vendedor (Admin vs Vendedor vs Mis Ventas) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Users size={13} className="text-indigo-600" /> Vendedor:
                  </span>

                  <div className="inline-flex bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-sm">
                    <button
                      onClick={() => setVendedorFiltroVentas('todos')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                        vendedorFiltroVentas === 'todos'
                          ? 'bg-indigo-600 text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todos ({ventas.length})
                    </button>

                    {!isAdmin && (
                      <button
                        onClick={() => setVendedorFiltroVentas('mis_ventas')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                          vendedorFiltroVentas === 'mis_ventas'
                            ? 'bg-emerald-700 text-white font-bold shadow-sm'
                            : 'text-slate-600 hover:text-emerald-700'
                        }`}
                      >
                        <span>🧑 Mis Ventas</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${vendedorFiltroVentas === 'mis_ventas' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                          {misVentasCount}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => setVendedorFiltroVentas('admin')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                        vendedorFiltroVentas === 'admin'
                          ? 'bg-purple-700 text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:text-purple-700'
                      }`}
                    >
                      <span>👑 Admin</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${vendedorFiltroVentas === 'admin' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-700'}`}>
                        {ventasAdminCount}
                      </span>
                    </button>

                    <button
                      onClick={() => setVendedorFiltroVentas('vendedor')}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                        vendedorFiltroVentas === 'vendedor'
                          ? 'bg-emerald-700 text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      <span>🧑 Vendedor</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${vendedorFiltroVentas === 'vendedor' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        {ventasVendedorCount}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla de Ventas con Columna de Vendedor */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loadingVentas ? (
                  <div className="p-12 text-center text-slate-400">Cargando historial de ventas...</div>
                ) : ventasFiltradas.length === 0 ? (
                  <div className="p-12 flex flex-col items-center text-slate-400">
                    <History size={48} className="text-slate-200 mb-3" />
                    <p className="font-semibold text-slate-700">No se encontraron ventas para los filtros seleccionados</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando la fecha o seleccionando "Todos los Vendedores"</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3">Venta #</th>
                          <th className="px-5 py-3">Fecha y Hora</th>
                          <th className="px-5 py-3">Vendido por</th>
                          <th className="px-5 py-3">Productos Adquiridos (Carrito)</th>
                          <th className="px-5 py-3 text-right">Total Cobrado</th>
                          <th className="px-5 py-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ventasFiltradas.map(v => {
                          const esAdmin = (v.usuario_rol || 'admin').toLowerCase() === 'admin';
                          const nombreVendedor = v.usuario_nombre || (esAdmin ? 'Administrador' : 'Vendedor');
                          const esMio = Boolean(
                            (v.usuario_id && user?.id && String(v.usuario_id) === String(user.id)) || 
                            (v.usuario_nombre && user?.nombre && v.usuario_nombre.trim().toLowerCase() === user.nombre.trim().toLowerCase()) ||
                            (v.usuario_nombre && user?.email && v.usuario_nombre.trim().toLowerCase() === user.email.trim().toLowerCase())
                          );

                          return (
                            <tr key={v.id} className="hover:bg-slate-50 transition">
                              <td className="px-5 py-3 font-mono font-bold text-slate-600">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-md">#{v.id}</span>
                              </td>
                              <td className="px-5 py-3 text-slate-700">
                                <span className="font-medium">{new Date(v.creado_en).toLocaleDateString('es-ES')}</span>
                                <span className="text-slate-400 ml-2 text-xs">{new Date(v.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>

                              {/* Columna: Quién vendió */}
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                  esAdmin 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  <span>{esAdmin ? '👑' : '🧑'}</span>
                                  <span>{nombreVendedor}</span>
                                  <span className="text-[10px] opacity-75 font-normal">({esAdmin ? 'Admin' : 'Vendedor'})</span>
                                  {esMio && !isAdmin && (
                                    <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">Tú</span>
                                  )}
                                </span>
                              </td>

                              {/* Mostrar productos reales por su nombre adquiridos en el mismo carrito */}
                              <td className="px-5 py-3">
                                <div className="flex flex-wrap gap-1.5 max-w-md">
                                  {(v.detalles && v.detalles.length > 0) ? (
                                    v.detalles.map(d => {
                                      const prod = products.find(p => p.id === d.producto_id);
                                      const nombreProd = d.producto?.nombre || prod?.nombre || `Item #${d.producto_id}`;
                                      return (
                                        <span 
                                          key={d.id}
                                          className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs px-2.5 py-1 rounded-lg font-medium"
                                        >
                                          <strong className="text-indigo-600">{d.cantidad}x</strong> {nombreProd}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Venta rápida</span>
                                  )}
                                </div>
                              </td>

                              <td className="px-5 py-3 text-right font-black text-emerald-600 text-base font-mono">
                                {currencySymbol}{Number(v.total || 0).toFixed(2)}
                              </td>

                              <td className="px-5 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button 
                                    onClick={() => setVentaDetalle(ventaDetalle?.id === v.id ? null : v)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                                  >
                                    {ventaDetalle?.id === v.id ? 'Cerrar' : 'Ver'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Reconstruir factura completa con nombres reales del carrito
                                      const reconstructedItems = (v.detalles || []).map(d => {
                                        const p = products.find(prod => prod.id === d.producto_id);
                                        return {
                                          product_id: d.producto_id,
                                          nombre: d.producto?.nombre || p?.nombre || `Producto #${d.producto_id}`,
                                          price: d.precio_unit,
                                          quantity: d.cantidad
                                        };
                                      });
                                      setTicketData({
                                        nroFactura: `FAC-${String(v.id).padStart(5, '0')}`,
                                        items: reconstructedItems.length > 0 ? reconstructedItems : [{ product_id: 1, nombre: 'Venta Registrada', price: v.total, quantity: 1 }],
                                        total: v.total,
                                        metodoPago: 'efectivo',
                                        montoRecibido: v.total,
                                        vuelto: 0,
                                        cliente: 'Consumidor Final',
                                        nit: 'S/N',
                                        hora: new Date(v.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                                        fecha: new Date(v.creado_en).toLocaleDateString('es-ES'),
                                        cajero: v.usuario_nombre || user?.nombre || user?.email || 'Administrador',
                                      });
                                    }}
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                    title="Reimprimir Factura a Color o Ticket"
                                  >
                                    <Receipt size={13} /> Factura
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => setVentaEliminarConfirm(v)}
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                                      title="Anular venta y reponer stock"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Panel detalle de venta expandido */}
              {ventaDetalle && (
                <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Receipt size={16} className="text-indigo-600" />
                      Detalle de Productos en la Venta #{ventaDetalle.id} — Vendido por: {ventaDetalle.usuario_nombre || 'Administrador'}
                    </h3>
                    <button onClick={() => setVentaDetalle(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                  </div>
                  <div className="space-y-2">
                    {ventaDetalle.detalles?.map(d => {
                      const prod = products.find(p => p.id === d.producto_id);
                      const nombre = d.producto?.nombre || prod?.nombre || `Producto ID #${d.producto_id}`;
                      return (
                        <div key={d.id} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold">{d.cantidad}</span>
                            <div>
                              <p className="font-semibold text-slate-800">{nombre}</p>
                              <p className="text-xs text-slate-400">{currencySymbol}{Number(d.precio_unit || 0).toFixed(2)} c/u</p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 font-mono">{currencySymbol}{Number(d.subtotal || 0).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between pt-2 font-black text-emerald-700 text-base">
                      <span>TOTAL COBRADO</span>
                      <span className="font-mono">{currencySymbol}{Number(ventaDetalle.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen Total con Desglose por Vendedor */}
              {ventasFiltradas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-center shadow-sm">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">Transacciones ({fechaLabel})</p>
                    <p className="text-2xl font-black text-indigo-700 mt-1 font-mono">{ventasFiltradas.length}</p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center shadow-sm">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Total Recaudado (Filtro)</p>
                    <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{currencySymbol}{Number(totalRecaudadoFiltrado || 0).toFixed(2)}</p>
                  </div>

                  {!isAdmin ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shadow-sm">
                      <p className="text-xs font-semibold text-emerald-700 uppercase">🧑 Mis Ventas Realizadas</p>
                      <p className="text-xl font-black text-emerald-800 mt-1 font-mono">{currencySymbol}{Number(misVentasTotal || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">{misVentasCount} ventas registradas por ti</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-center shadow-sm">
                      <p className="text-xs font-semibold text-purple-600 uppercase">👑 Vendido por Admin</p>
                      <p className="text-xl font-black text-purple-700 mt-1 font-mono">{currencySymbol}{Number(totalAdmin || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-purple-500 mt-0.5">{ventasFiltradas.filter(v => (v.usuario_rol || 'admin').toLowerCase() === 'admin').length} ventas</p>
                    </div>
                  )}

                  <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-center shadow-sm">
                    <p className="text-xs font-semibold text-teal-600 uppercase">🧑 Total Vendedores</p>
                    <p className="text-xl font-black text-teal-700 mt-1 font-mono">{currencySymbol}{Number(totalVendedores || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-teal-500 mt-0.5">{ventasFiltradas.filter(v => (v.usuario_rol || '').toLowerCase() === 'vendedor').length} ventas</p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB: GESTIÓN DE USUARIOS */}
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Gestión de Usuarios</h2>
              <div className="flex gap-2">
                <button onClick={loadUsuarios} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition">
                  <RefreshCw size={13} /> Actualizar
                </button>
                <button onClick={() => setShowUserModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition">
                  <Plus size={16} /> Nuevo Usuario
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loadingUsuarios ? (
                <div className="p-12 text-center text-slate-400">Cargando usuarios...</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Usuario</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Rol</th>
                      <th className="px-5 py-3">Registrado</th>
                      <th className="px-5 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios.map(u => (
                      <tr key={u.id} className={`hover:bg-slate-50 transition ${!u.activo ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              {u.nombre?.charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-800">{u.nombre}</span>
                            {u.id === user?.id && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold">TÚ</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${(u.rol || '').toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {(u.rol || 'vendedor').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {u.creado_en ? new Date(u.creado_en).toLocaleDateString('es-ES') : '-'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => toggleUsuario(u.id)}
                            disabled={u.id === user?.id}
                            title={u.id === user?.id ? 'No puedes desactivarte a ti mismo' : (u.activo ? 'Desactivar' : 'Activar')}
                            className={`transition ${u.id === user?.id ? 'cursor-not-allowed opacity-40' : 'hover:opacity-80'}`}
                          >
                            {u.activo
                              ? <ToggleRight size={28} className="text-emerald-500" />
                              : <ToggleLeft size={28} className="text-slate-400" />
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification Flotante Elegante */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
            toast.type === 'success' ? 'bg-emerald-900/90 border-emerald-500/50 text-white shadow-emerald-950/30' :
            toast.type === 'error'   ? 'bg-rose-900/90 border-rose-500/50 text-white shadow-rose-950/30' :
            toast.type === 'warning' ? 'bg-amber-900/90 border-amber-500/50 text-white shadow-amber-950/30' :
                                       'bg-slate-900/90 border-slate-700/50 text-white shadow-slate-950/30'
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertTriangle size={20} className="text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle size={20} className="text-amber-400" />}
              {toast.type === 'info' && <Boxes size={20} className="text-indigo-400" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white transition p-0.5 -mr-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CREAR PRODUCTO (CON SUBIDA DE FOTO) */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Registrar Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              {/* Selector de Foto con Previsualización */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Foto del Producto (Desde dispositivo)</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={removeImage} 
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-600 transition"
                          title="Quitar foto"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <ImageIcon size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden" 
                      id="product-photo-input"
                    />
                    <label 
                      htmlFor="product-photo-input"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition border border-slate-200"
                    >
                      <Upload size={14} />
                      {imagePreview ? 'Cambiar Foto' : 'Cargar Imagen'}
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WEBP (se optimiza automáticamente).</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Código de Barra / SKU (Opcional)</label>
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, sku: `PROD-${Date.now().toString().slice(-4)}` })}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    🎲 Generar código
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Auto-generado si se deja en blanco"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Si no tienes un código de barras, se asignará uno automáticamente.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Nombre del Producto *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="ej. Mouse Inalámbrico Logitech"
                  value={newProduct.nombre}
                  onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Descripción (Opcional)</label>
                <input 
                  type="text" 
                  placeholder="Detalles breves del artículo"
                  value={newProduct.descripcion}
                  onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              {/* Selección de Moneda y Precios */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Moneda del Producto</span>
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => cambiarMoneda('Bs')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                        moneda === 'Bs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      🇧🇴 Bs (Bolivianos)
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarMoneda('$')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                        moneda === '$' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      💵 $ (Dólares)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Precio Compra ({currencySymbol.trim()}) <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span></label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={newProduct.precio_compra}
                      onChange={(e) => setNewProduct({ ...newProduct, precio_compra: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Precio Venta ({currencySymbol.trim()}) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      placeholder="0.00"
                      value={newProduct.precio_venta}
                      onChange={(e) => setNewProduct({ ...newProduct, precio_venta: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Stock Inicial</label>
                  <input 
                    type="number" 
                    value={newProduct.stock_actual}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_actual: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Stock Mínimo</label>
                  <input 
                    type="number" 
                    value={newProduct.stock_minimo}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_minimo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingProduct}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingProduct ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR USUARIO */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nombre Completo *</label>
                <input type="text" required value={newUser.nombre}
                  onChange={e => setNewUser({ ...newUser, nombre: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Correo Electrónico *</label>
                <input type="email" required value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="vendedor@tienda.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Contraseña *</label>
                <input type="password" required minLength={6} value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Rol</label>
                <select value={newUser.rol} onChange={e => setNewUser({ ...newUser, rol: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white">
                  <option value="vendedor">🟢 Vendedor</option>
                  <option value="admin">🟣 Administrador</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => { setShowUserModal(false); setNewUser({ nombre: '', email: '', password: '', rol: 'vendedor' }); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isCreatingUser}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Usuario'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FACTURA / RECIBO PROFESIONAL (ESTILO DUAL A COLOR) */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera Corporativa Carnicería RM */}
            <div className="bg-gradient-to-r from-red-800 via-rose-800 to-rose-950 text-white p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3.5">
                  <LogoCarniceriaRM className="w-12 h-12 flex-shrink-0 drop-shadow-md" />
                  <div>
                    <span className="text-[10px] tracking-widest font-black uppercase bg-white/20 text-amber-300 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-white/10">
                      Factura Oficial · Cortes Selectos
                    </span>
                    <h3 className="text-xl font-black tracking-tight">Carnicería RM</h3>
                    <p className="text-xs text-rose-100">Res, Cerdo, Pollo y Embutidos Artesanales</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-white text-rose-950 font-mono font-black text-xs px-3 py-1.5 rounded-xl shadow-sm border border-rose-100">
                    {ticketData.nroFactura || 'FAC-00001'}
                  </span>
                  <p className="text-[11px] text-rose-200 mt-1 font-semibold">{ticketData.fecha} · {ticketData.hora}</p>
                </div>
              </div>
            </div>

            {/* Datos Comerciales y del Cliente */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">DATOS DEL CLIENTE</span>
                  <p className="font-bold text-slate-800 text-sm truncate">{ticketData.cliente}</p>
                  <p className="text-slate-500 mt-0.5">NIT / CI: <span className="font-mono font-bold text-slate-700">{ticketData.nit || 'S/N'}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">DATOS DE EMISIÓN</span>
                  <p className="text-slate-700 font-medium">Cajero: <strong className="text-slate-800">{ticketData.cajero}</strong></p>
                  <p className="text-slate-500 mt-0.5">Método: <strong className="text-indigo-600 capitalize">{ticketData.metodoPago === 'efectivo' ? 'Efectivo' : ticketData.metodoPago === 'qr' ? 'QR / Trans.' : 'Tarjeta'}</strong></p>
                </div>
              </div>

              {/* Tabla de Artículos con Diseño Nítido */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/90 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Cant.</th>
                      <th className="px-4 py-2.5">Descripción</th>
                      <th className="px-4 py-2.5 text-right">P. Unit</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ticketData.items.map((item, idx) => (
                      <tr key={item.product_id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-2.5 font-bold text-indigo-700">x{item.quantity}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{item.nombre}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-mono">{currencySymbol}{item.price.toFixed(2)}</td>
                        <td className="px-4 py-2.5 text-right font-black text-slate-900 font-mono">
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bloque de Totales y QR */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 border-t border-slate-100">
                {/* Código QR Informativo decorativo */}
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/60 w-full sm:w-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`Factura:${ticketData.nroFactura}|Total:${ticketData.total}|Fecha:${ticketData.fecha}`)}`}
                    alt="QR Factura"
                    className="w-14 h-14 rounded-lg border bg-white p-1"
                  />
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <p className="font-bold text-slate-700">Comprobante Válido</p>
                    <p>Escanea para verificar</p>
                    <p className="text-[9px] text-emerald-600 font-bold mt-0.5">✓ Venta Confirmada</p>
                  </div>
                </div>

                {/* Resumen Financiero */}
                <div className="w-full sm:w-60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">{currencySymbol}{ticketData.total.toFixed(2)}</span>
                  </div>
                  {ticketData.metodoPago === 'efectivo' && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Monto Recibido:</span>
                        <span className="font-mono">{currencySymbol}{ticketData.montoRecibido.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Vuelto / Cambio:</span>
                        <span className="font-mono font-black">{currencySymbol}{ticketData.vuelto.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-indigo-950 font-black text-sm">
                    <span>TOTAL A PAGAR:</span>
                    <span className="text-base text-indigo-700 font-black font-mono">
                      {currencySymbol}{ticketData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-center text-slate-400 italic">
                "Gracias por su preferencia · Esta nota de venta avala la entrega de mercadería"
              </p>
            </div>

            {/* Opciones de Impresión Dual (Factura Formal a Color o Ticket Térmico) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setTicketData(null)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition"
              >
                Cerrar
              </button>

              {/* Botón 1: Ticket Térmico POS 80mm */}
              <button
                type="button"
                onClick={() => {
                  const win = window.open('', '_blank', 'width=420,height=600');
                  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${ticketData.nroFactura} - Carnicería RM</title>
                    <style>
                      @page { size: 80mm auto; margin: 0; }
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 11px; margin: 0; padding: 12px; color: #111; max-width: 80mm; box-sizing: border-box; }
                      .text-center { text-align: center; }
                      .font-bold { font-weight: bold; }
                      .title { font-size: 16px; font-weight: 900; margin: 0 0 2px 0; letter-spacing: 0.5px; }
                      .hr { border: none; border-top: 1px dashed #777; margin: 8px 0; }
                      .table { width: 100%; border-collapse: collapse; font-size: 11px; }
                      .table th { border-bottom: 1px solid #000; padding: 3px 0; text-align: left; font-size: 10px; }
                      .table td { padding: 4px 0; }
                      .text-right { text-align: right; }
                      .total-box { font-size: 14px; font-weight: 900; display: flex; justify-content: space-between; margin-top: 4px; }
                      .qr-wrap { text-align: center; margin-top: 10px; }
                      .qr-wrap img { width: 75px; height: 75px; }
                    </style></head><body>
                      <div class="text-center">
                        <h2 class="title">CARNICERÍA RM</h2>
                        <div style="font-size:10px;font-weight:bold;color:#444;">CORTES SELECTOS & CALIDAD</div>
                        <div>NIT: 1028374029 · La Paz - Bolivia</div>
                        <div>Tel: +591 70000000</div>
                        <div class="font-bold" style="margin-top:4px;">${ticketData.nroFactura}</div>
                      </div>
                      <div class="hr"></div>
                      <div><b>Fecha:</b> ${ticketData.fecha} ${ticketData.hora}</div>
                      <div><b>Cliente:</b> ${ticketData.cliente}</div>
                      <div><b>NIT/CI:</b> ${ticketData.nit}</div>
                      <div><b>Cajero:</b> ${ticketData.cajero}</div>
                      <div class="hr"></div>
                      <table class="table">
                        <thead><tr><th>Cant. Detalle</th><th class="text-right">Total</th></tr></thead>
                        <tbody>
                          ${ticketData.items.map(i => `<tr><td>${i.quantity}x ${i.nombre} <small>(${currencySymbol}${i.price.toFixed(2)})</small></td><td class="text-right font-bold">${currencySymbol}${(i.price*i.quantity).toFixed(2)}</td></tr>`).join('')}
                        </tbody>
                      </table>
                      <div class="hr"></div>
                      <div class="total-box"><span>TOTAL:</span><span>${currencySymbol}${ticketData.total.toFixed(2)}</span></div>
                      <div><b>Método:</b> ${ticketData.metodoPago.toUpperCase()}</div>
                      ${ticketData.metodoPago === 'efectivo' ? `<div>Recibido: ${currencySymbol}${ticketData.montoRecibido.toFixed(2)}</div><div class="font-bold">Vuelto: ${currencySymbol}${ticketData.vuelto.toFixed(2)}</div>` : ''}
                      <div class="qr-wrap">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`CarniceriaRM|${ticketData.nroFactura}|NIT:${ticketData.nit}|Total:${ticketData.total}`)}" />
                        <div style="font-size:9px;color:#666;margin-top:4px;">¡Gracias por preferir Carnicería RM!</div>
                      </div>
                    </body></html>`);
                  win.document.close();
                  setTimeout(() => { win.focus(); win.print(); }, 300);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Receipt size={14} /> Ticket Térmico POS (80mm)
              </button>

              {/* Botón 2: Factura Formal a Color (Hoja Normal / Carta) */}
              <button
                type="button"
                onClick={() => {
                  const win = window.open('', '_blank', 'width=850,height=900');
                  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${ticketData.nroFactura} - Carnicería RM Factura</title>
                    <style>
                      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; box-sizing: border-box; }
                      @page { size: letter; margin: 12mm 15mm; }
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 10px 0; background: #fff; }
                      .invoice-wrapper { max-width: 800px; margin: 0 auto; }
                      
                      /* Cabecera idéntica al modal con fondo degradado Carmesí Gourmet */
                      .header {
                        background: linear-gradient(135deg, #991b1b 0%, #881337 55%, #4c0519 100%) !important;
                        color: #ffffff !important;
                        padding: 22px 26px;
                        border-radius: 18px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        box-shadow: 0 4px 14px rgba(136, 19, 55, 0.25);
                      }
                      .brand-wrap { display: flex; align-items: center; gap: 16px; }
                      .badge-tag {
                        display: inline-block;
                        background: rgba(255, 255, 255, 0.2) !important;
                        color: #fef08a !important;
                        padding: 3px 12px;
                        border-radius: 9999px;
                        font-size: 10px;
                        font-weight: 800;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                        border: 1px solid rgba(255,255,255,0.25);
                      }
                      .brand-name { font-size: 25px; font-weight: 900; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
                      .brand-sub { font-size: 12px; font-weight: 600; color: #ffe4e6; margin-top: 2px; }
                      .brand-info { font-size: 10px; color: #fecdd3; margin-top: 4px; opacity: 0.95; }
                      
                      .invoice-badge-box {
                        background: #ffffff !important;
                        color: #4c0519 !important;
                        font-family: monospace;
                        font-size: 16px;
                        font-weight: 900;
                        padding: 9px 18px;
                        border-radius: 12px;
                        box-shadow: 0 3px 6px rgba(0,0,0,0.15);
                        border: 1px solid #ffe4e6;
                        text-align: center;
                      }
                      .invoice-date { font-size: 11px; color: #fecdd3; margin-top: 6px; font-weight: 600; text-align: right; }
                      
                      /* Datos del comprador y de la emisión */
                      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc !important; border: 1px solid #e2e8f0; padding: 15px 18px; border-radius: 16px; font-size: 12px; margin-bottom: 20px; }
                      .meta-col strong { color: #0f172a; }
                      .meta-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.8px; }
                      
                      /* Tabla de Artículos */
                      .table-container { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
                      .table { width: 100%; border-collapse: collapse; font-size: 12px; }
                      .table th { background: #f1f5f9 !important; color: #475569; padding: 11px 16px; text-transform: uppercase; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                      .table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
                      .table tr:nth-child(even) { background: #fafafa !important; }
                      .text-right { text-align: right; }
                      
                      /* Resumen Financiero y QR */
                      .summary-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; }
                      .qr-box { display: flex; align-items: center; gap: 12px; background: #f8fafc !important; padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; font-size: 10px; color: #64748b; }
                      .qr-box img { width: 68px; height: 68px; border-radius: 6px; background: #fff; padding: 2px; border: 1px solid #cbd5e1; }
                      
                      .total-card { width: 280px; font-size: 12px; }
                      .total-card .line { display: flex; justify-content: space-between; margin-bottom: 5px; color: #475569; }
                      .total-card .line strong { color: #0f172a; }
                      .total-highlight {
                        background: #eef2ff !important;
                        border: 1.5px solid #c7d2fe;
                        border-radius: 12px;
                        padding: 10px 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        color: #1e1b4b;
                        font-weight: 900;
                        font-size: 14px;
                        margin-top: 8px;
                      }
                      .total-highlight span:last-child {
                        font-size: 17px;
                        color: #4338ca;
                        font-family: monospace;
                      }
                      
                      .footer-note { text-align: center; margin-top: 35px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 14px; font-style: italic; }
                    </style></head><body>
                      <div class="invoice-wrapper">
                        <!-- Cabecera Corporativa con degradado Carmesí Oficial -->
                        <div class="header">
                          <div class="brand-wrap">
                            <!-- SVG ESCUDO OFICIAL CARNICERÍA RM -->
                            <svg viewBox="0 0 100 100" width="76" height="76" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
                              <defs>
                                <linearGradient id="pShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stop-color="#b91c1c" />
                                  <stop offset="45%" stop-color="#881337" />
                                  <stop offset="100%" stop-color="#450a0a" />
                                </linearGradient>
                                <linearGradient id="pGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stop-color="#fef08a" />
                                  <stop offset="45%" stop-color="#f59e0b" />
                                  <stop offset="100%" stop-color="#b45309" />
                                </linearGradient>
                              </defs>
                              <path d="M50 4 L88 18 C88 58 68 85 50 96 C32 85 12 58 12 18 Z" fill="url(#pShieldGrad)" stroke="url(#pGoldGrad)" stroke-width="4" />
                              <path d="M50 11 L81 22 C81 54 64 77 50 87 C36 77 19 54 19 22 Z" fill="none" stroke="url(#pGoldGrad)" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.85" />
                              <path d="M32 29 C34 23 40 21 44 25 C41 28 40 32 43 35 C46 33 54 33 57 35 C60 32 59 28 56 25 C60 21 66 23 68 29 C62 32 58 38 57 42 C55 44 45 44 43 42 C42 38 38 32 32 29 Z" fill="url(#pGoldGrad)" />
                              <path d="M50 16 L51.2 19.5 L55 19.8 L52.2 22.2 L53 25.8 L50 23.8 L47 25.8 L47.8 22.2 L45 19.8 L48.8 19.5 Z" fill="url(#pGoldGrad)" />
                              <circle cx="36" cy="20" r="2" fill="url(#pGoldGrad)" />
                              <circle cx="64" cy="20" r="2" fill="url(#pGoldGrad)" />
                              <text x="50" y="66" text-anchor="middle" fill="#ffffff" font-size="25" font-weight="900" font-family="Arial, sans-serif" letter-spacing="1.5">RM</text>
                              <rect x="20" y="73.5" width="60" height="12" rx="6" fill="#18181b" stroke="url(#pGoldGrad)" stroke-width="1.2" />
                              <text x="50" y="82.5" text-anchor="middle" fill="url(#pGoldGrad)" font-size="7" font-weight="900" letter-spacing="1.2" font-family="Arial, sans-serif">CARNICERÍA</text>
                            </svg>
                            <div>
                              <div class="badge-tag">FACTURA OFICIAL · CORTES SELECTOS</div>
                              <h1 class="brand-name">Carnicería RM</h1>
                              <div class="brand-sub">Res, Cerdo, Pollo y Embutidos Artesanales</div>
                              <div class="brand-info">Casa Matriz: Av. Principal #1042 · La Paz - Bolivia · NIT: 1028374029 · Tel: +591 70000000</div>
                            </div>
                          </div>
                          <div>
                            <div class="invoice-badge-box">
                              ${ticketData.nroFactura}
                            </div>
                            <div class="invoice-date">
                              ${ticketData.fecha} · ${ticketData.hora}
                            </div>
                          </div>
                        </div>

                        <!-- Datos del Comprador y Emisión -->
                        <div class="meta-grid">
                          <div class="meta-col">
                            <div class="meta-title">DATOS DEL CLIENTE</div>
                            <div style="font-size:14px; font-weight:bold; color:#0f172a; margin-bottom:2px;">${ticketData.cliente}</div>
                            <div>NIT / CI: <strong style="font-family:monospace;">${ticketData.nit || 'S/N'}</strong></div>
                          </div>
                          <div class="meta-col" style="text-align:right;">
                            <div class="meta-title">DATOS DE EMISIÓN</div>
                            <div>Cajero: <strong>${ticketData.cajero}</strong></div>
                            <div>Método de Pago: <strong style="text-transform:capitalize; color:#4338ca;">${ticketData.metodoPago === 'efectivo' ? 'Efectivo' : ticketData.metodoPago === 'qr' ? 'QR / Trans.' : 'Tarjeta'}</strong></div>
                          </div>
                        </div>

                        <!-- Tabla de Cortes / Artículos -->
                        <div class="table-container">
                          <table class="table">
                            <thead>
                              <tr>
                                <th style="width:12%;">CANT.</th>
                                <th style="width:48%;">DESCRIPCIÓN</th>
                                <th style="width:20%;" class="text-right">P. UNIT</th>
                                <th style="width:20%;" class="text-right">SUBTOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${ticketData.items.map(i => `
                                <tr>
                                  <td style="font-weight:bold; color:#4338ca;">x${i.quantity}</td>
                                  <td style="font-weight:600; color:#0f172a;">${i.nombre}</td>
                                  <td class="text-right" style="font-family:monospace; color:#475569;">${currencySymbol}${i.price.toFixed(2)}</td>
                                  <td class="text-right" style="font-weight:900; font-family:monospace; color:#0f172a;">${currencySymbol}${(i.price * i.quantity).toFixed(2)}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>

                        <!-- Bloque de Totales y QR -->
                        <div class="summary-container">
                          <div class="qr-box">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`CarniceriaRM|Factura:${ticketData.nroFactura}|NIT:${ticketData.nit}|Total:${ticketData.total}|Fecha:${ticketData.fecha}`)}" />
                            <div>
                              <div style="font-weight:bold; color:#0f172a; font-size:11px;">Comprobante Válido</div>
                              <div>Escanea para verificar</div>
                              <div style="color:#059669; font-weight:bold; margin-top:3px;">✓ Venta Confirmada en Supabase</div>
                            </div>
                          </div>

                          <div class="total-card">
                            <div class="line">
                              <span>Subtotal:</span>
                              <span style="font-family:monospace; font-weight:bold;">${currencySymbol}${ticketData.total.toFixed(2)}</span>
                            </div>
                            ${ticketData.metodoPago === 'efectivo' ? `
                              <div class="line">
                                <span>Monto Recibido:</span>
                                <span style="font-family:monospace;">${currencySymbol}${ticketData.montoRecibido.toFixed(2)}</span>
                              </div>
                              <div class="line" style="color:#059669; font-weight:bold;">
                                <span>Vuelto / Cambio:</span>
                                <span style="font-family:monospace; font-weight:900;">${currencySymbol}${ticketData.vuelto.toFixed(2)}</span>
                              </div>
                            ` : ''}
                            <div class="total-highlight">
                              <span>TOTAL A PAGAR:</span>
                              <span>${currencySymbol}${ticketData.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div class="footer-note">
                          "Gracias por su preferencia · Esta nota de venta avala la entrega de mercadería"<br/>
                          Carnicería RM · Cortes Selectos · Tradición y Calidad Garantizada
                        </div>
                      </div>
                    </body></html>`);
                  win.document.close();
                  setTimeout(() => { win.focus(); win.print(); }, 400);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 hover:from-red-800 hover:to-rose-900 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-200"
              >
                <Printer size={15} /> Imprimir Factura Formal a Color (Carta)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PRODUCTO */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Editar Producto</h3>
            <p className="text-xs text-slate-500 mb-4">SKU: <span className="font-mono font-bold">{editingProduct.sku}</span></p>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              {/* Foto */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Foto del Producto</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                    {editImagePreview ? (
                      <>
                        <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setEditImagePreview(''); setEditingProduct(prev => ({ ...prev, imagen_url: '' })); if (editFileInputRef.current) editFileInputRef.current.value = ''; }}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-rose-600 transition" title="Quitar foto">
                          <X size={12} />
                        </button>
                      </>
                    ) : (<ImageIcon size={24} className="text-slate-400" />)}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" ref={editFileInputRef} onChange={handleEditImageChange} className="hidden" id="edit-photo-input" />
                    <label htmlFor="edit-photo-input" className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition border border-slate-200">
                      <Upload size={14} />
                      {editImagePreview ? 'Cambiar Foto' : 'Cargar Imagen'}
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WEBP (se optimiza automáticamente).</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Código / SKU *</label>
                <input type="text" required value={editingProduct.sku}
                  onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Nombre del Producto *</label>
                <input type="text" required value={editingProduct.nombre}
                  onChange={(e) => setEditingProduct({ ...editingProduct, nombre: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Descripción</label>
                <input type="text" value={editingProduct.descripcion}
                  onChange={(e) => setEditingProduct({ ...editingProduct, descripcion: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" />
              </div>
              {/* Selección de Moneda y Precios */}
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">Moneda del Producto</span>
                  <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => cambiarMoneda('Bs')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                        moneda === 'Bs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      🇧🇴 Bs (Bolivianos)
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarMoneda('$')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                        moneda === '$' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      💵 $ (Dólares)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Precio Compra ({currencySymbol.trim()}) <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span></label>
                    <input type="number" step="0.01" value={editingProduct.precio_compra}
                      placeholder="0.00"
                      onChange={(e) => setEditingProduct({ ...editingProduct, precio_compra: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Precio Venta ({currencySymbol.trim()}) *</label>
                    <input type="number" step="0.01" required value={editingProduct.precio_venta}
                      placeholder="0.00"
                      onChange={(e) => setEditingProduct({ ...editingProduct, precio_venta: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border rounded-xl text-sm bg-white" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Stock Actual</label>
                  <input type="number" value={editingProduct.stock_actual}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_actual: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Stock Mínimo</label>
                  <input type="number" value={editingProduct.stock_minimo}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_minimo: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => { setEditingProduct(null); setEditImagePreview(''); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm">
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ANULACIÓN / ELIMINACIÓN DE VENTA */}
      {ventaEliminarConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">¿Anular Venta #{ventaEliminarConfirm.id}?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Total de la transacción: <strong className="text-slate-800">{currencySymbol}{ventaEliminarConfirm.total.toFixed(2)}</strong>
            </p>
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-700 text-left space-y-1 mb-5">
              <p className="font-bold flex items-center gap-1">⚠️ Acción importante:</p>
              <p>• La venta se cancelará del historial y de los balances.</p>
              <p>• <strong>El stock de todos los productos será devuelto automáticamente</strong> al inventario.</p>
            </div>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setVentaEliminarConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={isDeletingVenta}
                onClick={() => handleEliminarVenta(ventaEliminarConfirm.id)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-md shadow-rose-200 transition flex items-center justify-center gap-2"
              >
                {isDeletingVenta ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Anulando...
                  </>
                ) : (
                  'Sí, anular venta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR ELIMINACIÓN */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">¿Eliminar producto?</h3>
            <p className="text-sm text-slate-500 mb-1">Vas a desactivar:</p>
            <p className="font-bold text-slate-800 mb-1">{deleteConfirm.nombre}</p>
            <p className="text-xs text-slate-400 mb-5">SKU: {deleteConfirm.sku} · Stock: {deleteConfirm.stock_actual} unid.</p>
            <p className="text-xs text-rose-600 bg-rose-50 rounded-xl p-2 mb-5">El producto dejará de aparecer en el catálogo y el POS.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm">
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteProduct(deleteConfirm)}
                disabled={isDeletingProduct}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENTRADA DE STOCK (COMPRA RÁPIDA) */}
      {purchaseProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Entrada de Mercadería</h3>
            <p className="text-xs text-slate-500 mb-4">
              Abastecer stock para: <strong className="text-slate-800">{purchaseProduct.nombre}</strong> (Actual: {purchaseProduct.stock_actual})
            </p>
            <form onSubmit={handleStockEntry} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Cantidad a ingresar</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={purchaseQty}
                  onChange={(e) => setPurchaseQty(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Precio Unitario de Compra ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setPurchaseProduct(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isAddingStock}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-md flex items-center justify-center gap-2"
                >
                  {isAddingStock ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Añadiendo...
                    </>
                  ) : (
                    'Añadir Stock'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
