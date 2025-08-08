import { Shield, Camera, MapPin, Mic, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeScreenProps {
  onRequestPermissions: () => void;
}

export default function WelcomeScreen({ onRequestPermissions }: WelcomeScreenProps) {
  const permissions = [
    {
      icon: Camera,
      name: "Camera Access",
      description: "We use your camera to scan documents and capture photos for your projects.",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      icon: MapPin,
      name: "Location Access", 
      description: "Location helps us provide relevant content and improve your experience.",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      icon: Mic,
      name: "Microphone Access",
      description: "Record audio notes and voice memos to enhance your productivity.",
      bgColor: "bg-red-100 dark:bg-red-900/30", 
      iconColor: "text-red-600 dark:text-red-400",
    },
    {
      icon: FolderOpen,
      name: "Storage Access",
      description: "Save and access your files, documents, and app data on your device.",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-3xl material-shadow-2 mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-material-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-material-purple" />
          </div>
          <h2 className="text-2xl font-medium mb-2">Welcome!</h2>
          <p className="text-material-secondary text-base">
            This app needs some permissions to work properly. Here's why:
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {permissions.map((permission) => (
            <div
              key={permission.name}
              className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"
            >
              <div className={`w-10 h-10 ${permission.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                <permission.icon className={`w-5 h-5 ${permission.iconColor}`} />
              </div>
              <div>
                <h3 className="font-medium text-sm mb-1">{permission.name}</h3>
                <p className="text-xs text-material-secondary">
                  {permission.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onRequestPermissions}
          className="w-full bg-material-purple hover:bg-material-purple-dark text-white py-4 px-6 rounded-full font-medium text-base transition-all duration-200 material-shadow-1 hover:material-shadow-2"
        >
          Allow Access
        </Button>
      </CardContent>
    </Card>
  );
}
