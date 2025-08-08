import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

// Connected devices management
interface ConnectedDevice {
  id: string;
  ws: WebSocket;
  userAgent: string;
  isCapturing: boolean;
  cameraType: 'user' | 'environment';
  frameCount: number;
  lastSeen: Date;
}

const connectedDevices = new Map<string, ConnectedDevice>();

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  // WebSocket Server for device communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, request) => {
    console.log('New WebSocket connection established');
    
    let deviceId: string | null = null;

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'register':
            deviceId = message.deviceId;
            const device: ConnectedDevice = {
              id: deviceId!,
              ws: ws,
              userAgent: message.userAgent || 'Unknown Device',
              isCapturing: false,
              cameraType: 'user',
              frameCount: 0,
              lastSeen: new Date()
            };
            
            connectedDevices.set(deviceId!, device);
            console.log(`Device registered: ${deviceId}`);
            
            // Send updated device list to all connected devices
            broadcastDeviceList();
            break;
            
          case 'start_capture':
            handleStartCapture(message.deviceId);
            break;
            
          case 'stop_capture':
            handleStopCapture(message.deviceId);
            break;
            
          case 'switch_camera':
            handleSwitchCamera(message.deviceId, message.cameraType);
            break;
            
          case 'status_update':
            handleStatusUpdate(message.deviceId, message);
            break;
            
          case 'video_frame':
            handleVideoFrame(message.deviceId, message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      if (deviceId) {
        connectedDevices.delete(deviceId);
        console.log(`Device disconnected: ${deviceId}`);
        broadcastDeviceList();
      }
    });

    // Send initial device list
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        broadcastDeviceList();
      }
    }, 100);
  });

  // Helper functions
  function broadcastDeviceList() {
    const deviceList = Array.from(connectedDevices.values()).map(device => ({
      id: device.id,
      userAgent: device.userAgent,
      isCapturing: device.isCapturing,
      cameraType: device.cameraType,
      frameCount: device.frameCount,
      lastSeen: device.lastSeen
    }));

    const message = JSON.stringify({
      type: 'devices_list',
      devices: deviceList
    });

    connectedDevices.forEach((device) => {
      if (device.ws.readyState === WebSocket.OPEN) {
        device.ws.send(message);
      }
    });
  }

  function handleStartCapture(targetDeviceId: string) {
    const device = connectedDevices.get(targetDeviceId);
    if (device && device.ws.readyState === WebSocket.OPEN) {
      device.isCapturing = true;
      device.ws.send(JSON.stringify({
        type: 'start_capture',
        deviceId: targetDeviceId
      }));
      broadcastDeviceList();
    }
  }

  function handleStopCapture(targetDeviceId: string) {
    const device = connectedDevices.get(targetDeviceId);
    if (device && device.ws.readyState === WebSocket.OPEN) {
      device.isCapturing = false;
      device.ws.send(JSON.stringify({
        type: 'stop_capture',
        deviceId: targetDeviceId
      }));
      broadcastDeviceList();
    }
  }

  function handleSwitchCamera(targetDeviceId: string, cameraType: 'user' | 'environment') {
    const device = connectedDevices.get(targetDeviceId);
    if (device && device.ws.readyState === WebSocket.OPEN) {
      device.cameraType = cameraType;
      device.ws.send(JSON.stringify({
        type: 'switch_camera',
        deviceId: targetDeviceId,
        cameraType: cameraType
      }));
      broadcastDeviceList();
    }
  }

  function handleStatusUpdate(deviceId: string, message: any) {
    const device = connectedDevices.get(deviceId);
    if (device) {
      if (message.isCapturing !== undefined) device.isCapturing = message.isCapturing;
      if (message.frameCount !== undefined) device.frameCount = message.frameCount;
      if (message.cameraType !== undefined) device.cameraType = message.cameraType;
      device.lastSeen = new Date();
      broadcastDeviceList();
    }
  }

  function handleVideoFrame(deviceId: string, message: any) {
    // Broadcast live video frame to all other connected devices (for admin panels)
    const frameMessage = JSON.stringify({
      type: 'video_frame',
      deviceId: deviceId,
      frame: message.frame,
      timestamp: message.timestamp
    });

    connectedDevices.forEach((device, id) => {
      // Send to all devices except the sender
      if (id !== deviceId && device.ws.readyState === WebSocket.OPEN) {
        device.ws.send(frameMessage);
      }
    });
  }

  // Cleanup inactive devices every 30 seconds
  setInterval(() => {
    const now = new Date();
    connectedDevices.forEach((device, deviceId) => {
      if (now.getTime() - device.lastSeen.getTime() > 60000) { // 1 minute
        connectedDevices.delete(deviceId);
        console.log(`Removed inactive device: ${deviceId}`);
      }
    });
    broadcastDeviceList();
  }, 30000);

  return httpServer;
}
