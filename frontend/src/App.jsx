import React, { useState, useEffect } from 'react';
import api from './api';
import { 
  Package, ShoppingCart, ShoppingBag, LayoutDashboard, 
  Plus, AlertTriangle, CheckCircle, TrendingUp, DollarSign,
  Boxes, Trash2, LogIn, LogOut, Search, UserCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'purchases', 'dashboard'
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // Auth form
  const [authEmail, setAuthEmail] = useState('admin@tienda.com');
  const [authPassword, setAuthPassword] = useState('admin123');
  const [authName, setAuthName] = useState('Administrador');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);

  // Cart for POS (Sale)
  const [cart, setCart] = useState([]);
  const [saleSuccess, setSaleSuccess] = useState('');
  const [saleError, setSaleError] = useState('');

  // New Product Modal/Form
  const [newProduct, setNewProduct] = useState({
    sku: '', nombre: '', descripcion: '', precio_compra: '', precio_venta: '', stock_actual: 0, stock_minimo: 5
  });
  const [showProductModal, setShowProductModal] = useState(false);

  // Quick Purchase (Stock in)
  const [purchaseProduct, setPurchaseProduct] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState(5);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseMsg, setPurchaseMsg] = useState('');

  const isAdmin = user?.rol === 'admin';

  useEffect(() => {
    if (token) {
      loadProducts();
      if (isAdmin) {
        loadDashboard();
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
        alert('No hay más stock disponible para este producto');
        return;
      }
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (product.stock_actual <= 0) {
        alert('Producto sin stock disponible');
        return;
      }
      setCart([...cart, { product_id: product.id, nombre: product.nombre, price: product.precio_venta, quantity: 1, stock_max: product.stock_actual }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Submit Sale (Checkout)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaleError('');
    setSaleSuccess('');
    try {
      await api.post('/ventas/checkout', {
        items: cart.map(item => ({
          producto_id: item.product_id,
          cantidad: item.quantity
        }))
      });
      setSaleSuccess(`¡Venta procesada con éxito por un total de $${cartTotal.toFixed(2)}!`);
      setCart([]);
      loadProducts();
      loadDashboard();
      setTimeout(() => setSaleSuccess(''), 4000);
    } catch (err) {
      setSaleError(err.response?.data?.detail || 'Error al procesar la venta');
    }
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/productos/', {
        sku: newProduct.sku,
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion,
        precio_compra: parseFloat(newProduct.precio_compra || 0),
        precio_venta: parseFloat(newProduct.precio_venta),
        stock_actual: parseInt(newProduct.stock_actual || 0),
        stock_minimo: parseInt(newProduct.stock_minimo || 5)
      });
      setShowProductModal(false);
      setNewProduct({ sku: '', nombre: '', descripcion: '', precio_compra: '', precio_venta: '', stock_actual: 0, stock_minimo: 5 });
      loadProducts();
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al crear producto');
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
      setPurchaseMsg('¡Stock incrementado con éxito!');
      setPurchaseProduct(null);
      loadProducts();
      loadDashboard();
      setTimeout(() => setPurchaseMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error en compra');
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

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={authName} 
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Correo Electrónico</label>
              <input 
                type="email" 
                required 
                value={authEmail} 
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase">Contraseña</label>
              <input 
                type="password" 
                required 
                value={authPassword} 
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
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

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <LayoutDashboard size={18} />
              Dashboard & KPIs
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
                    onClick={() => setShowProductModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
                  >
                    <Plus size={16} />
                    Nuevo Producto
                  </button>
                )}
              </div>

              {loadingProducts ? (
                <div className="flex-1 flex items-center justify-center text-slate-400">Cargando catálogo...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center">
                  <Package size={48} className="text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No hay productos en inventario</p>
                  <p className="text-xs text-slate-400 mb-4">Empieza registrando tu primer producto</p>
                  <button 
                    onClick={() => setShowProductModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                  >
                    + Crear Producto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      className={`p-4 bg-white rounded-2xl border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                        p.stock_actual <= p.stock_minimo ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                      }`}
                    >
                      <div>
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

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-lg font-extrabold text-slate-900">${p.precio_venta.toFixed(2)}</span>
                        <div className="flex gap-2">
                          {isAdmin && (
                            <button 
                              onClick={() => { setPurchaseProduct(p); setPurchasePrice(p.precio_compra); }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                              title="Entrada de Stock (Compra)"
                            >
                              + Stock
                            </button>
                          )}
                          <button 
                            onClick={() => addToCart(p)}
                            disabled={p.stock_actual <= 0}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
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

              {saleSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle size={16} />
                  {saleSuccess}
                </div>
              )}

              {saleError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {saleError}
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                  <ShoppingBag size={40} className="mb-2 text-slate-300" />
                  <p className="text-sm">El carrito está vacío</p>
                  <p className="text-xs text-slate-400">Haz clic en "Vender" en cualquier producto</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.nombre}</p>
                        <p className="text-xs text-slate-500">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-white rounded-lg border border-slate-200">
                          x{item.quantity}
                        </span>
                        <span className="text-xs font-bold text-slate-900 w-14 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.product_id)} 
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-slate-600 font-medium">Total a cobrar:</span>
                  <span className="text-2xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                    cart.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  }`}
                >
                  <CheckCircle size={18} />
                  Confirmar Venta y Descontar Stock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: INVENTARIO */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isAdmin ? 'Catálogo de Inventario' : 'Catálogo de Productos y Precios'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAdmin ? 'Gestión de existencias sincronizada con Supabase PostgreSQL' : 'Consulta de existencias y precios al público'}
                </p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setShowProductModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition"
                >
                  <Plus size={16} />
                  Nuevo Producto
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
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
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 5} className="px-6 py-8 text-center text-slate-400">No hay productos registrados</td>
                    </tr>
                  ) : (
                    products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-700">{p.sku}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{p.nombre}</p>
                          {p.descripcion && <p className="text-xs text-slate-400">{p.descripcion}</p>}
                        </td>
                        {isAdmin && <td className="px-6 py-4 text-slate-600">${p.precio_compra.toFixed(2)}</td>}
                        <td className="px-6 py-4 font-bold text-slate-900">${p.precio_venta.toFixed(2)}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-emerald-600 font-semibold">
                            +${(p.precio_venta - p.precio_compra).toFixed(2)}
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
                            <button 
                              onClick={() => { setPurchaseProduct(p); setPurchasePrice(p.precio_compra); }}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                            >
                              + Abastecer
                            </button>
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
            <h2 className="text-xl font-bold text-slate-800">Métricas Clave del Negocio (Hoy)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Productos Activos</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{dashboardData?.total_productos ?? products.length}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Package size={24} />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Alertas Stock Mínimo</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">{dashboardData?.productos_stock_bajo ?? 0}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Ventas Totales Hoy</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">${(dashboardData?.total_ventas_hoy ?? 0).toFixed(2)}</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <TrendingUp size={24} />
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Transacciones Hoy</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">{dashboardData?.num_ventas_hoy ?? 0}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <DollarSign size={24} />
                </div>
              </div>
            </div>

            <div className="p-6 bg-indigo-900 text-white rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold">Supabase PostgreSQL Conectado</h3>
                <p className="text-sm text-indigo-200 mt-1">
                  Todas las operaciones de inventario, stock atómico y compras están sincronizadas en tiempo real en la nube.
                </p>
              </div>
              <a 
                href="https://compraventapro.onrender.com/docs" 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-lg"
              >
                Abrir Swagger API ↗
              </a>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREAR PRODUCTO */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Registrar Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Código de Barra / SKU *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="ej. PROD-001"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Precio Compra ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="15.00"
                    value={newProduct.precio_compra}
                    onChange={(e) => setNewProduct({ ...newProduct, precio_compra: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Precio Venta ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="25.00"
                    value={newProduct.precio_venta}
                    onChange={(e) => setNewProduct({ ...newProduct, precio_venta: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
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
