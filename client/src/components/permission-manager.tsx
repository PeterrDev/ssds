import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import WelcomeScreen from "./welcome-screen";
import LoadingScreen from "./loading-screen";
import SuccessScreen from "./success-screen";
import ErrorScreen from "./error-screen";

type Screen = "welcome" | "loading" | "success" | "error";

export default function PermissionManager() {
  const { theme, toggleTheme } = useTheme();
  const { permissions, isRequesting, requestAllPermissions, hasAllPermissions, getDeniedPermissions } = usePermissions();
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");

  useEffect(() => {
    if (isRequesting) {
      setCurrentScreen("loading");
    } else if (hasAllPermissions()) {
      setCurrentScreen("success");
    } else if (getDeniedPermissions().length > 0) {
      setCurrentScreen("error");
    } else {
      setCurrentScreen("welcome");
    }
  }, [isRequesting, hasAllPermissions, getDeniedPermissions]);

  const handleRequestPermissions = async () => {
    await requestAllPermissions();
  };

  return (
    <div className="min-h-screen">
      {/* App Bar */}
      <header className="bg-material-purple text-white px-4 py-3 flex justify-between items-center material-shadow-2">
        <h1 className="text-xl font-medium">Permission Manager</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-white hover:bg-white/10 transition-colors rounded-full"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-md mx-auto">
        {currentScreen === "welcome" && (
          <WelcomeScreen onRequestPermissions={handleRequestPermissions} />
        )}
        
        {currentScreen === "loading" && (
          <LoadingScreen />
        )}
        
        {currentScreen === "success" && (
          <SuccessScreen permissions={permissions} />
        )}
        
        {currentScreen === "error" && (
          <ErrorScreen 
            permissions={permissions}
            deniedPermissions={getDeniedPermissions()}
            onRetry={handleRequestPermissions}
          />
        )}
      </main>
    </div>
  );
}
