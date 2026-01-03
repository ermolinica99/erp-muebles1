import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { productosAPI } from '../services/api';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filters, setFilters] = useState({
    alerta_stock: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    stock_actual: 0,
    stock_minimo: 0,
    precio_venta: 0,
    tiempo_fabricacion: 0,
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const response = await productosAPI.getAll();
      setProductos(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching productos:', err);
      setError('Error al cargar los productos');
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
      alerta_stock: '',
    });
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.codigo.trim()) errors.codigo = 'El código es obligatorio';
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (formData.stock_actual < 0) errors.stock_actual = 'El stock no puede ser negativo';
    if (formData.stock_minimo < 0) errors.stock_minimo = 'El stock mínimo no puede ser negativo';
    if (formData.precio_venta <= 0) errors.precio_venta = 'El precio debe ser mayor a 0';
    if (formData.tiempo_fabricacion < 0) errors.tiempo_fabricacion = 'El tiempo no puede ser negativo';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const loadingToast = toast.loading(isEditing ? 'Actualizando producto...' : 'Creando producto...');

    try {
      setSubmitting(true);
      
      if (isEditing) {
        await productosAPI.update(editingId, formData);
        toast.success('Producto actualizado exitosamente', { id: loadingToast });
      } else {
        await productosAPI.create(formData);
        toast.success('Producto creado exitosamente', { id: loadingToast });
      }
      
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        stock_actual: 0,
        stock_minimo: 0,
        precio_venta: 0,
        tiempo_fabricacion: 0,
      });
      
      fetchProductos();
      
    } catch (err) {
      console.error('Error saving producto:', err);
      toast.error('Error al guardar el producto. Verifica que el código no esté duplicado.', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (producto) => {
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      precio_venta: producto.precio_venta,
      tiempo_fabricacion: producto.tiempo_fabricacion,
    });
    setIsEditing(true);
    setEditingId(producto.id);
    setIsModalOpen(true);
  };

  const handleVerDetalle = (producto) => {
    setSelectedProducto(producto);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id, nombre) => {
    toast((t) => (
      <div>
        <p className="font-medium mb-2">¿Eliminar producto "{nombre}"?</p>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                const loadingToast = toast.loading('Eliminando...');
                await productosAPI.delete(id);
                fetchProductos();
                toast.success('Producto eliminado exitosamente', { id: loadingToast });
              } catch (err) {
                console.error('Error deleting producto:', err);
                toast.error('Error al eliminar el producto');
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
    const dataToExport = filteredProductos.map(producto => ({
      'Código': producto.codigo,
      'Nombre': producto.nombre,
      'Descripción': producto.descripcion || '',
      'Stock Actual': producto.stock_actual,
      'Stock Mínimo': producto.stock_minimo,
      'Precio Venta': `${producto.precio_venta}€`,
      'Tiempo Fabricación': `${producto.tiempo_fabricacion}h`,
      'Alerta Stock': producto.alerta_stock ? 'SÍ' : 'NO',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    
    const colWidths = [
      { wch: 15 },
      { wch: 30 },
      { wch: 40 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 12 },
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `Productos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel descargado exitosamente');
  };

  const filteredProductos = productos.filter((producto) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      producto.codigo.toLowerCase().includes(searchLower) ||
      producto.nombre.toLowerCase().includes(searchLower) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(searchLower));

    const matchAlerta = filters.alerta_stock === '' || 
      (filters.alerta_stock === 'true' && producto.alerta_stock) ||
      (filters.alerta_stock === 'false' && !producto.alerta_stock);

    return matchSearch && matchAlerta;
  });

  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductos = filteredProductos.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando productos...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">Gestión de productos en catálogo</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:border-purple-500 hover:text-purple-600 hover:shadow-md transition-all"
          >
            <span className="text-xl">📥</span>
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                stock_actual: 0,
                stock_minimo: 0,
                precio_venta: 0,
                tiempo_fabricacion: 0,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="text-xl">➕</span>
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por código, nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de Stock</label>
            <select
              name="alerta_stock"
              value={filters.alerta_stock}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="true">Con Alerta</option>
              <option value="false">Sin Alerta</option>
            </select>
          </div>
        </div>

        {filters.alerta_stock && (
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

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Productos</p>
              <p className="text-4xl font-bold mt-2">{productos.length}</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Stock Total</p>
              <p className="text-4xl font-bold mt-2">
                {productos.reduce((sum, p) => sum + p.stock_actual, 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Alertas de Stock</p>
              <p className="text-4xl font-bold mt-2">
                {productos.filter(p => p.alerta_stock).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>
{/* Tabla */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Mínimo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedProductos.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {producto.codigo}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                  {producto.descripcion && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{producto.descripcion}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.stock_actual}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {producto.stock_minimo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {producto.alerta_stock ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      🔴 BAJO
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ OK
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {producto.precio_venta}€
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleVerDetalle(producto)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(producto)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(producto.id, producto.nombre)}
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
                <span className="font-medium">{Math.min(endIndex, filteredProductos.length)}</span> de{' '}
                <span className="font-medium">{filteredProductos.length}</span> resultados
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
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
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

      {filteredProductos.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          {searchTerm || filters.alerta_stock
            ? 'No se encontraron productos con los filtros aplicados'
            : 'No hay productos registrados'}
        </div>
      )}

      {/* Modal para crear/editar producto */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false);
          setEditingId(null);
        }}
        title={isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.codigo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="PROD-001"
              />
              {formErrors.codigo && (
                <p className="text-red-500 text-xs mt-1">{formErrors.codigo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mesa de comedor"
              />
              {formErrors.nombre && (
                <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Actual *
              </label>
              <input
                type="number"
                name="stock_actual"
                value={formData.stock_actual}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.stock_actual ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.stock_actual && (
                <p className="text-red-500 text-xs mt-1">{formErrors.stock_actual}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Mínimo *
              </label>
              <input
                type="number"
                name="stock_minimo"
                value={formData.stock_minimo}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.stock_minimo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.stock_minimo && (
                <p className="text-red-500 text-xs mt-1">{formErrors.stock_minimo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Venta (€) *
              </label>
              <input
                type="number"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.precio_venta ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.precio_venta && (
                <p className="text-red-500 text-xs mt-1">{formErrors.precio_venta}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo Fabricación (horas)
              </label>
              <input
                type="number"
                name="tiempo_fabricacion"
                value={formData.tiempo_fabricacion}
                onChange={handleInputChange}
                min="0"
                step="0.1"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formErrors.tiempo_fabricacion ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.tiempo_fabricacion && (
                <p className="text-red-500 text-xs mt-1">{formErrors.tiempo_fabricacion}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Descripción detallada del producto..."
            />
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
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </Modal>
{/* Modal para ver detalle del producto */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalle del Producto"
      >
        {selectedProducto && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-medium text-gray-900">{selectedProducto.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{selectedProducto.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Actual</p>
                  <p className="font-medium text-gray-900">{selectedProducto.stock_actual}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Mínimo</p>
                  <p className="font-medium text-gray-900">{selectedProducto.stock_minimo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio Venta</p>
                  <p className="font-medium text-gray-900">{selectedProducto.precio_venta}€</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo Fabricación</p>
                  <p className="font-medium text-gray-900">{selectedProducto.tiempo_fabricacion}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado de Stock</p>
                  {selectedProducto.alerta_stock ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      🔴 Stock Bajo
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ Stock OK
                    </span>
                  )}
                </div>
                {selectedProducto.descripcion && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="font-medium text-gray-900">{selectedProducto.descripcion}</p>
                  </div>
                )}
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