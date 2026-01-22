from django.db import models

# Create your models here.

class Camera(models.Model):
    """Model for managing camera sources"""
    name = models.CharField(max_length=100)
    camera_index = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Cameras"

class Detection(models.Model):
    """Model for storing detection events"""
    DETECTION_TYPES = [
        ('fire', 'Fire'),
        ('smoke', 'Smoke'),
        ('object', 'Object'),
        ('motion', 'Motion'),
    ]
    
    camera = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='detections')
    detection_type = models.CharField(max_length=20, choices=DETECTION_TYPES)
    confidence = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.detection_type} - {self.camera.name}"
    
    class Meta:
        ordering = ['-timestamp']
