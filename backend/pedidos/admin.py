from django.contrib import admin
from .models import Pedido, LineaPedido

class LineaPedidoInline(admin.TabularInline):
    """Permite editar las líneas de pedido dentro del pedido"""
    model = LineaPedido
    extra = 1
    fields = ('producto', 'cantidad', 'precio_unitario', 'subtotal')
    readonly_fields = ('subtotal',)

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('numero_pedido', 'cliente', 'fecha_pedido', 'fecha_entrega_estimada', 'estado', 'total')
    list_filter = ('estado', 'fecha_pedido', 'fecha_entrega_estimada')
    search_fields = ('numero_pedido', 'cliente__nombre')
    ordering = ('-fecha_pedido',)
    list_per_page = 20
    inlines = [LineaPedidoInline]
    readonly_fields = ('total',)
    
    fieldsets = (
        ('Información del Pedido', {
            'fields': ('numero_pedido', 'cliente', 'fecha_entrega_estimada', 'estado')
        }),
        ('Detalles', {
            'fields': ('observaciones', 'total')
        }),
    )

@admin.register(LineaPedido)
class LineaPedidoAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'producto', 'cantidad', 'precio_unitario', 'subtotal')
    list_filter = ('pedido__estado',)
    search_fields = ('pedido__numero_pedido', 'producto__nombre')