from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoViewSet, LineaPedidoViewSet

router = DefaultRouter()
router.register(r'pedidos', PedidoViewSet)
router.register(r'lineas-pedido', LineaPedidoViewSet)

urlpatterns = router.urls