from django.contrib import admin
from .models import Cliente

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'nif_cif', 'email', 'telefono', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'fecha_creacion')
    search_fields = ('nombre', 'nif_cif', 'email', 'contacto')
    ordering = ('nombre',)
    list_per_page = 20