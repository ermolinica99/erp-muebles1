from django.contrib import admin
from .models import Familia, ModeloProducto, MateriaPrima, Producto


# ========================================
# ADMIN PARA CODIFICACIÓN
# ========================================

@admin.register(Familia)
class FamiliaAdmin(admin.ModelAdmin):
    """Admin para gestionar familias de materiales"""
    list_display = ('codigo', 'nombre', 'activo')
    list_filter = ('activo',)
    search_fields = ('codigo', 'nombre')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'descripcion')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )


@admin.register(ModeloProducto)
class ModeloProductoAdmin(admin.ModelAdmin):
    """Admin para gestionar modelos de productos"""
    list_display = ('codigo', 'nombre', 'tipo', 'activo')
    list_filter = ('tipo', 'activo')
    search_fields = ('codigo', 'nombre')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('codigo', 'nombre', 'tipo', 'descripcion')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )


# ========================================
# ADMIN PARA STOCK
# ========================================

@admin.register(MateriaPrima)
class MateriaPrimaAdmin(admin.ModelAdmin):
    """Admin para gestionar materias primas"""
    list_display = (
        'codigo',
        'nombre',
        'familia',
        'modelo',
        'stock_actual',
        'stock_minimo',
        'alerta_icon',
        'activo'
    )
    list_filter = (
        'familia',
        'modelo',
        'unidad_medida',
        'activo'
    )
    search_fields = ('codigo', 'nombre', 'proveedor')
    readonly_fields = ('codigo', 'alerta_stock_display')
    
    fieldsets = (
        ('Codificación', {
            'fields': ('codigo', 'familia', 'modelo')
        }),
        ('Información Básica', {
            'fields': ('nombre', 'descripcion')
        }),
        ('Stock', {
            'fields': (
                'stock_actual',
                'stock_minimo',
                'alerta_stock_display',
                'unidad_medida'
            ),
            'classes': ('wide',)
        }),
        ('Compras', {
            'fields': ('precio_unitario', 'proveedor')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )
    
    def alerta_icon(self, obj):
        """Muestra un ícono si hay alerta de stock bajo"""
        if obj.alerta_stock:
            return '⚠️ ALERTA'
        return '✓'
    alerta_icon.short_description = 'Alerta'
    
    def alerta_stock_display(self, obj):
        """Muestra si hay alerta de stock"""
        if obj.alerta_stock:
            return f'⚠️ ALERTA: Stock bajo ({obj.stock_actual} < {obj.stock_minimo})'
        return f'✓ Ok: Stock suficiente ({obj.stock_actual} >= {obj.stock_minimo})'
    alerta_stock_display.short_description = 'Estado de Stock'
    alerta_stock_display.allow_tags = True
    
    def save_model(self, request, obj, form, change):
        """Guardar y generar código si es necesario"""
        if not obj.codigo and obj.familia and obj.modelo:
            obj.save()  # Esto activará el save() del modelo que genera el código
        else:
            super().save_model(request, obj, form, change)


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    """Admin para gestionar productos finales"""
    list_display = (
        'codigo',
        'nombre',
        'modelo',
        'stock_actual',
        'stock_minimo',
        'alerta_icon',
        'precio_venta',
        'tiempo_fabricacion',
        'activo'
    )
    list_filter = (
        'modelo',
        'activo'
    )
    search_fields = ('codigo', 'nombre')
    readonly_fields = ('codigo', 'alerta_stock_display')
    
    fieldsets = (
        ('Codificación', {
            'fields': ('codigo', 'modelo')
        }),
        ('Información Básica', {
            'fields': ('nombre', 'descripcion')
        }),
        ('Stock', {
            'fields': (
                'stock_actual',
                'stock_minimo',
                'alerta_stock_display'
            ),
            'classes': ('wide',)
        }),
        ('Precios y Producción', {
            'fields': ('precio_venta', 'tiempo_fabricacion')
        }),
        ('Estado', {
            'fields': ('activo',)
        }),
    )
    
    def alerta_icon(self, obj):
        """Muestra un ícono si hay alerta de stock bajo"""
        if obj.alerta_stock:
            return '⚠️ ALERTA'
        return '✓'
    alerta_icon.short_description = 'Alerta'
    
    def alerta_stock_display(self, obj):
        """Muestra si hay alerta de stock"""
        if obj.alerta_stock:
            return f'⚠️ ALERTA: Stock bajo ({obj.stock_actual} < {obj.stock_minimo})'
        return f'✓ Ok: Stock suficiente ({obj.stock_actual} >= {obj.stock_minimo})'
    alerta_stock_display.short_description = 'Estado de Stock'
    alerta_stock_display.allow_tags = True
    
    def save_model(self, request, obj, form, change):
        """Guardar y generar código si es necesario"""
        if not obj.codigo and obj.modelo:
            obj.save()  # Esto activará el save() del modelo que genera el código
        else:
            super().save_model(request, obj, form, change)