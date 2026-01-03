import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { materiasPrimasAPI } from '../services/api';
import Modal from '../components/Modal';
import * as XLSX from 'xlsx';

export default function MateriasPrimas() {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filters, setFilters] = useState({
    alerta_stock: '',
    unidad: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    stock_actual: 0,
    stock_minimo: 0,
    unidad: 'm',
    precio_unitario: 0,
    proveedor: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    try {
      setLoading(true);
      const response = await materiasPrimasAPI.getAll();
      setMaterias(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching materias primas:', err);
      setError('Error al cargar las materias primas');
    } finally {
      setLoading(false);
    }
  };

  const getUnidadLabel = (unidad) => {
    const unidades = {
      'm': 'metros',
      'm2': 'm²',
      'kg': 'kg',
      'unidad': 'uds',
      'litro': 'litros'
    };
    return unidades[unidad] || unidad;
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
      unidad: '',
    });
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.codigo.trim()) errors.codigo = 'El código es obligatorio';
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es obligatorio';
    if (formData.stock_actual < 0) errors.stock_actual = 'El stock no puede ser negativo';
    if (formData.stock_minimo < 0) errors.stock_minimo = 'El stock mínimo no puede ser negativo';
    if (formData.precio_unitario <= 0) errors.precio_unitario = 'El precio debe ser mayor a 0';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const loadingToast = toast.loading(isEditing ? 'Actualizando materia prima...' : 'Creando materia prima...');

    try {
      setSubmitting(true);
      
      if (isEditing) {
        await materiasPrimasAPI.update(editingId, formData);
        toast.success('Materia prima actualizada exitosamente', { id: loadingToast });
      } else {
        await materiasPrimasAPI.create(formData);
        toast.success('Materia prima creada exitosamente', { id: loadingToast });
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
        unidad: 'm',
        precio_unitario: 0,
        proveedor: '',
      });
      
      fetchMaterias();
      
    } catch (err) {
      console.error('Error saving materia prima:', err);
      toast.error('Error al guardar la materia prima. Verifica que el código no esté duplicado.', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (materia) => {
    setFormData({
      codigo: materia.codigo,
      nombre: materia.nombre,
      descripcion: materia.descripcion || '',
      stock_actual: materia.stock_actual,
      stock_minimo: materia.stock_minimo,
      unidad: materia.unidad,
      precio_unitario: materia.precio_unitario,
      proveedor: materia.proveedor || '',
    });
    setIsEditing(true);
    setEditingId(materia.id);
    setIsModalOpen(true);
  };

  const handleVerDetalle = (materia) => {
    setSelectedMateria(materia);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (id, nombre) => {
    toast((t) => (
      <div>
        <p className="font-medium mb-2">¿Eliminar materia prima "{nombre}"?</p>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              try {
                const loadingToast = toast.loading('Eliminando...');
                await materiasPrimasAPI.delete(id);
                fetchMaterias();
                toast.success('Materia prima eliminada exitosamente', { id: loadingToast });
              } catch (err) {
                console.error('Error deleting materia prima:', err);
                toast.error('Error al eliminar la materia prima');
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
    const dataToExport = filteredMaterias.map(materia => ({
      'Código': materia.codigo,
      'Nombre': materia.nombre,
      'Descripción': materia.descripcion || '',
      'Stock Actual': `${materia.stock_actual} ${getUnidadLabel(materia.unidad)}`,
      'Stock Mínimo': `${materia.stock_minimo} ${getUnidadLabel(materia.unidad)}`,
      'Proveedor': materia.proveedor || '',
      'Precio Unitario': `${materia.precio_unitario}€`,
      'Valor Total': `${(materia.stock_actual * materia.precio_unitario).toFixed(2)}€`,
      'Alerta Stock': materia.alerta_stock ? 'SÍ' : 'NO',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Materias Primas');
    
    const colWidths = [
      { wch: 15 },
      { wch: 30 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, `MateriasPrimas_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel descargado exitosamente');
  };

  const filteredMaterias = materias.filter((materia) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      materia.codigo.toLowerCase().includes(searchLower) ||
      materia.nombre.toLowerCase().includes(searchLower) ||
      (materia.proveedor && materia.proveedor.toLowerCase().includes(searchLower)) ||
      (materia.descripcion && materia.descripcion.toLowerCase().includes(searchLower));

    const matchAlerta = filters.alerta_stock === '' || 
      (filters.alerta_stock === 'true' && materia.alerta_stock) ||
      (filters.alerta_stock === 'false' && !materia.alerta_stock);

    const matchUnidad = filters.unidad === '' || materia.unidad === filters.unidad;

    return matchSearch && matchAlerta && matchUnidad;
  });

  const totalPages = Math.ceil(filteredMaterias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMaterias = filteredMaterias.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando materias primas...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Materias Primas</h1>
          <p className="text-gray-500 mt-1">Gestión de materias primas en almacén</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:border-amber-500 hover:text-amber-600 hover:shadow-md transition-all"
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
                unidad: 'm',
                precio_unitario: 0,
                proveedor: '',
              });
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-amber-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <span className="text-xl">➕</span>
            <span>Nueva Materia Prima</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por código, nombre, proveedor o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todos</option>
              <option value="true">Con Alerta</option>
              <option value="false">Sin Alerta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
            <select
              name="unidad"
              value={filters.unidad}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Todas</option>
              <option value="m">Metros</option>
              <option value="m2">m²</option>
              <option value="kg">Kilogramos</option>
              <option value="unidad">Unidades</option>
              <option value="litro">Litros</option>
            </select>
          </div>
        </div>

        {(filters.alerta_stock || filters.unidad) && (
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Total Materias</p>
              <p className="text-4xl font-bold mt-2">{materias.length}</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🧱</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Alertas de Stock</p>
              <p className="text-4xl font-bold mt-2">
                {materias.filter(m => m.alerta_stock).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Proveedores Únicos</p>
              <p className="text-4xl font-bold mt-2">
                {new Set(materias.map(m => m.proveedor).filter(Boolean)).size}
              </p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">🏭</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Valor Total Stock</p>
              <p className="text-4xl font-bold mt-2">
                {materias.reduce((sum, m) => sum + (m.stock_actual * m.precio_unitario), 0).toFixed(0)}€
              </p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-3xl">💰</span>
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
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Unit.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedMaterias.map((materia) => (
              <tr key={materia.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {materia.codigo}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{materia.nombre}</div>
                  {materia.descripcion && (
                    <div className="text-sm text-gray-500 truncate max-w-xs">{materia.descripcion}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {materia.stock_actual} {getUnidadLabel(materia.unidad)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {materia.stock_minimo} {getUnidadLabel(materia.unidad)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {materia.alerta_stock ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      🔴 BAJO
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ OK
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {materia.proveedor || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {materia.precio_unitario}€
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleVerDetalle(materia)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(materia)}
                    className="text-green-600 hover:text-green-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(materia.id, materia.nombre)}
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
                <span className="font-medium">{Math.min(endIndex, filteredMaterias.length)}</span> de{' '}
                <span className="font-medium">{filteredMaterias.length}</span> resultados
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
                            ? 'z-10 bg-amber-50 border-amber-500 text-amber-600'
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

      {filteredMaterias.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          {searchTerm || filters.alerta_stock || filters.unidad
            ? 'No se encontraron materias primas con los filtros aplicados'
            : 'No hay materias primas registradas'}
        </div>
      )}

      {/* Modal para crear/editar materia prima */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false);
          setEditingId(null);
        }}
        title={isEditing ? 'Editar Materia Prima' : 'Crear Nueva Materia Prima'}
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors.codigo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="MAT-001"
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors.nombre ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Madera de roble"
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
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
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
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors.stock_minimo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.stock_minimo && (
                <p className="text-red-500 text-xs mt-1">{formErrors.stock_minimo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida *
              </label>
              <select
                name="unidad"
                value={formData.unidad}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="m">Metros</option>
                <option value="m2">m²</option>
                <option value="kg">Kilogramos</option>
                <option value="unidad">Unidades</option>
                <option value="litro">Litros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario (€) *
              </label>
              <input
                type="number"
                name="precio_unitario"
                value={formData.precio_unitario}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  formErrors.precio_unitario ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.precio_unitario && (
                <p className="text-red-500 text-xs mt-1">{formErrors.precio_unitario}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                name="proveedor"
                value={formData.proveedor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Nombre del proveedor"
              />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Descripción detallada de la materia prima..."
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
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400"
            >
              {submitting ? 'Guardando...' : (isEditing ? 'Actualizar Materia Prima' : 'Crear Materia Prima')}
            </button>
          </div>
        </form>
      </Modal>
{/* Modal para ver detalle de la materia prima */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalle de Materia Prima"
      >
        {selectedMateria && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Código</p>
                  <p className="font-medium text-gray-900">{selectedMateria.codigo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{selectedMateria.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Actual</p>
                  <p className="font-medium text-gray-900">
                    {selectedMateria.stock_actual} {getUnidadLabel(selectedMateria.unidad)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stock Mínimo</p>
                  <p className="font-medium text-gray-900">
                    {selectedMateria.stock_minimo} {getUnidadLabel(selectedMateria.unidad)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio Unitario</p>
                  <p className="font-medium text-gray-900">{selectedMateria.precio_unitario}€</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor Total Stock</p>
                  <p className="font-medium text-gray-900">
                    {(selectedMateria.stock_actual * selectedMateria.precio_unitario).toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Proveedor</p>
                  <p className="font-medium text-gray-900">{selectedMateria.proveedor || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado de Stock</p>
                  {selectedMateria.alerta_stock ? (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      🔴 Stock Bajo
                    </span>
                  ) : (
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ Stock OK
                    </span>
                  )}
                </div>
                {selectedMateria.descripcion && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="font-medium text-gray-900">{selectedMateria.descripcion}</p>
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