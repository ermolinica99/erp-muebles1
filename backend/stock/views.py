from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from .models import Producto, MateriaPrima, Familia, ModeloProducto
from .serializers import (
    ProductoSerializer,
    MateriaPrimaSerializer,
    FamiliaSerializer,
    ModeloProductoSerializer,
    ProductoMinimalSerializer,
    MateriaPrimaMinimalSerializer,
)


# ========================================
# VIEWSETS PARA CODIFICACIÓN
# ========================================

class FamiliaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar familias de materiales
    
    Endpoints:
    - GET /api/familias/ - Listar todas las familias
    - POST /api/familias/ - Crear nueva familia
    - GET /api/familias/{id}/ - Obtener detalles
    - PUT /api/familias/{id}/ - Actualizar familia
    - DELETE /api/familias/{id}/ - Eliminar familia
    - GET /api/familias/activas/list/ - Solo familias activas
    """
    queryset = Familia.objects.all()
    serializer_class = FamiliaSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'created_at']
    ordering = ['codigo']
    filterset_fields = ['activo']
    
    def get_queryset(self):
        """Filtrar solo familias activas por defecto si se especifica"""
        queryset = Familia.objects.all()
        activo = self.request.query_params.get('activo', None)
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        
        return queryset.order_by('codigo')
    
    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Retorna solo familias activas"""
        familias = Familia.objects.filter(activo=True).order_by('codigo')
        serializer = FamiliaSerializer(familias, many=True)
        return Response(serializer.data)


class ModeloProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar modelos de productos
    
    Endpoints:
    - GET /api/modelos/ - Listar todos los modelos
    - POST /api/modelos/ - Crear nuevo modelo
    - GET /api/modelos/{id}/ - Obtener detalles
    - PUT /api/modelos/{id}/ - Actualizar modelo
    - DELETE /api/modelos/{id}/ - Eliminar modelo
    - GET /api/modelos/por_tipo/list/ - Modelos agrupados por tipo
    - GET /api/modelos/activos/list/ - Solo modelos activos
    """
    queryset = ModeloProducto.objects.all()
    serializer_class = ModeloProductoSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['codigo', 'nombre']
    ordering_fields = ['codigo', 'nombre', 'tipo', 'created_at']
    ordering = ['codigo']
    filterset_fields = ['tipo', 'activo']
    
    def get_queryset(self):
        """Filtrar por tipo y activo si se especifica"""
        queryset = ModeloProducto.objects.all()
        tipo = self.request.query_params.get('tipo', None)
        activo = self.request.query_params.get('activo', None)
        
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        
        return queryset.order_by('codigo')
    
    @action(detail=False, methods=['get'])
    def por_tipo(self, request):
        """Retorna modelos agrupados por tipo"""
        materias = ModeloProducto.objects.filter(tipo='MATERIA', activo=True)
        productos = ModeloProducto.objects.filter(tipo='PRODUCTO', activo=True)
        
        return Response({
            'materias': ModeloProductoSerializer(materias, many=True).data,
            'productos': ModeloProductoSerializer(productos, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def activos(self, request):
        """Retorna solo modelos activos"""
        modelos = ModeloProducto.objects.filter(activo=True).order_by('codigo')
        serializer = ModeloProductoSerializer(modelos, many=True)
        return Response(serializer.data)


# ========================================
# VIEWSETS DE STOCK
# ========================================

class MateriaPrimaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar materias primas
    
    Endpoints:
    - GET /api/materias-primas/ - Listar todas
    - POST /api/materias-primas/ - Crear nueva
    - GET /api/materias-primas/{id}/ - Obtener detalles
    - PUT /api/materias-primas/{id}/ - Actualizar
    - DELETE /api/materias-primas/{id}/ - Eliminar
    - GET /api/materias-primas/alerta-stock/list/ - Solo con alerta
    - GET /api/materias-primas/por-familia/list/ - Agrupadas por familia
    - GET /api/materias-primas/por-modelo/list/ - Agrupadas por modelo
    """
    queryset = MateriaPrima.objects.all()
    serializer_class = MateriaPrimaSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['codigo', 'nombre', 'familia__nombre', 'modelo__nombre']
    ordering_fields = ['codigo', 'nombre', 'stock_actual', 'created_at']
    ordering = ['codigo']
    filterset_fields = ['familia', 'modelo', 'activo']
    
    def get_queryset(self):
        """Filtrar materias primas con opciones avanzadas"""
        queryset = MateriaPrima.objects.select_related('familia', 'modelo')
        
        # Filtro por activo
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        
        # Filtro por alerta de stock
        alerta = self.request.query_params.get('alerta', None)
        if alerta is not None and alerta.lower() == 'true':
            queryset = queryset.filter(stock_actual__lte=models.F('stock_minimo'))
        
        return queryset.order_by('codigo')
    
    @action(detail=False, methods=['get'])
    def alerta_stock(self, request):
        """Retorna solo materias primas con stock bajo"""
        materias = MateriaPrima.objects.filter(
            stock_actual__lte=models.F('stock_minimo'),
            activo=True
        ).order_by('codigo')
        serializer = MateriaPrimaSerializer(materias, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_familia(self, request):
        """Retorna materias primas agrupadas por familia"""
        familia_id = request.query_params.get('familia_id', None)
        
        if familia_id:
            materias = MateriaPrima.objects.filter(
                familia_id=familia_id,
                activo=True
            ).order_by('codigo')
            serializer = MateriaPrimaSerializer(materias, many=True)
            return Response(serializer.data)
        
        familias = Familia.objects.filter(activo=True)
        data = {}
        
        for familia in familias:
            materias = MateriaPrima.objects.filter(
                familia=familia,
                activo=True
            ).order_by('codigo')
            data[familia.nombre] = MateriaPrimaSerializer(materias, many=True).data
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def por_modelo(self, request):
        """Retorna materias primas agrupadas por modelo"""
        modelo_id = request.query_params.get('modelo_id', None)
        
        if modelo_id:
            materias = MateriaPrima.objects.filter(
                modelo_id=modelo_id,
                activo=True
            ).order_by('codigo')
            serializer = MateriaPrimaSerializer(materias, many=True)
            return Response(serializer.data)
        
        modelos = ModeloProducto.objects.filter(tipo='MATERIA', activo=True)
        data = {}
        
        for modelo in modelos:
            materias = MateriaPrima.objects.filter(
                modelo=modelo,
                activo=True
            ).order_by('codigo')
            data[modelo.nombre] = MateriaPrimaSerializer(materias, many=True).data
        
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def actualizar_stock(self, request):
        """Endpoint para actualizar stock de múltiples materias primas"""
        datos = request.data  # Debe ser lista: [{"id": 1, "cantidad": 10}, ...]
        
        if not isinstance(datos, list):
            return Response(
                {"error": "Debe enviar una lista"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        actualizadas = []
        for item in datos:
            try:
                materia = MateriaPrima.objects.get(id=item['id'])
                materia.stock_actual += item.get('cantidad', 0)
                materia.save()
                actualizadas.append({
                    'id': materia.id,
                    'codigo': materia.codigo,
                    'stock_actual': str(materia.stock_actual)
                })
            except MateriaPrima.DoesNotExist:
                pass
        
        return Response({
            'actualizadas': actualizadas,
            'cantidad': len(actualizadas)
        })


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar productos finales
    
    Endpoints:
    - GET /api/productos/ - Listar todos
    - POST /api/productos/ - Crear nuevo
    - GET /api/productos/{id}/ - Obtener detalles
    - PUT /api/productos/{id}/ - Actualizar
    - DELETE /api/productos/{id}/ - Eliminar
    - GET /api/productos/alerta-stock/list/ - Solo con alerta
    - GET /api/productos/por-modelo/list/ - Agrupados por modelo
    """
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['codigo', 'nombre', 'modelo__nombre']
    ordering_fields = ['codigo', 'nombre', 'stock_actual', 'precio_venta', 'created_at']
    ordering = ['codigo']
    filterset_fields = ['modelo', 'activo']
    
    def get_queryset(self):
        """Filtrar productos con opciones avanzadas"""
        queryset = Producto.objects.select_related('modelo')
        
        # Filtro por activo
        activo = self.request.query_params.get('activo', None)
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        
        # Filtro por alerta de stock
        alerta = self.request.query_params.get('alerta', None)
        if alerta is not None and alerta.lower() == 'true':
            queryset = queryset.filter(stock_actual__lte=models.F('stock_minimo'))
        
        return queryset.order_by('codigo')
    
    @action(detail=False, methods=['get'])
    def alerta_stock(self, request):
        """Retorna solo productos con stock bajo"""
        productos = Producto.objects.filter(
            stock_actual__lte=models.F('stock_minimo'),
            activo=True
        ).order_by('codigo')
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_modelo(self, request):
        """Retorna productos agrupados por modelo"""
        modelo_id = request.query_params.get('modelo_id', None)
        
        if modelo_id:
            productos = Producto.objects.filter(
                modelo_id=modelo_id,
                activo=True
            ).order_by('codigo')
            serializer = ProductoSerializer(productos, many=True)
            return Response(serializer.data)
        
        modelos = ModeloProducto.objects.filter(tipo='PRODUCTO', activo=True)
        data = {}
        
        for modelo in modelos:
            productos = Producto.objects.filter(
                modelo=modelo,
                activo=True
            ).order_by('codigo')
            data[modelo.nombre] = ProductoSerializer(productos, many=True).data
        
        return Response(data)
    
    @action(detail=False, methods=['post'])
    def actualizar_stock(self, request):
        """Endpoint para actualizar stock de múltiples productos"""
        datos = request.data  # Debe ser lista: [{"id": 1, "cantidad": 10}, ...]
        
        if not isinstance(datos, list):
            return Response(
                {"error": "Debe enviar una lista"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        actualizados = []
        for item in datos:
            try:
                producto = Producto.objects.get(id=item['id'])
                producto.stock_actual += item.get('cantidad', 0)
                producto.save()
                actualizados.append({
                    'id': producto.id,
                    'codigo': producto.codigo,
                    'stock_actual': producto.stock_actual
                })
            except Producto.DoesNotExist:
                pass
        
        return Response({
            'actualizados': actualizados,
            'cantidad': len(actualizados)
        })