import { useEffect, useState } from 'react';
import { Camera, Home, Activity } from 'lucide-react';
import { cctvClient, type Camera as CameraType, type Detection } from '../api/cctvClient';
import './App.css';

type CameraView = 'home' | string;

export default function App() {
  const [cameras, setCameras] = useState<CameraType[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCamera, setActiveCamera] = useState<CameraView>('home');
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [camera1Time, setCamera1Time] = useState(new Date());
  const [camera2Time, setCamera2Time] = useState(new Date());

  // Fetch cameras and detections on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [camerasData, detectionsData] = await Promise.all([
          cctvClient.getActiveCameras(),
          cctvClient.getRecentDetections(20),
        ]);
        // Rename cameras
        const renamedCameras = camerasData.map((camera, index) => ({
          ...camera,
          name: index === 0 ? 'Kitchen' : index === 1 ? 'Garden' : camera.name,
        }));
        setCameras(renamedCameras);
        setDetections(detectionsData);
        if (camerasData.length > 0) {
          setSelectedCamera(camerasData[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh detections every 5 seconds
    const interval = setInterval(async () => {
      try {
        const detectionsData = await cctvClient.getRecentDetections(20);
        setDetections(detectionsData);
      } catch (err) {
        console.error('Error refreshing detections:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update camera timestamps every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCamera1Time(new Date());
      setCamera2Time(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format detection type for display
  const formatDetectionType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-gray-900">
        <div className="text-white text-2xl">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border-b border-red-800 px-6 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Header Navigation */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl text-white">Smoke Alarm System</h1>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500 animate-pulse" />
              <span className="text-sm text-gray-400">{loading ? 'Connecting...' : 'System Online'}</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 mt-4">
            <button
              onClick={() => setActiveCamera('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeCamera === 'home'
                  ? 'bg-gray-950 text-white border-t-2 border-blue-500'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setActiveCamera(`camera${camera.id}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeCamera === `camera${camera.id}`
                    ? 'bg-gray-950 text-white border-t-2 border-blue-500'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                {camera.name}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeCamera === 'home' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {cameras.length}
                </div>
                <div className="text-gray-400 text-sm">Active Cameras</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">
                  {detections.length}
                </div>
                <div className="text-gray-400 text-sm">Recent Detections</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {cameras.filter((c) => c.is_active).length}
                </div>
                <div className="text-gray-400 text-sm">Online</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {(
                    detections.reduce(
                      (acc, d) => acc + d.confidence,
                      0
                    ) / Math.max(detections.length, 1)
                  ).toFixed(1)}
                </div>
                <div className="text-gray-400 text-sm">Avg Confidence</div>
              </div>
            </div>

            {/* Cameras Grid */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-2xl font-bold mb-4">All Live</h2>
              {cameras.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No cameras configured
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cameras.map((camera) => (
                    <div
                      key={camera.id}
                      className={`border-2 rounded-lg overflow-hidden cursor-pointer transition ${
                        selectedCamera === camera.id
                          ? 'border-blue-500'
                          : 'border-gray-700'
                      }`}
                      onClick={() => setSelectedCamera(camera.id)}
                    >
                      <div className="bg-gray-700 p-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-white">{camera.name}</h3>
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                        <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-white font-mono mt-2 inline-block">
                          {camera.id === 1 ? camera1Time.toLocaleTimeString() : camera2Time.toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="bg-black aspect-video flex items-center justify-center">
                        <img
                          src={cctvClient.getLegacyStreamUrl('1')}
                          alt={camera.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detections */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-white text-2xl font-bold mb-4">Recent Detections</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {detections.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    No detections yet
                  </div>
                ) : (
                  detections.map((detection) => (
                    <div
                      key={detection.id}
                      className="bg-gray-700 rounded p-3 text-sm"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-blue-400">
                          {formatDetectionType(detection.detection_type)}
                        </span>
                        <span className="text-green-400 text-xs">
                          {formatConfidence(detection.confidence)}%
                        </span>
                      </div>
                      <div className="text-gray-300 text-xs mb-1">
                        {detection.camera_name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {new Date(detection.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeCamera !== 'home' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-6 pt-6">
              <h2 className="text-white text-2xl font-bold">
                {cameras.find((c) => `camera${c.id}` === activeCamera)?.name || 'Camera View'}
              </h2>
            </div>
            {selectedCamera && (
              <div className="relative bg-gray-950 aspect-video group mx-6 mb-6 rounded-lg overflow-hidden">
                <img
                  src={cctvClient.getLegacyStreamUrl('1')}
                  alt="Live Stream"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3C/svg%3E';
                  }}
                />
                
                {/* Simulated stream overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
                
                {/* Timestamp overlay */}
                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded text-white">
                  <p className="text-xs text-gray-400 mb-1">Current Time</p>
                  <p className="text-lg font-mono">{activeCamera === `camera1` ? camera1Time.toLocaleTimeString() : camera2Time.toLocaleTimeString()}</p>
                  <p className="text-xs text-gray-400 mt-1">{activeCamera === `camera1` ? camera1Time.toLocaleDateString() : camera2Time.toLocaleDateString()}</p>
                </div>

                {/* Camera info overlay */}
                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-sm px-4 py-2 rounded text-white">
                  <p className="text-xs text-gray-400 mb-1">Stream Quality</p>
                  <p className="text-sm">1920x1080 @ 30fps</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

