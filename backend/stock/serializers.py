from rest_framework import serializers
from .models import Producto, MateriaPrima, Familia, ModeloProducto


# ========================================
# SERIALIZERS PARA CODIFICACIÓN
# ========================================

class FamiliaSerializer(serializers.ModelSerializer):
    """Serializer para las familias de materiales"""
    class Meta:
        model = Familia
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'activo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class ModeloProductoSerializer(serializers.ModelSerializer):
    """Serializer para los modelos de productos"""
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    
    class Meta:
        model = ModeloProducto
        fields = [
            'id',
            'codigo',
            'nombre',
            'tipo',
            'tipo_display',
            'descripcion',
            'activo',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ========================================
# SERIALIZERS DE STOCK
# ========================================

class MateriaPrimaSerializer(serializers.ModelSerializer):
    """Serializer para materias primas con relaciones"""
    familia_nombre = serializers.CharField(source='familia.nombre', read_only=True)
    modelo_nombre = serializers.CharField(source='modelo.nombre', read_only=True)
    unidad_medida_display = serializers.CharField(source='get_unidad_medida_display', read_only=True)
    alerta_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = MateriaPrima
        fields = [
            'id',
            'familia',
            'familia_nombre',
            'modelo',
            'modelo_nombre',
            'codigo',
            'nombre',
            'descripcion',
            'unidad_medida',
            'unidad_medida_display',
            'stock_actual',
            'stock_minimo',
            'precio_unitario',
            'proveedor',
            'activo',
            'alerta_stock',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'codigo',
            'created_at',
            'updated_at',
            'alerta_stock',
        ]
    
    def get_alerta_stock(self, obj):
        """Retorna True si el stock está bajo"""
        return obj.alerta_stock
    
    def validate(self, data):
        """Validaciones adicionales"""
        # Si no hay código, necesitamos familia y modelo
        if not self.instance and not data.get('codigo'):
            if not data.get('familia') or not data.get('modelo'):
                raise serializers.ValidationError(
                    "Se requieren Familia y Modelo para generar el código automáticamente"
                )
        return data


class ProductoSerializer(serializers.ModelSerializer):
    """Serializer para productos finales con relaciones"""
    modelo_nombre = serializers.CharField(source='modelo.nombre', read_only=True)
    alerta_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id',
            'modelo',
            'modelo_nombre',
            'codigo',
            'nombre',
            'descripcion',
            'stock_actual',
            'stock_minimo',
            'precio_venta',
            'tiempo_fabricacion',
            'activo',
            'alerta_stock',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'codigo',
            'created_at',
            'updated_at',
            'alerta_stock',
        ]
    
    def get_alerta_stock(self, obj):
        """Retorna True si el stock está bajo"""
        return obj.alerta_stock
    
    def validate(self, data):
        """Validaciones adicionales"""
        # Si no hay código, necesitamos modelo
        if not self.instance and not data.get('codigo'):
            if not data.get('modelo'):
                raise serializers.ValidationError(
                    "Se requiere un Modelo para generar el código automáticamente"
                )
        return data


# ========================================
# SERIALIZERS ADICIONALES (Simplificados)
# ========================================

class MateriaPrimaMinimalSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar materias primas"""
    familia_codigo = serializers.CharField(source='familia.codigo', read_only=True)
    modelo_codigo = serializers.CharField(source='modelo.codigo', read_only=True)
    
    class Meta:
        model = MateriaPrima
        fields = [
            'id',
            'codigo',
            'nombre',
            'familia_codigo',
            'modelo_codigo',
            'stock_actual',
            'stock_minimo',
            'unidad_medida',
        ]


class ProductoMinimalSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar productos"""
    modelo_codigo = serializers.CharField(source='modelo.codigo', read_only=True)
    
    class Meta:
        model = Producto
        fields = [
            'id',
            'codigo',
            'nombre',
            'modelo_codigo',
            'stock_actual',
            'stock_minimo',
            'precio_venta',
        ]