from django.db import models

class Cliente(models.Model):
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    contacto = models.CharField(max_length=200, verbose_name="Persona de contacto")
    email = models.EmailField(verbose_name="Email")
    telefono = models.CharField(max_length=15, verbose_name="Teléfono")
    direccion = models.TextField(blank=True, verbose_name="Dirección")
    nif_cif = models.CharField(max_length=20, unique=True, verbose_name="NIF/CIF")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    activo = models.BooleanField(default=True, verbose_name="Activo")
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre
    