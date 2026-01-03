import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    toast((t) => (
      <div>
        <p className="font-medium mb-2">¿Cerrar sesión?</p>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              navigate('/login');
              toast.success('Sesión cerrada exitosamente', { id: t.id });
            }}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
          >
            Sí, cerrar
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

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
    },
    {
      name: 'Clientes',
      path: '/clientes',
      icon: '👥',
    },
    {
      name: 'Pedidos',
      path: '/pedidos',
      icon: '📋',
    },
    {
      name: 'Productos',
      path: '/productos',
      icon: '📦',
    },
    {
      name: 'Materias Primas',
      path: '/materias-primas',
      icon: '🧱',
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold">
            M
          </div>
          <div>
            <h1 className="text-2xl font-bold">MOLPRO</h1>
            <p className="text-xs text-slate-400">2026</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 px-3 py-2 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold">A</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-slate-400">admin@molpro.com</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  );
}