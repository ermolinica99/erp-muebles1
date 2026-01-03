from django.db import models

# ========================================
# MODELOS PARA CODIFICACIÓN DE PRODUCTOS
# ========================================

class Familia(models.Model):
    """Familias de materiales para materias primas"""
    codigo = models.CharField(max_length=2, unique=True)  # "01", "02", "03"
    nombre = models.CharField(max_length=100)  # "Madera", "Consumibles"
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'familias'
        verbose_name = 'Familia'
        verbose_name_plural = 'Familias'
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class ModeloProducto(models.Model):
    """Modelos/Líneas de productos"""
    TIPO_CHOICES = [
        ('MATERIA', 'Materia Prima'),
        ('PRODUCTO', 'Producto Final'),
    ]
    
    codigo = models.CharField(max_length=10, unique=True)  # "MARTINA", "M01"
    nombre = models.CharField(max_length=100)  # "Martina", "María"
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)  # Para qué se usa
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'modelos_producto'
        verbose_name = 'Modelo de Producto'
        verbose_name_plural = 'Modelos de Producto'
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ========================================
# MODELOS DE STOCK MODIFICADOS
# ========================================

class MateriaPrima(models.Model):
    """Modelo para gestionar materias primas con codificación automática"""
    familia = models.ForeignKey(Familia, on_delete=models.PROTECT, verbose_name="Familia", null=True, blank=True)
    modelo = models.ForeignKey(ModeloProducto, on_delete=models.PROTECT, verbose_name="Modelo", 
                              limit_choices_to={'tipo': 'MATERIA'}, null=True, blank=True)
    
    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código automático")
    nombre = models.CharField(max_length=200, verbose_name="Nombre/Descripción")
    descripcion = models.TextField(blank=True, verbose_name="Descripción detallada")
    
    unidad_medida = models.CharField(
        max_length=20,
        choices=[
            ('KG', 'Kilogramos'),
            ('M', 'Metros'),
            ('M2', 'Metros cuadrados'),
            ('M3', 'Metros cúbicos'),
            ('L', 'Litros'),
            ('UN', 'Unidades'),
        ],
        default='KG',
        verbose_name="Unidad de medida"
    )
    
    stock_actual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name="Stock actual"
    )
    stock_minimo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Stock mínimo"
    )
    precio_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Precio unitario"
    )
    proveedor = models.CharField(max_length=200, blank=True, verbose_name="Proveedor")
    
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'materias_primas'
        verbose_name = 'Materia Prima'
        verbose_name_plural = 'Materias Primas'
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    @property
    def alerta_stock(self):
        """Indica si el stock está por debajo del mínimo"""
        return self.stock_actual <= self.stock_minimo
    
    def save(self, *args, **kwargs):
        """Generar código automáticamente si no existe"""
        if not self.codigo and self.familia and self.modelo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)
    
    def _generar_codigo(self):
        """Genera código en formato: 01-MARTINA-001"""
        familia_code = self.familia.codigo
        modelo_code = self.modelo.codigo
        
        # Buscar el último secuencial para esta familia y modelo
        ultimo = MateriaPrima.objects.filter(
            familia=self.familia,
            modelo=self.modelo
        ).order_by('-codigo').first()
        
        if ultimo:
            # Extraer el número al final: "01-MARTINA-001" -> 001
            partes = ultimo.codigo.split('-')
            numero = int(partes[-1]) + 1
        else:
            numero = 1
        
        # Formatear: 01-MARTINA-001
        return f"{familia_code}-{modelo_code}-{numero:03d}"


class Producto(models.Model):
    """Modelo para gestionar productos finales con codificación automática"""
    modelo = models.ForeignKey(ModeloProducto, on_delete=models.PROTECT, verbose_name="Modelo",
                              limit_choices_to={'tipo': 'PRODUCTO'}, null=True, blank=True)
    
    codigo = models.CharField(max_length=50, unique=True, verbose_name="Código automático")
    nombre = models.CharField(max_length=200, verbose_name="Nombre/Descripción")
    descripcion = models.TextField(blank=True, verbose_name="Descripción detallada")
    
    stock_actual = models.IntegerField(default=0, verbose_name="Stock actual")
    stock_minimo = models.IntegerField(verbose_name="Stock mínimo")
    
    precio_venta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Precio de venta"
    )
    
    tiempo_fabricacion = models.IntegerField(
        default=0,
        help_text="Tiempo en horas",
        verbose_name="Tiempo de fabricación"
    )
    
    activo = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    @property
    def alerta_stock(self):
        """Indica si el stock está por debajo del mínimo"""
        return self.stock_actual <= self.stock_minimo
    
    def save(self, *args, **kwargs):
        """Generar código automáticamente si no existe"""
        if not self.codigo and self.modelo:
            self.codigo = self._generar_codigo()
        super().save(*args, **kwargs)
    
    def _generar_codigo(self):
        """Genera código en formato: MARTINA-001"""
        modelo_code = self.modelo.codigo
        
        # Buscar el último secuencial para este modelo
        ultimo = Producto.objects.filter(
            modelo=self.modelo
        ).order_by('-codigo').first()
        
        if ultimo:
            # Extraer el número al final: "MARTINA-001" -> 001
            partes = ultimo.codigo.split('-')
            numero = int(partes[-1]) + 1
        else:
            numero = 1
        
        # Formatear: MARTINA-001
        return f"{modelo_code}-{numero:03d}"