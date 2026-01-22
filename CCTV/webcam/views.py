from django.shortcuts import render
from django.http import HttpResponse
from django.template import RequestContext, loader
from django.http.response import StreamingHttpResponse
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import JSONParser
from ultralytics import YOLO, solutions
from PIL import Image
import cv2
import numpy as np
import datetime
import time
import json
import os  # For env vars if you add later

from .models import Camera, Detection
from .serializers import CameraSerializer, DetectionSerializer

# ――――――――――――――――――――――――――――――――――――――――――――
# REST API VIEWSETS
# ――――――――――――――――――――――――――――――――――――――――――――

class CameraViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing cameras
    """
    queryset = Camera.objects.all()
    serializer_class = CameraSerializer
    
    @action(detail=False, methods=['get'])
    def active_cameras(self, request):
        """Get all active cameras"""
        cameras = Camera.objects.filter(is_active=True)
        serializer = self.get_serializer(cameras, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stream(self, request, pk=None):
        """Get live stream for specific camera"""
        camera = self.get_object()
        return StreamingHttpResponse(
            liveStream(camera.camera_index),
            content_type='multipart/x-mixed-replace; boundary=frame'
        )

class DetectionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for viewing detections
    """
    queryset = Detection.objects.all()
    serializer_class = DetectionSerializer
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent detections"""
        limit = request.query_params.get('limit', 10)
        detections = Detection.objects.all()[:int(limit)]
        serializer = self.get_serializer(detections, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_camera(self, request):
        """Get detections by camera"""
        camera_id = request.query_params.get('camera_id')
        if camera_id:
            detections = Detection.objects.filter(camera_id=camera_id)
            serializer = self.get_serializer(detections, many=True)
            return Response(serializer.data)
        return Response({'error': 'camera_id required'}, status=status.HTTP_400_BAD_REQUEST)

# ――――――――――――――――――――――――――――――――――――――――――――
# LEGACY VIEWS
# ――――――――――――――――――――――――――――――――――――――――――――

# HOME PAGE # ――――――――――――――――――――――――――――――――――――――――――――
def index(request):
	template = loader.get_template('index.html')
	return HttpResponse(template.render({}, request))
# ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
# CAMERA 1 PAGE 
def camera_1(request):
	template = loader.get_template('camera1.html')
	return HttpResponse(template.render({}, request))
# ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
# CAMERA 2 PAGE ――――――――――――――――――――――――――――――――――――――――――
def camera_2(request):
	template = loader.get_template('camera2.html')
	return HttpResponse(template.render({}, request))
# ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
# LIVE STREAM # ―――――――――――――――――――――――――――――――――――――
def liveStream(camId):  
    cap = cv2.VideoCapture(camId)
    if not cap.isOpened():
        raise ValueError("Error opening camera")
    
    # Video writer
    w, h, fps = (int(cap.get(x)) for x in (cv2.CAP_PROP_FRAME_WIDTH, cv2.CAP_PROP_FRAME_HEIGHT, cv2.CAP_PROP_FPS))
    video_writer = cv2.VideoWriter("security_output.avi", cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    # Emails - better to use os.environ later
    from_email = "asyhj1yn@gmail.com"
    password = "slyk mipp luzi ktya"
    to_email = "xventure05@gmail.com"

    # SecurityAlarm
    securityalarm = solutions.SecurityAlarm(
        show=False,
        model="best.pt",
        records=1,
    )
    securityalarm.authenticate(from_email, password, to_email)

    # Get Camera
    try:
        camera = Camera.objects.get(camera_index=camId)
    except Camera.DoesNotExist:
        raise ValueError(f"Camera with index {camId} not found. Add it first.")

    while cap.isOpened():
        success, im0 = cap.read()
        if not success:
            break
        
        # Run detection
        results = securityalarm(im0)  # This is SolutionResults
        
        # Get annotated frame
        annotated_frame = results.plot_im if hasattr(results, 'plot_im') else im0  # Fallback if no plot_im
        
        # Save to video
        video_writer.write(annotated_frame)
        
        # Save detections if any
        if securityalarm.confs:  # Check if there are confidences (means detections)
            for i in range(len(securityalarm.clss)):
                cls_id = securityalarm.clss[i]
                cls_name = securityalarm.names[cls_id]
                conf = securityalarm.confs[i]
                
                # Only process fire and smoke classes
                if cls_name == 'fire':
                    det_type = 'fire'
                elif cls_name == 'smoke':
                    det_type = 'smoke'
                else:
                    continue  # Skip non-fire/smoke detections
                
                # Save to model
                Detection.objects.create(
                    camera=camera,
                    detection_type=det_type,
                    confidence=conf
                )
        
        # Stream frame
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    cap.release()
    video_writer.release()
    cv2.destroyAllWindows()
# ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
# DISPLAY CAMERA 1 # ――――――――――――――――――――――――――――――――――――――
def stream_1(request):
	return StreamingHttpResponse(liveStream(0), content_type='multipart/x-mixed-replace; boundary=frame')
# ――――――――――――――――――――――――――――――――――――――――――――――――――――――――
# DISPLAY CAMERA 2 # ――――――――――――――――――――――――――――――――――――――
def stream_2(request):
	return StreamingHttpResponse(liveStream(2), content_type='multipart/x-mixed-replace; boundary=frame')
# ――――――――――――――――――――――――――――――――――――――――――――――――――――――――




