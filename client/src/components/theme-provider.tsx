import { useTheme, ThemeProvider as BaseThemeProvider } from "@/hooks/use-theme";

export { useTheme };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseThemeProvider defaultTheme="light" storageKey="permission-manager-theme">
      {children}
    </BaseThemeProvider>
  );
}
