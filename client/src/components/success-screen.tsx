import { Check, Camera, MapPin, Mic, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionState } from "@/hooks/use-permissions";

interface SuccessScreenProps {
  permissions: PermissionState;
}

export default function SuccessScreen({ permissions }: SuccessScreenProps) {
  const permissionDetails = [
    { key: "camera" as keyof PermissionState, icon: Camera, name: "Camera" },
    { key: "location" as keyof PermissionState, icon: MapPin, name: "Location" },
    { key: "microphone" as keyof PermissionState, icon: Mic, name: "Microphone" },
    { key: "storage" as keyof PermissionState, icon: FolderOpen, name: "Storage" },
  ];

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-3xl material-shadow-2 text-center">
      <CardContent className="p-8">
        <div className="w-20 h-20 bg-material-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-material-success" />
        </div>
        <h2 className="text-2xl font-medium mb-2 text-material-success">All Set!</h2>
        <p className="text-material-secondary mb-6">
          All permissions granted! Ready to use the app.
        </p>

        <div className="space-y-2 mb-6">
          {permissionDetails.map((detail) => (
            <div
              key={detail.key}
              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <detail.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">{detail.name}</span>
              </div>
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          ))}
        </div>

        <Button className="w-full bg-material-success hover:bg-green-700 text-white py-4 px-6 rounded-full font-medium text-base transition-all duration-200 material-shadow-1 hover:material-shadow-2">
          Continue to App
        </Button>
      </CardContent>
    </Card>
  );
}
