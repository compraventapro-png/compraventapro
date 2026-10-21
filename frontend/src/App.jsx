import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import { 
  Package, ShoppingCart, ShoppingBag, LayoutDashboard, 
  Plus, Minus, AlertTriangle, CheckCircle, TrendingUp, DollarSign,
  Boxes, Trash2, LogIn, LogOut, Search, UserCheck, 
  FileDown, Image as ImageIcon, Upload, X, Pencil,
  History, Users, ToggleLeft, ToggleRight, RefreshCw, Printer, Receipt
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
          {/* 1. Dashboard (solo admin) */}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('dashboard'); loadVentasSemana(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={18} />
              Dashboard & KPIs
            </button>
          )}

          {/* 2. Catálogo / Inventario */}
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Package size={18} />
            Inventario / Catálogo
          </button>

          {/* 3. Punto de Venta (POS) */}
          <button 
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'pos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <ShoppingCart size={18} />
            Punto de Venta (POS)
          </button>

          {/* 4. Historial de Ventas (solo admin) */}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('ventas'); loadVentas(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'ventas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <History size={18} />
              Historial de Ventas
            </button>
          )}

          {/* 5. Gestión de Usuarios (solo admin) */}
          {isAdmin && (
            <button 
              onClick={() => { setActiveTab('usuarios'); loadUsuarios(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'usuarios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Users size={18} />
              Gestión de Usuarios
            </button>
          )}
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
                        <th className="px-5 py-3 text-center">Acciones</th>
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
                          <td className="px-5 py-3 text-right font-black text-emerald-600">{currencySymbol}{v.total.toFixed(2)}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button onClick={() => setVentaDetalle(ventaDetalle?.id === v.id ? null : v)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">
                                {ventaDetalle?.id === v.id ? 'Cerrar' : 'Ver'}
                              </button>
                              <button
                                onClick={() => {
                                  // Reabrir comprobante para reimpresión
                                  const reconstructedItems = (v.detalles || []).map(d => {
                                    const p = products.find(prod => prod.id === d.producto_id);
                                    return {
                                      product_id: d.producto_id,
                                      nombre: p ? p.nombre : `Producto #${d.producto_id}`,
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
                                    cajero: user?.nombre || user?.email || 'Administrador',
                                  });
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                                title="Reimprimir comprobante"
                              >
                                <Receipt size={13} /> Factura
                              </button>
                            </div>
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

      {/* MODAL: FACTURA / RECIBO PROFESIONAL (ESTILO DUAL A COLOR) */}
      {ticketData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabecera Corporativa con Estilo y Color */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
                    <Receipt size={28} className="text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest font-black uppercase bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
                      Comprobante Electrónico
                    </span>
                    <h3 className="text-xl font-black tracking-tight">CompraVentaPro</h3>
                    <p className="text-xs text-indigo-100">Solución Integral de Inventario y Ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-white text-indigo-900 font-mono font-black text-xs px-3 py-1.5 rounded-xl shadow-sm">
                    {ticketData.nroFactura || 'FAC-00001'}
                  </span>
                  <p className="text-[11px] text-indigo-200 mt-1">{ticketData.fecha} · {ticketData.hora}</p>
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
                  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${ticketData.nroFactura}</title>
                    <style>
                      @page { size: 80mm auto; margin: 0; }
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; font-size: 11px; margin: 0; padding: 12px; color: #111; max-width: 80mm; box-sizing: border-box; }
                      .text-center { text-align: center; }
                      .font-bold { font-weight: bold; }
                      .title { font-size: 15px; font-weight: 900; margin: 0 0 2px 0; }
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
                        <h2 class="title">COMPRAVENTAPRO</h2>
                        <div>NIT: 1028475029 · La Paz - Bolivia</div>
                        <div class="font-bold">${ticketData.nroFactura}</div>
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
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`Factura:${ticketData.nroFactura}|Total:${ticketData.total}`)}" />
                        <div style="font-size:9px;color:#666;margin-top:4px;">¡Gracias por su compra!</div>
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
                  const win = window.open('', '_blank', 'width=800,height=900');
                  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${ticketData.nroFactura} - Factura Formal</title>
                    <style>
                      @page { size: letter; margin: 15mm; }
                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 25px; background: #fff; }
                      .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #4f46e5; }
                      .brand-name { font-size: 26px; font-weight: 900; color: #312e81; margin: 0; letter-spacing: -0.5px; }
                      .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
                      .invoice-badge { background: #eef2ff; border: 1.5px solid #c7d2fe; padding: 12px 18px; rounded: 12px; border-radius: 12px; text-align: right; }
                      .invoice-title { font-size: 13px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 1px; }
                      .invoice-num { font-size: 18px; font-weight: 900; color: #1e1b4b; font-family: monospace; }
                      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; font-size: 12px; }
                      .meta-col strong { color: #0f172a; }
                      .meta-title { font-size: 10px; font-weight: 800; color: #6366f1; text-transform: uppercase; margin-bottom: 5px; }
                      .table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
                      .table th { background: #4f46e5; color: #ffffff; padding: 10px 14px; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; text-align: left; }
                      .table th:first-child { border-radius: 8px 0 0 8px; }
                      .table th:last-child { border-radius: 0 8px 8px 0; text-align: right; }
                      .table td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
                      .table tr:nth-child(even) { background: #f8fafc; }
                      .text-right { text-align: right; }
                      .summary-container { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; }
                      .qr-box { display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 10px; color: #64748b; }
                      .qr-box img { width: 70px; height: 70px; border-radius: 6px; }
                      .total-card { width: 260px; background: #312e81; color: white; padding: 14px 18px; border-radius: 12px; font-size: 12px; }
                      .total-card .line { display: flex; justify-content: space-between; margin-bottom: 6px; }
                      .total-card .line.main { font-size: 18px; font-weight: 900; color: #38bdf8; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px; }
                      .footer-note { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
                    </style></head><body>
                      <div class="header">
                        <div>
                          <h1 class="brand-name">CompraVentaPro</h1>
                          <div class="brand-sub">Comercializadora y Distribución · Sistema Computarizado</div>
                          <div style="font-size:11px;color:#475569;margin-top:6px;">Av. Principal #1042 · La Paz - Bolivia · Tel: +591 70000000</div>
                        </div>
                        <div class="invoice-badge">
                          <div class="invoice-title">FACTURA / NOTA DE VENTA</div>
                          <div class="invoice-num">${ticketData.nroFactura}</div>
                          <div style="font-size:11px;color:#64748b;margin-top:4px;">Emisión: ${ticketData.fecha} · ${ticketData.hora}</div>
                        </div>
                      </div>

                      <div class="meta-grid">
                        <div class="meta-col">
                          <div class="meta-title">DATOS DEL COMPRADOR</div>
                          <div>Señor(es): <strong>${ticketData.cliente}</strong></div>
                          <div>NIT / CI: <strong>${ticketData.nit}</strong></div>
                          <div>Forma de Pago: <strong style="text-transform:capitalize;">${ticketData.metodoPago}</strong></div>
                        </div>
                        <div class="meta-col" style="text-align:right;">
                          <div class="meta-title">DATOS DE LA TRANSACCIÓN</div>
                          <div>Atendido por: <strong>${ticketData.cajero}</strong></div>
                          <div>Estado: <strong style="color:#059669;">PAGADO Y CONFIRMADO</strong></div>
                          <div>Moneda: <strong>${currencySymbol.trim() === 'Bs' ? 'Bolivianos (BOB)' : 'Dólares (USD)'}</strong></div>
                        </div>
                      </div>

                      <table class="table">
                        <thead>
                          <tr>
                            <th style="width:10%;">Cant.</th>
                            <th style="width:50%;">Descripción del Producto</th>
                            <th style="width:20%;" class="text-right">Precio Unitario</th>
                            <th style="width:20%;" class="text-right">Importe Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${ticketData.items.map(i => `
                            <tr>
                              <td style="font-weight:bold;color:#4f46e5;">x${i.quantity}</td>
                              <td style="font-weight:600;color:#0f172a;">${i.nombre}</td>
                              <td class="text-right" style="font-family:monospace;">${currencySymbol}${i.price.toFixed(2)}</td>
                              <td class="text-right" style="font-weight:bold;font-family:monospace;color:#0f172a;">${currencySymbol}${(i.price * i.quantity).toFixed(2)}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>

                      <div class="summary-container">
                        <div class="qr-box">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`Factura:${ticketData.nroFactura}|NIT:${ticketData.nit}|Total:${ticketData.total}|Fecha:${ticketData.fecha}`)}" />
                          <div>
                            <div style="font-weight:bold;color:#1e293b;font-size:11px;">DOCUMENTO OFICIAL</div>
                            <div>Código de Control Electrónico</div>
                            <div style="color:#059669;font-weight:bold;margin-top:2px;">Transacción Registrada en Supabase</div>
                          </div>
                        </div>

                        <div class="total-card">
                          <div class="line"><span>Subtotal:</span><span>${currencySymbol}${ticketData.total.toFixed(2)}</span></div>
                          ${ticketData.metodoPago === 'efectivo' ? `
                            <div class="line"><span>Efectivo Recibido:</span><span>${currencySymbol}${ticketData.montoRecibido.toFixed(2)}</span></div>
                            <div class="line" style="color:#86efac;font-weight:bold;"><span>Vuelto / Cambio:</span><span>${currencySymbol}${ticketData.vuelto.toFixed(2)}</span></div>
                          ` : ''}
                          <div class="line main">
                            <span>TOTAL:</span>
                            <span>${currencySymbol}${ticketData.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div class="footer-note">
                        ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY.<br/>
                        Generado por el Sistema CompraVentaPro · Sincronizado en la nube
                      </div>
                    </body></html>`);
                  win.document.close();
                  setTimeout(() => { win.focus(); win.print(); }, 400);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200"
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
