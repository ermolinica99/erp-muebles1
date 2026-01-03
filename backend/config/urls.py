from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # ← Asegúrate de tener esta línea
    
    # API Endpoints
    path('api/', include('clientes.urls')),
    path('api/', include('stock.urls')),
    path('api/', include('pedidos.urls')),
]