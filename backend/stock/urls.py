from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MateriaPrimaViewSet,
    ProductoViewSet,
    FamiliaViewSet,
    ModeloProductoViewSet,
)

app_name = 'stock'

# Crear router para los ViewSets
router = DefaultRouter()

# Registrar los routers
router.register(r'familias', FamiliaViewSet, basename='familia')
router.register(r'modelos', ModeloProductoViewSet, basename='modelo')
router.register(r'materias-primas', MateriaPrimaViewSet, basename='materia-prima')
router.register(r'productos', ProductoViewSet, basename='producto')

# Las URLs se incluyen automáticamente con el router
urlpatterns = [
    path('', include(router.urls)),
]

"""
ENDPOINTS DISPONIBLES:

1. FAMILIAS:
   GET    /api/stock/familias/                 - Listar todas
   POST   /api/stock/familias/                 - Crear
   GET    /api/stock/familias/{id}/            - Detalles
   PUT    /api/stock/familias/{id}/            - Actualizar
   DELETE /api/stock/familias/{id}/            - Eliminar
   GET    /api/stock/familias/activas/list/    - Solo activas

2. MODELOS DE PRODUCTOS:
   GET    /api/stock/modelos/                     - Listar todas
   POST   /api/stock/modelos/                     - Crear
   GET    /api/stock/modelos/{id}/                - Detalles
   PUT    /api/stock/modelos/{id}/                - Actualizar
   DELETE /api/stock/modelos/{id}/                - Eliminar
   GET    /api/stock/modelos/por_tipo/list/       - Agrupados por tipo
   GET    /api/stock/modelos/activos/list/        - Solo activos

3. MATERIAS PRIMAS:
   GET    /api/stock/materias-primas/                    - Listar todas
   POST   /api/stock/materias-primas/                    - Crear
   GET    /api/stock/materias-primas/{id}/               - Detalles
   PUT    /api/stock/materias-primas/{id}/               - Actualizar
   DELETE /api/stock/materias-primas/{id}/               - Eliminar
   GET    /api/stock/materias-primas/alerta_stock/list/  - Con alerta
   GET    /api/stock/materias-primas/por_familia/list/   - Por familia
   GET    /api/stock/materias-primas/por_modelo/list/    - Por modelo
   POST   /api/stock/materias-primas/actualizar_stock/   - Actualizar stock múltiple

4. PRODUCTOS:
   GET    /api/stock/productos/                     - Listar todas
   POST   /api/stock/productos/                     - Crear
   GET    /api/stock/productos/{id}/                - Detalles
   PUT    /api/stock/productos/{id}/                - Actualizar
   DELETE /api/stock/productos/{id}/                - Eliminar
   GET    /api/stock/productos/alerta_stock/list/   - Con alerta
   GET    /api/stock/productos/por_modelo/list/     - Por modelo
   POST   /api/stock/productos/actualizar_stock/    - Actualizar stock múltiple

FILTROS Y BÚSQUEDA:

Búsqueda por texto:
   GET /api/stock/materias-primas/?search=MARTINA
   GET /api/stock/productos/?search=silla

Filtros:
   GET /api/stock/familias/?activo=true
   GET /api/stock/modelos/?tipo=MATERIA&activo=true
   GET /api/stock/materias-primas/?familia=1&activo=true
   GET /api/stock/productos/?modelo=1&activo=true

Ordenamiento:
   GET /api/stock/materias-primas/?ordering=codigo
   GET /api/stock/productos/?ordering=-precio_venta  (descendente)

EJEMPLOS DE USO:

1. Crear familia:
   POST /api/stock/familias/
   {
     "codigo": "01",
     "nombre": "Madera",
     "descripcion": "Maderas y tableros",
     "activo": true
   }

2. Crear modelo de materia prima:
   POST /api/stock/modelos/
   {
     "codigo": "MARTINA",
     "nombre": "Martina",
     "tipo": "MATERIA",
     "descripcion": "Modelo Martina",
     "activo": true
   }

3. Crear materia prima (genera código automático):
   POST /api/stock/materias-primas/
   {
     "familia": 1,
     "modelo": 1,
     "nombre": "Tela Gris",
     "unidad_medida": "M",
     "stock_minimo": 10,
     "precio_unitario": 5.50,
     "proveedor": "Proveedor XYZ"
   }
   Resultado: código "01-MARTINA-001"

4. Crear producto (genera código automático):
   POST /api/stock/productos/
   {
     "modelo": 2,
     "nombre": "SILLA-GRIS",
     "stock_minimo": 5,
     "precio_venta": 150.00,
     "tiempo_fabricacion": 8
   }
   Resultado: código "MARTINA-001"

5. Actualizar stock de múltiples items:
   POST /api/stock/materias-primas/actualizar_stock/
   [
     {"id": 1, "cantidad": 50},
     {"id": 2, "cantidad": -10}
   ]
"""