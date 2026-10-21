import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { 
  Package, ShoppingCart, ShoppingBag, LayoutDashboard, 
  Plus, AlertTriangle, CheckCircle, TrendingUp, DollarSign,
  Boxes, Trash2, LogIn, LogOut, Search, UserCheck, 
  FileDown, Image as ImageIcon, Upload, X, Pencil,
  History, Users, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'dashboard', 'ventas', 'usuarios'
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // Auth form
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all', 'low_stock'
  const [dashboardData, setDashboardData] = useState(null);
  const [ventasSemana, setVentasSemana] = useState([]);

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

  // Historial de ventas
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);

  // Gestión de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' });

  // Cart for POS (Sale)
  const [cart, setCart] = useState([]);
  const [saleSuccess, setSaleSuccess] = useState('');
  const [saleError, setSaleError] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo' | 'qr' | 'tarjeta'
  const [montoRecibido, setMontoRecibido] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
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

  const isAdmin = user?.rol === 'admin';

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
    try {
      await api.post('/usuarios/', newUser);
      setShowUserModal(false);
      setNewUser({ nombre: '', email: '', password: '', rol: 'vendedor' });
      loadUsuarios();
      showToast('Usuario creado con éxito', 'success');
    } catch (err) { showToast(err.response?.data?.detail || 'Error al crear usuario', 'error'); }
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

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Encabezado
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CompraVentaPro — Reporte de Inventario', 14, 13);

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

    doc.save(`Inventario_CompraVentaPro_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Login / Register handler
  const handleAuth = async (e) => {
    e.preventDefault();
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

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Submit Sale (Checkout)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (metodoPago === 'efectivo') {
      const recibido = parseFloat(montoRecibido || 0);
      if (recibido < cartTotal) {
        setSaleError(`Monto insuficiente. Faltan $${(cartTotal - recibido).toFixed(2)}`);
        return;
      }
    }
    setSaleError('');
    setSaleSuccess('');
    try {
      await api.post('/ventas/checkout', {
        items: cart.map(item => ({
          producto_id: item.product_id,
          cantidad: item.quantity
        }))
      });
      const vuelto = metodoPago === 'efectivo' ? Math.max(0, parseFloat(montoRecibido || 0) - cartTotal) : 0;
      setTicketData({
        items: [...cart],
        total: cartTotal,
        metodoPago,
        montoRecibido: parseFloat(montoRecibido || cartTotal),
        vuelto,
        cliente: clienteNombre || 'Consumidor Final',
        hora: new Date().toLocaleTimeString('es-ES'),
        fecha: new Date().toLocaleDateString('es-ES'),
      });
      setCart([]);
      setMontoRecibido('');
      setClienteNombre('');
      loadProducts();
      if (isAdmin) loadDashboard();
    } catch (err) {
      setSaleError(err.response?.data?.detail || 'Error al procesar la venta');
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
    }
  };

  // Quick Purchase (Stock Entry)
  const handleStockEntry = async (e) => {
    e.preventDefault();
    if (!purchaseProduct) return;
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
    }
  };

  // Eliminar (desactivar) producto con confirmación
  const handleDeleteProduct = async (producto) => {
    try {
      await api.delete(`/productos/${producto.id}`);
      setDeleteConfirm(null);
      loadProducts();
      if (isAdmin) loadDashboard();
      showToast('Producto desactivado del inventario', 'info');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error al eliminar producto', 'error');
    }
  };

  // Auth Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-100">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-300">
              <Boxes size={36} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800">CompraVentaPro</h2>
          <p className="text-center text-slate-500 text-sm mb-6">MVP de Inventario y Ventas Rápido</p>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4" autoComplete="off">
            {isRegistering && (
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  autoComplete="off"
                  value={authName} 
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                autoComplete="new-password"
                placeholder="ejemplo@tienda.com"
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Contraseña</label>
              <input 
                type="password" 
                required 
                autoComplete="new-password"
                placeholder="••••••••"
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-200"
            >
              {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿Primer usuario? Regístrate aquí'}
            </button>
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
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-600 rounded-xl">
            <Boxes size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CompraVentaPro</h1>
            <span className="text-xs text-indigo-400 font-mono">FastAPI + Supabase</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'pos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <ShoppingCart size={18} />
            Punto de Venta (POS)
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Package size={18} />
            Inventario / Catálogo
          </button>
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('dashboard'); loadVentasSemana(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={18} />
              Dashboard & KPIs
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('ventas'); loadVentas(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'ventas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <History size={18} />
              Historial de Ventas
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('usuarios'); loadUsuarios(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'usuarios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Users size={18} />
              Gestión de Usuarios
            </button>
          )}

          {/* Selector de Moneda */}
          <div className="pt-4 mt-4 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block px-2 mb-2">Moneda del Sistema</span>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => cambiarMoneda('Bs')}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  moneda === 'Bs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇧🇴 Bs (BOB)
              </button>
              <button
                type="button"
                onClick={() => cambiarMoneda('$')}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  moneda === '$' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                💵 $ (USD)
              </button>
            </div>
          </div>
        </nav>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isAdmin ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {isAdmin ? 'ADMIN' : 'VENDEDOR'}
            </span>
            <span className="text-xs text-slate-300 truncate">{user?.nombre || user?.email}</span>
          </div>
          <button onClick={handleLogout} title="Cerrar sesión" className="p-2 text-slate-400 hover:text-rose-400 transition">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto">
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
                        <span className="text-lg font-extrabold text-slate-900 block mb-2">{currencySymbol}{p.precio_venta.toFixed(2)}</span>
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
                              p.stock_actual <= 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            <ShoppingCart size={14} />
                            Vender
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
                <span className="ml-auto bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-bold">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </span>
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
                  <p className="text-xs text-slate-400">Haz clic en "Vender" en cualquier producto</p>
                </div>
              ) : (
                <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 gap-2">
                      <div className="w-9 h-9 bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center flex-shrink-0">
                        {item.imagen_url ? (
                          <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.nombre}</p>
                        <p className="text-xs text-slate-500">{currencySymbol}{item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold px-1.5 py-0.5 bg-white rounded-lg border border-slate-200">
                          x{item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-900 w-16 text-right">
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button onClick={() => removeFromCart(item.product_id)} className="text-slate-400 hover:text-rose-500 p-0.5">
                          <Trash2 size={14} />
                        </button>
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
                    {/* Nombre del cliente */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Cliente (opcional)</label>
                      <input
                        type="text"
                        placeholder="Consumidor Final"
                        value={clienteNombre}
                        onChange={e => setClienteNombre(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
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
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                    cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  <CheckCircle size={18} />
                  {metodoPago === 'efectivo' ? 'Cobrar en Efectivo' : metodoPago === 'qr' ? 'Confirmar Pago QR' : 'Confirmar Pago Tarjeta'}
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
                {/* Botón Descargar Reporte PDF */}
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition"
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
                        {isAdmin && <td className="px-6 py-4 text-slate-600">{currencySymbol}{p.precio_compra.toFixed(2)}</td>}
                        <td className="px-6 py-4 font-bold text-slate-900">{currencySymbol}{p.precio_venta.toFixed(2)}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-emerald-600 font-semibold">
                            +{currencySymbol}{(p.precio_venta - p.precio_compra).toFixed(2)}
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

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Productos Activos',    value: dashboardData?.total_productos ?? products.length, color: 'blue',    Icon: Package },
                { label: 'Alertas Stock Mínimo', value: dashboardData?.productos_stock_bajo ?? 0,          color: 'amber',   Icon: AlertTriangle },
                { label: `Ventas Hoy (${currencySymbol.trim()})`, value: `${currencySymbol}${(dashboardData?.total_ventas_hoy ?? 0).toFixed(2)}`, color: 'emerald', Icon: TrendingUp },
                { label: 'Transacciones Hoy',    value: dashboardData?.num_ventas_hoy ?? 0,                color: 'indigo',  Icon: DollarSign },
              ].map(({ label, value, color, Icon }) => (
                <div key={label} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
                    <p className={`text-2xl font-black mt-1 text-${color}-600`}>{value}</p>
                  </div>
                  <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-xl`}>
                    <Icon size={24} />
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfica de ventas últimos 7 días */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-500" />
                Ventas — Últimos 7 días
              </h3>
              {ventasSemana.length > 0 ? (
                <Bar
                  data={{
                    labels: ventasSemana.map(d => d.fecha),
                    datasets: [{
                      label: 'Total ($)',
                      data: ventasSemana.map(d => d.total),
                      backgroundColor: 'rgba(99,102,241,0.7)',
                      borderColor: 'rgba(99,102,241,1)',
                      borderWidth: 2,
                      borderRadius: 8,
                    }]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: ctx => ` $${ctx.raw.toFixed(2)}` } }
                    },
                    scales: {
                      y: { beginAtZero: true, ticks: { callback: v => `$${v}` }, grid: { color: '#f1f5f9' } },
                      x: { grid: { display: false } }
                    }
                  }}
                />
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
                <p className="text-2xl font-black text-rose-500">${(dashboardData?.total_compras_hoy ?? 0).toFixed(2)}</p>
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
        {activeTab === 'ventas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Historial de Ventas</h2>
              <button onClick={loadVentas} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition">
                <RefreshCw size={13} /> Actualizar
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loadingVentas ? (
                <div className="p-12 text-center text-slate-400">Cargando historial...</div>
              ) : ventas.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-slate-400">
                  <History size={48} className="text-slate-200 mb-3" />
                  <p className="font-semibold">No hay ventas registradas aún</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">#</th>
                        <th className="px-5 py-3">Fecha y Hora</th>
                        <th className="px-5 py-3">Productos</th>
                        <th className="px-5 py-3 text-right">Total</th>
                        <th className="px-5 py-3 text-center">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ventas.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3 font-mono font-bold text-slate-500">#{v.id}</td>
                          <td className="px-5 py-3 text-slate-700">
                            {new Date(v.creado_en).toLocaleDateString('es-ES')}
                            <span className="text-slate-400 ml-2 text-xs">{new Date(v.creado_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              {v.detalles?.length ?? 0} ítem{(v.detalles?.length ?? 0) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-black text-emerald-600">${v.total.toFixed(2)}</td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => setVentaDetalle(ventaDetalle?.id === v.id ? null : v)}
                              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg text-xs font-semibold transition">
                              {ventaDetalle?.id === v.id ? 'Cerrar' : 'Ver'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Panel detalle de venta expandido */}
            {ventaDetalle && (
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">Detalle Venta #{ventaDetalle.id}</h3>
                  <button onClick={() => setVentaDetalle(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <div className="space-y-2">
                  {ventaDetalle.detalles?.map(d => (
                    <div key={d.id} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold">{d.cantidad}</span>
                        <div>
                          <p className="font-semibold text-slate-800">Producto ID #{d.producto_id}</p>
                          <p className="text-xs text-slate-400">${d.precio_unit.toFixed(2)} c/u</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">${d.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 font-black text-emerald-700">
                    <span>TOTAL</span>
                    <span>${ventaDetalle.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumen total */}
            {ventas.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Ventas', value: ventas.length, color: 'indigo' },
                  { label: 'Ingresos Totales', value: `$${ventas.reduce((a, v) => a + v.total, 0).toFixed(2)}`, color: 'emerald' },
                  { label: 'Ticket Promedio', value: `$${(ventas.reduce((a, v) => a + v.total, 0) / ventas.length).toFixed(2)}`, color: 'amber' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 bg-${color}-50 border border-${color}-100 rounded-2xl text-center`}>
                    <p className={`text-xs font-semibold text-${color}-600 uppercase`}>{label}</p>
                    <p className={`text-xl font-black text-${color}-700 mt-1`}>{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {u.rol.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs">
                          {new Date(u.creado_en).toLocaleDateString('es-ES')}
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
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Guardar
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
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TICKET DE VENTA */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
            {/* Header ticket */}
            <div className="bg-emerald-600 text-white p-5 text-center">
              <CheckCircle size={36} className="mx-auto mb-2" />
              <h3 className="text-lg font-black">¡Venta Exitosa!</h3>
              <p className="text-emerald-100 text-xs">{ticketData.fecha} — {ticketData.hora}</p>
            </div>
            {/* Cuerpo ticket */}
            <div className="p-5 font-mono text-sm">
              <div className="border-b border-dashed border-slate-300 pb-3 mb-3">
                <p className="text-xs text-slate-500 text-center uppercase font-semibold tracking-widest">CompraVentaPro</p>
                <p className="text-xs text-center text-slate-400">Cliente: <span className="text-slate-700 font-bold">{ticketData.cliente}</span></p>
              </div>
              {/* Items */}
              <div className="space-y-1.5 mb-3">
                {ticketData.items.map(item => (
                  <div key={item.product_id} className="flex justify-between text-xs">
                    <span className="text-slate-700 truncate flex-1">{item.nombre} <span className="text-slate-400">x{item.quantity}</span></span>
                    <span className="font-bold text-slate-900 ml-2">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1">
                <div className="flex justify-between text-sm font-bold">
                  <span>TOTAL</span>
                  <span>{currencySymbol}{ticketData.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Método</span>
                  <span className="capitalize font-semibold">
                    {ticketData.metodoPago === 'efectivo' ? '💵 Efectivo' : ticketData.metodoPago === 'qr' ? '📱 QR/Trans.' : '💳 Tarjeta'}
                  </span>
                </div>
                {ticketData.metodoPago === 'efectivo' && (
                  <>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Recibido</span>
                      <span>{currencySymbol}{ticketData.montoRecibido.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-emerald-700">
                      <span>Vuelto</span>
                      <span>{currencySymbol}{ticketData.vuelto.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-4">¡Gracias por su compra!</p>
            </div>
            {/* Acciones */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setTicketData(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  // Imprimir ticket
                  const win = window.open('', '_blank', 'width=350,height=500');
                  win.document.write(`<html><head><title>Ticket</title><style>body{font-family:monospace;font-size:12px;padding:16px;max-width:300px}h2{text-align:center}hr{border:none;border-top:1px dashed #999;margin:8px 0}.total{font-weight:bold;font-size:14px}.footer{text-align:center;color:#999;margin-top:12px;font-size:10px}</style></head><body>
                    <h2>CompraVentaPro</h2>
                    <p style="text-align:center">Fecha: ${ticketData.fecha} ${ticketData.hora}</p>
                    <p style="text-align:center">Cliente: <b>${ticketData.cliente}</b></p>
                    <hr/>
                    ${ticketData.items.map(i => `<div style="display:flex;justify-content:space-between"><span>${i.nombre} x${i.quantity}</span><span>${currencySymbol}${(i.price*i.quantity).toFixed(2)}</span></div>`).join('')}
                    <hr/>
                    <div class="total" style="display:flex;justify-content:space-between"><span>TOTAL</span><span>${currencySymbol}${ticketData.total.toFixed(2)}</span></div>
                    <div style="display:flex;justify-content:space-between"><span>Pago</span><span>${ticketData.metodoPago}</span></div>
                    ${ticketData.metodoPago === 'efectivo' ? `<div style="display:flex;justify-content:space-between"><span>Recibido</span><span>${currencySymbol}${ticketData.montoRecibido.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;font-weight:bold;color:green"><span>Vuelto</span><span>${currencySymbol}${ticketData.vuelto.toFixed(2)}</span></div>` : ''}
                    <p class="footer">¡Gracias por su compra!</p>
                  </body></html>`);
                  win.document.close();
                  win.print();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5"
              >
                🖨️ Imprimir
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
                <button type="submit" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm shadow-md">
                  Guardar Cambios
                </button>
              </div>
            </form>
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
              <button onClick={() => handleDeleteProduct(deleteConfirm)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm shadow-md">
                Sí, eliminar
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Añadir Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
