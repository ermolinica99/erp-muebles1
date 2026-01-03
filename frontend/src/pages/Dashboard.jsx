import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalPedidos: 0,
    totalProductos: 0,
    pedidosPendientes: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientesRes, pedidosRes, productosRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/clientes/'),
        fetch('http://127.0.0.1:8000/api/pedidos/'),
        fetch('http://127.0.0.1:8000/api/productos/'),
      ]);

      const clientes = await clientesRes.json();
      const pedidos = await pedidosRes.json();
      const productos = await productosRes.json();

      setStats({
        totalClientes: clientes.length,
        totalPedidos: pedidos.length,
        totalProductos: productos.length,
        pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Datos de ejemplo para gráficos
  const pedidosPorEstado = [
    { name: 'Pendiente', value: 12, color: '#F59E0B' },
    { name: 'En Producción', value: 8, color: '#3B82F6' },
    { name: 'Producido', value: 15, color: '#8B5CF6' },
    { name: 'Entregado', value: 25, color: '#10B981' },
  ];

  const ventasMensuales = [
    { mes: 'Ene', ventas: 45000 },
    { mes: 'Feb', ventas: 52000 },
    { mes: 'Mar', ventas: 48000 },
    { mes: 'Abr', ventas: 61000 },
    { mes: 'May', ventas: 55000 },
    { mes: 'Jun', ventas: 67000 },
  ];

  const productosMasVendidos = [
    { producto: 'Mesa Comedor', cantidad: 45 },
    { producto: 'Silla Oficina', cantidad: 38 },
    { producto: 'Estantería', cantidad: 32 },
    { producto: 'Escritorio', cantidad: 28 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visión general del sistema de producción</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 - Clientes */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Clientes</p>
              <p className="text-4xl font-bold mt-2">{stats.totalClientes}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-4xl">👥</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-blue-100">Gestión de clientes activos</span>
          </div>
        </div>

        {/* Card 2 - Pedidos */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Pedidos</p>
              <p className="text-4xl font-bold mt-2">{stats.totalPedidos}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-4xl">📋</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-100">{stats.pedidosPendientes} pendientes</span>
          </div>
        </div>

        {/* Card 3 - Productos */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Productos</p>
              <p className="text-4xl font-bold mt-2">{stats.totalProductos}</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-purple-100">En catálogo</span>
          </div>
        </div>

        {/* Card 4 - Producción */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">En Producción</p>
              <p className="text-4xl font-bold mt-2">8</p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-4xl">⚙️</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-100">Pedidos activos</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Estado */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos por Estado</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pedidosPorEstado}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pedidosPorEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos Más Vendidos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productosMasVendidos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="producto" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart Row 2 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas Mensuales (€)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ventasMensuales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="ventas" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ fill: '#10B981', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-md">
            <span className="text-2xl">➕</span>
            <span className="font-medium">Nuevo Cliente</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-md">
            <span className="text-2xl">📝</span>
            <span className="font-medium">Nuevo Pedido</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-md">
            <span className="text-2xl">📦</span>
            <span className="font-medium">Nuevo Producto</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all transform hover:scale-105 shadow-md">
            <span className="text-2xl">📊</span>
            <span className="font-medium">Ver Reportes</span>
          </button>
        </div>
      </div>
    </div>
  );
}