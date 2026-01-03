import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { pedidosAPI, clientesAPI, productosAPI } from '../services/api';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [filters, setFilters] = useState({
    estado: '',
    cliente: '',
    fechaDesde: '',
    fechaHasta: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [formData, setFormData] = useState({
    numero_pedido: '',
    cliente: '',
    fecha_entrega_estimada: '',
    estado: 'pendiente',
    observaciones: '',
  });
  
  const [lineas, setLineas] = useState([
    { producto: '', cantidad: 1, precio_unitario: 0 }
  ]);
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pedidosRes, clientesRes, productosRes] = await Promise.all([
        pedidosAPI.getAll(),
        clientesAPI.getAll(),
        productosAPI.getAll(),
      ]);
      setPedidos(pedidosRes.data);
      setClientes(clientesRes.data);
      setProductos(productosRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      estado: '',
      cliente: '',
      fechaDesde: '',
      fechaHasta: '',
    });
    setCurrentPage(1);
  };

  const handleLineaChange = (index, field, value) => {
    const newLineas = [...lineas];
    newLineas[index][field] = value;
    
    if (field === 'producto' && value) {
      const producto = productos.find(p => p.id === parseInt(value));
      if (producto) {
        newLineas[index].precio_unitario = producto.precio_venta;
      }
    }
    
    setLineas(newLineas);
  };

  const addLinea = () => {
    setLineas([...lineas, { producto: '', cantidad: 1, precio_unitario: 0 }]);
  };

  const removeLinea = (index) => {
    if (lineas.length > 1) {
      setLineas(lineas.filter((_, i) => i !== index));
    }
  };

  const calcularTotal = () => {
    return lineas.reduce((total, linea) => {
      return total + (linea.cantidad * linea.precio_unitario);
    }, 0);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.numero_pedido.trim()) {
      errors.numero_pedido = 'El número de pedido es obligatorio';
    }
    if (!formData.cliente) {
      errors.cliente = 'Debe seleccionar un cliente';
    }
    if (!formData.fecha_entrega_estimada) {
      errors.fecha_entrega_estimada = 'La fecha de entrega es obligatoria';
    }
    
    const lineasValidas = lineas.filter(l => l.producto && l.cantidad > 0);
    if (lineasValidas.length === 0) {
      errors.lineas = 'Debe agregar al menos un producto';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const loadingToast = toast.loading(isEditing ? 'Actualizando pedido...' : 'Creando pedido...');

    try {
      setSubmitting(true);
      
      const pedidoData = {
        ...formData,
        total: calcularTotal(),
      };

      if (isEditing) {
        await pedidosAPI.update(editingId, pedidoData);
        toast.success('Pedido actualizado exitosamente', { id: loadingToast });
      } else {
        const pedidoResponse = await pedidosAPI.create(pedidoData);
        const pedidoId = pedidoResponse.data.id;
        
        const lineasValidas = lineas.filter(l => l.producto && l.cantidad > 0);
        
        for (const linea of lineasValidas) {
          await fetch('http://127.0.0.1:8000/api/lineas-pedido/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pedido: pedidoId,
              producto: linea.producto,
              cantidad: linea.cantidad,
              precio_unitario: linea.precio_unitario,
              subtotal: linea.cantidad * linea.precio_unitario,
            }),
          });
        }
        
        toast.success('Pedido creado exitosamente', { id: loadingToast });
      }
      
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        numero_pedido: '',
        cliente: '',
        fecha_entrega_estimada: '',
        estado: 'pendiente',
        observaciones: '',
      });
      setLineas([{ producto: '', cantidad: 1, precio_unitario: 0 }]);
      
      fetchData();
      
    } catch (err) {
      console.error('Error saving pedido:', err);
      toast.error('Error al guardar el pedido', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };
const handleEdit = async (pedidoId) => {
    try {
      const response = await pedidosAPI.getById(pedidoId);
      const pedido = response.data;
      
      setFormData({
        numero_pedido: pedido.numero_pedido,
        cliente: pedido.cliente,
        fecha_entrega_estimada: pedido.fecha_entrega_estimada,
        estado: pedido.estado,
        observaciones: pedido.observaciones || '',
      });
      
      if (pedido.lineas && pedido.lineas.length > 0) {
        setLineas(pedido.lineas.map(linea => ({
          producto: linea.producto,
          cantidad: linea.cantidad,
          precio_unitario: linea.precio_unitario,
        })));
      }
      
      setIsEditing(true);
      setEditingId(pedidoId);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error loading pedido:', err);
      toast.error('Error al cargar el pedido');
    }
  };

  const handleEstadoChange = async (pedidoId, nuevoEstado) => {
    const loadingToast = toast.loading('Actualizando estado...');
    
    try {
      const pedidoResponse = await pedidosAPI.getById(pedidoId);
      const pedido = pedidoResponse.data;
      
      await pedidosAPI.update(pedidoId, {
        ...pedido,
        estado: nuevoEstado,
      });
      
      fetchData();
      
      toast.success('Estado actualizado exitosamente', { id: loadingToast });
    } catch (err) {
      console.error('Error updating estado:', err);
      toast.error('Error al actualizar el estado', { id: loadingToast });
    }
  };

  const handleVerDetalle = async (pedidoId) => {
    try {
      const response = await pedidosAPI.getById(pedidoId);
      setSelectedPedido(response.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error fetching pedido detail:', err);
      toast.error('Error al cargar el detalle del pedido');
    }
  };

  const handleDelete = async (id, numero) => {
    toast((t) => (
      <div>
        <p className="font-medium mb-2">¿Eliminar pedido "{numero}"?</p>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                const loadingToast = toast.loading('Eliminando...');
                await pedidosAPI.delete(id);
                fetchData();
                toast.success('Pedido eliminado exitosamente', { id: loadingToast });
              } catch (err) {
                console.error('Error deleting pedido:', err);
                toast.error('Error al eliminar el pedido');
              }
              toast.dismiss(t.id);
            }}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Sí, eliminar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
    });
  };

  const handleExportExcel = () => {
    const dataToExport = filteredPedidos.map(pedido => ({
      'Número': pedido.numero_pedido,
      'Cliente': pedido.cliente_nombre,
      'Fecha Pedido': formatearFecha(pedido.fecha_pedido),
      'Fecha Entrega': formatearFecha(pedido.fecha_entrega_estimada),
      'Estado': getEstadoLabel(pedido.estado),
      'Total': `${pedido.total}€`,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    
    const colWidths = [
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel descargado exitosamente');
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      en_produccion: 'bg-blue-100 text-blue-800 border-blue-300',
      producido: 'bg-purple-100 text-purple-800 border-purple-300',
      entregado: 'bg-green-100 text-green-800 border-green-300',
      cancelado: 'bg-red-100 text-red-800 border-red-300',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendiente',
      en_produccion: 'En Producción',
      producido: 'Producido',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
    };
    return labels[estado] || estado;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      pedido.numero_pedido.toLowerCase().includes(searchLower) ||
      pedido.cliente_nombre.toLowerCase().includes(searchLower) ||
      pedido.estado.toLowerCase().includes(searchLower);

    const matchEstado = !filters.estado || pedido.estado === filters.estado;
    const matchCliente = !filters.cliente || pedido.cliente === parseInt(filters.cliente);
    
    const matchFechaDesde = !filters.fechaDesde || 
      new Date(pedido.fecha_pedido) >= new Date(filters.fechaDesde);
    const matchFechaHasta = !filters.fechaHasta || 
      new Date(pedido.fecha_pedido) <= new Date(filters.fechaHasta);

    return matchSearch && matchEstado && matchCliente && matchFechaDesde && matchFechaHasta;
  });

  const totalPages = Math.ceil(filteredPedidos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPedidos = filteredPedidos.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gestión de pedidos del sistema</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:border-green-500 hover:text-green-600 hover:shadow-md transition-all"
          >
            <span className="text-xl">📥</span>
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setFormData({
                numero_pedido: '',
                cliente: '',
                fecha_entrega_estimada: '',
                estado: 'pendiente',
                observaciones: '',
              });
              setLineas([{ producto: '', cantidad: 1, precio_unitario: 0 }]);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="text-xl">➕</span>
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por número, cliente o estado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <span className="absolute left-4 top-3.5 text-gray-400 text-xl">
          🔍
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        )}
      </div>
{/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              value={filters.estado}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_produccion">En Producción</option>
              <option value="producido">Producido</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              name="cliente"
              value={filters.cliente}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Todos los clientes</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde</label>
            <input
              type="date"
              name="fechaDesde"
              value={filters.fechaDesde}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
            <input
              type="date"
              name="fechaHasta"
              value={filters.fechaHasta}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {(filters.estado || filters.cliente || filters.fechaDesde || filters.fechaHasta) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Pedido
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entrega Estimada
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pedido.numero_pedido}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pedido.cliente_nombre}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatearFecha(pedido.fecha_pedido)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatearFecha(pedido.fecha_entrega_estimada)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={pedido.estado}
                    onChange={(e) => handleEstadoChange(pedido.id, e.target.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 ${getEstadoColor(pedido.estado)}`}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_produccion">En Producción</option>
                    <option value="producido">Producido</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pedido.total}€
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleVerDetalle(pedido.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(pedido.id)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(pedido.id, pedido.numero_pedido)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                <span className="font-medium">{Math.min(endIndex, filteredPedidos.length)}</span> de{' '}
                <span className="font-medium">{filteredPedidos.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ‹
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  ›
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {filteredPedidos.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          {searchTerm || filters.estado || filters.cliente || filters.fechaDesde || filters.fechaHasta
            ? 'No se encontraron pedidos con los filtros aplicados' 
            : 'No hay pedidos registrados. Haz clic en "Nuevo Pedido" para crear uno.'}
        </div>
      )}

      {/* Modal crear/editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false);
          setEditingId(null);
        }}
        title={isEditing ? 'Editar Pedido' : 'Crear Nuevo Pedido'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pedido *
                </label>
                <input
                  type="text"
                  name="numero_pedido"
                  value={formData.numero_pedido}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.numero_pedido ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="PED-2026-001"
                />
                {formErrors.numero_pedido && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.numero_pedido}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.cliente ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
                {formErrors.cliente && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.cliente}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Entrega Estimada *
                </label>
                <input
                  type="date"
                  name="fecha_entrega_estimada"
                  value={formData.fecha_entrega_estimada}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    formErrors.fecha_entrega_estimada ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.fecha_entrega_estimada && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.fecha_entrega_estimada}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_produccion">En Producción</option>
                  <option value="producido">Producido</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Notas adicionales sobre el pedido..."
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Productos</h3>
              <button
                type="button"
                onClick={addLinea}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                + Agregar Producto
              </button>
            </div>

            {formErrors.lineas && (
              <p className="text-red-500 text-sm mb-2">{formErrors.lineas}</p>
            )}

            <div className="space-y-3">
              {lineas.map((linea, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Producto
                    </label>
                    <select
                      value={linea.producto}
                      onChange={(e) => handleLineaChange(index, 'producto', e.target.value)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((producto) => (
                        <option key={producto.id} value={producto.id}>
                          {producto.nombre} ({producto.precio_venta}€)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={linea.cantidad}
                      onChange={(e) => handleLineaChange(index, 'cantidad', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Precio Unit.
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={linea.precio_unitario}
                      onChange={(e) => handleLineaChange(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Subtotal
                    </label>
                    <input
                      type="text"
                      value={(linea.cantidad * linea.precio_unitario).toFixed(2) + '€'}
                      disabled
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div className="col-span-1 flex items-end">
                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLinea(index)}
                        className="w-full py-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-end items-center">
                <span className="text-lg font-medium text-gray-700 mr-4">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  {calcularTotal().toFixed(2)}€
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setIsEditing(false);
                setEditingId(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Pedido' : 'Crear Pedido')}
            </button>
          </div>
        </form>
      </Modal>
{/* Modal detalle */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalle del Pedido"
      >
        {selectedPedido && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Pedido</p>
                  <p className="font-medium text-gray-900">{selectedPedido.numero_pedido}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(selectedPedido.estado)}`}>
                    {getEstadoLabel(selectedPedido.estado)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium text-gray-900">{selectedPedido.cliente_datos?.nombre || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{selectedPedido.cliente_datos?.email || ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{selectedPedido.cliente_datos?.telefono || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Pedido</p>
                  <p className="font-medium text-gray-900">{formatearFecha(selectedPedido.fecha_pedido)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Entrega Estimada</p>
                  <p className="font-medium text-gray-900">{formatearFecha(selectedPedido.fecha_entrega_estimada)}</p>
                </div>
              </div>
              {selectedPedido.observaciones && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Observaciones</p>
                  <p className="font-medium text-gray-900">{selectedPedido.observaciones}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Productos del Pedido</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedPedido.lineas?.map((linea, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{linea.producto_nombre}</div>
                          <div className="text-gray-500 text-xs">Código: {linea.producto_codigo}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{linea.cantidad}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{linea.precio_unitario}€</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{linea.subtotal}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end items-center">
                <span className="text-lg font-medium text-gray-700 mr-4">Total del Pedido:</span>
                <span className="text-2xl font-bold text-green-600">{selectedPedido.total}€</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}