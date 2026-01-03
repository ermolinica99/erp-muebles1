from rest_framework.permissions import AllowAny
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pedido, LineaPedido
from .serializers import PedidoListSerializer, PedidoDetailSerializer, LineaPedidoSerializer

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_pedido', 'cliente__nombre']
    ordering_fields = ['fecha_pedido', 'fecha_entrega_estimada', 'estado']
    ordering = ['-fecha_pedido']
    
    def get_serializer_class(self):
        """Use different serializers for list and detail views"""
        if self.action == 'retrieve':
            return PedidoDetailSerializer
        return PedidoListSerializer
    
    @action(detail=False, methods=['get'])
    def por_estado(self, request):
        """Obtener pedidos filtrados por estado"""
        estado = request.query_params.get('estado', None)
        if estado:
            pedidos = self.get_queryset().filter(estado=estado)
            serializer = self.get_serializer(pedidos, many=True)
            return Response(serializer.data)
        return Response({'error': 'Parámetro estado requerido'}, status=400)

class LineaPedidoViewSet(viewsets.ModelViewSet):
    queryset = LineaPedido.objects.all()
    serializer_class = LineaPedidoSerializer
    permission_classes = [IsAuthenticated]