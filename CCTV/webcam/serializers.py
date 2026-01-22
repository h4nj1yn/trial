from rest_framework import serializers
from .models import Camera, Detection

class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camera
        fields = ['id', 'name', 'is_active', 'camera_index', 'created_at']

class DetectionSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    
    class Meta:
        model = Detection
        fields = ['id', 'camera', 'camera_name', 'detection_type', 'confidence', 'timestamp']
