import { AlertTriangle, X, Camera, MapPin, Mic, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionState, PermissionType } from "@/hooks/use-permissions";

interface ErrorScreenProps {
  permissions: PermissionState;
  deniedPermissions: PermissionType[];
  onRetry: () => void;
}

export default function ErrorScreen({ deniedPermissions, onRetry }: ErrorScreenProps) {
  const permissionDetails = {
    camera: { 
      icon: Camera, 
      name: "Camera", 
      reason: "Required for document scanning" 
    },
    location: { 
      icon: MapPin, 
      name: "Location", 
      reason: "Needed for location-based features" 
    },
    microphone: { 
      icon: Mic, 
      name: "Microphone", 
      reason: "Needed for voice notes" 
    },
    storage: { 
      icon: FolderOpen, 
      name: "Storage", 
      reason: "Required for saving files" 
    },
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-3xl material-shadow-2">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-material-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-material-error" />
          </div>
          <h2 className="text-xl font-medium mb-2">Permission Required</h2>
          <p className="text-material-secondary text-sm">
            Some permissions were denied. The app may not work properly without them.
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {deniedPermissions.map((permission) => {
            const detail = permissionDetails[permission];
            return (
              <div
                key={permission}
                className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl"
              >
                <div className="flex items-center space-x-3">
                  <detail.icon className="w-5 h-5 text-material-error" />
                  <div>
                    <span className="text-sm font-medium block">{detail.name}</span>
                    <span className="text-xs text-material-secondary">{detail.reason}</span>
                  </div>
                </div>
                <X className="w-5 h-5 text-material-error" />
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <Button
            onClick={onRetry}
            className="w-full bg-material-purple hover:bg-material-purple-dark text-white py-4 px-6 rounded-full font-medium text-base transition-all duration-200 material-shadow-1 hover:material-shadow-2"
          >
            Try Again
          </Button>
          <Button
            variant="secondary"
            className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-material-on-surface-light dark:text-material-on-surface-dark py-4 px-6 rounded-full font-medium text-base transition-all duration-200"
          >
            Continue Without Permissions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
