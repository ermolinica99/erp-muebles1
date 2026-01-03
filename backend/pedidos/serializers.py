from rest_framework import serializers
from .models import Pedido, LineaPedido
from clientes.serializers import ClienteSerializer
from stock.serializers import ProductoSerializer

class LineaPedidoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    
    class Meta:
        model = LineaPedido
        fields = ['id', 'producto', 'producto_nombre', 'producto_codigo', 'cantidad', 'precio_unitario', 'subtotal']
        read_only_fields = ('subtotal',)

class PedidoListSerializer(serializers.ModelSerializer):
    """Serializer para listar pedidos (sin detalles de líneas)"""
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    
    class Meta:
        model = Pedido
        fields = ['id', 'numero_pedido', 'cliente', 'cliente_nombre', 'fecha_pedido', 'fecha_entrega_estimada', 'estado', 'total']

class PedidoDetailSerializer(serializers.ModelSerializer):
    """Serializer para ver detalle de un pedido (con líneas)"""
    cliente_datos = ClienteSerializer(source='cliente', read_only=True)
    lineas = LineaPedidoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Pedido
        fields = '__all__'
        read_only_fields = ('total', 'fecha_pedido')