"""
URL configuration for djangoCCTV project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from webcam.views import index, stream_1, stream_2, camera_1, camera_2, CameraViewSet, DetectionViewSet

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'cameras', CameraViewSet)
router.register(r'detections', DetectionViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('index/', index),
    path('stream_1/', stream_1, name="stream_1"),
    path('stream_2/', stream_2, name="stream_2"),
    path('index/camera1/', camera_1),
    path('index/camera2/', camera_2)
]
