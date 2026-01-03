from django.db import models
from clientes.models import Cliente
from stock.models import Producto

class Pedido(models.Model):
    ESTADOS = [
        ('pendiente', 'Pendiente'),
        ('en_produccion', 'En Producción'),
        ('producido', 'Producido'),
        ('entregado', 'Entregado'),
        ('cancelado', 'Cancelado'),
    ]
    
    numero_pedido = models.CharField(max_length=20, unique=True, verbose_name="Número de pedido")
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, verbose_name="Cliente")
    fecha_pedido = models.DateField(auto_now_add=True, verbose_name="Fecha de pedido")
    fecha_entrega_estimada = models.DateField(verbose_name="Fecha de entrega estimada")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente', verbose_name="Estado")
    observaciones = models.TextField(blank=True, verbose_name="Observaciones")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Total")
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-fecha_pedido']
    
    def __str__(self):
        return f"Pedido {self.numero_pedido} - {self.cliente.nombre}"
    
    def calcular_total(self):
        """Calcula el total del pedido sumando las líneas"""
        total = sum(linea.subtotal for linea in self.lineas.all())
        self.total = total
        self.save()
        return total


class LineaPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='lineas', verbose_name="Pedido")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT, verbose_name="Producto")
    cantidad = models.IntegerField(verbose_name="Cantidad")
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio unitario")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Subtotal")
    
    class Meta:
        verbose_name = 'Línea de Pedido'
        verbose_name_plural = 'Líneas de Pedido'
    
    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad}"
    
    def save(self, *args, **kwargs):
        """Calcula el subtotal automáticamente"""
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)
        # Actualizar total del pedido
        self.pedido.calcular_total()