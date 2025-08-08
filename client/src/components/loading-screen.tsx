import { Card, CardContent } from "@/components/ui/card";

export default function LoadingScreen() {
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-3xl material-shadow-2 text-center">
      <CardContent className="p-8">
        <div className="w-16 h-16 border-4 border-material-purple border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-medium mb-2">Requesting Permissions</h2>
        <p className="text-material-secondary">Please allow access when prompted...</p>
      </CardContent>
    </Card>
  );
}
