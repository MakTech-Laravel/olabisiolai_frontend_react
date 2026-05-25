import { QueryClientProvider } from "@tanstack/react-query";

import { AppBootstrap } from "@/AppBootstrap";
import { AuthProvider } from "@/auth/AuthProvider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";
import { EchoProvider } from "@/providers/EchoProvider";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EchoProvider>
          <ErrorBoundary>
            <AppBootstrap />
          </ErrorBoundary>
        </EchoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
