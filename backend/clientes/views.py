from rest_framework.permissions import AllowAny
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Cliente
from .serializers import ClienteSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    permission_classes = [AllowAny]  # Cambia IsAuthenticated por AllowAny
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'nif_cif', 'email']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']