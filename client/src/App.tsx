import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import CameraCapture from "./components/camera-capture";

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-material-surface-light dark:bg-material-surface-dark text-material-on-surface-light dark:text-material-on-surface-dark transition-colors duration-300">
          {/* Android Status Bar Simulation */}
          <div className="bg-material-purple h-6 w-full"></div>
          
          {/* Main App Content */}
          <CameraCapture />
          
          <Toaster />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
