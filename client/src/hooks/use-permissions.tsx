import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type PermissionType = "camera" | "microphone" | "location" | "storage";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unsupported";

export interface PermissionState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
  storage: PermissionStatus;
}

export function usePermissions() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: "prompt",
    microphone: "prompt",
    location: "prompt",
    storage: "granted", // File API doesn't require explicit permission
  });

  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermission = useCallback(async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      switch (type) {
        case "camera":
          if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return "granted";
          } catch (error: any) {
            if (error.name === "NotAllowedError") return "denied";
            if (error.name === "NotFoundError") return "unsupported";
            return "prompt";
          }

        case "microphone":
          if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return "granted";
          } catch (error: any) {
            if (error.name === "NotAllowedError") return "denied";
            if (error.name === "NotFoundError") return "unsupported";
            return "prompt";
          }

        case "location":
          if (!navigator.geolocation) return "unsupported";
          
          // Check if we have permission via the Permissions API
          if ('permissions' in navigator) {
            try {
              const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
              return result.state as PermissionStatus;
            } catch {
              // Fall back to checking via getCurrentPosition
            }
          }
          
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve("granted"),
              (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                  resolve("denied");
                } else {
                  resolve("prompt");
                }
              },
              { timeout: 1000 }
            );
          });

        case "storage":
          // File API doesn't require explicit permission
          return "granted";

        default:
          return "unsupported";
      }
    } catch (error) {
      console.error(`Error checking ${type} permission:`, error);
      return "unsupported";
    }
  }, []);

  const requestPermission = useCallback(async (type: PermissionType): Promise<PermissionStatus> => {
    try {
      switch (type) {
        case "camera":
          if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            return "granted";
          } catch (error: any) {
            console.error("Camera permission error:", error);
            if (error.name === "NotAllowedError") return "denied";
            if (error.name === "NotFoundError") return "unsupported";
            return "denied";
          }

        case "microphone":
          if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return "granted";
          } catch (error: any) {
            console.error("Microphone permission error:", error);
            if (error.name === "NotAllowedError") return "denied";
            if (error.name === "NotFoundError") return "unsupported";
            return "denied";
          }

        case "location":
          if (!navigator.geolocation) return "unsupported";
          
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve("granted"),
              (error) => {
                console.error("Location permission error:", error);
                if (error.code === error.PERMISSION_DENIED) {
                  resolve("denied");
                } else {
                  resolve("denied");
                }
              },
              { enableHighAccuracy: false, timeout: 10000 }
            );
          });

        case "storage":
          return "granted";

        default:
          return "unsupported";
      }
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return "denied";
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    setIsRequesting(true);
    
    try {
      const newPermissions = { ...permissions };
      
      // Request each permission sequentially
      for (const type of ["camera", "microphone", "location", "storage"] as PermissionType[]) {
        const status = await requestPermission(type);
        newPermissions[type] = status;
        
        // Small delay between requests for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setPermissions(newPermissions);
      
      // Check if all required permissions are granted
      const allGranted = Object.values(newPermissions).every(status => 
        status === "granted" || status === "unsupported"
      );
      
      if (allGranted) {
        toast({
          title: "All permissions granted!",
          description: "Ready to use the app.",
        });
      } else {
        const deniedPermissions = Object.entries(newPermissions)
          .filter(([, status]) => status === "denied")
          .map(([type]) => type);
        
        if (deniedPermissions.length > 0) {
          toast({
            title: "Some permissions denied",
            description: `${deniedPermissions.join(", ")} access was denied.`,
            variant: "destructive",
          });
        }
      }
      
      return newPermissions;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      toast({
        title: "Permission error",
        description: "Failed to request permissions. Please try again.",
        variant: "destructive",
      });
      return permissions;
    } finally {
      setIsRequesting(false);
    }
  }, [permissions, requestPermission, toast]);

  const hasAllPermissions = useCallback(() => {
    return Object.values(permissions).every(status => 
      status === "granted" || status === "unsupported"
    );
  }, [permissions]);

  const getDeniedPermissions = useCallback(() => {
    return Object.entries(permissions)
      .filter(([, status]) => status === "denied")
      .map(([type]) => type as PermissionType);
  }, [permissions]);

  return {
    permissions,
    isRequesting,
    requestAllPermissions,
    hasAllPermissions,
    getDeniedPermissions,
    checkPermission,
    requestPermission,
  };
}
