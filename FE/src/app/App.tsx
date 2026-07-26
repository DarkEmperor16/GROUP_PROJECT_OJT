import { Toaster } from "sonner";
import { QueryProvider, RouterProvider } from "@/app/providers";
import { AuthBootstrap } from "@/features/auth";

export default function App() {
  return (
    <QueryProvider>
      <AuthBootstrap>
        <RouterProvider />
      </AuthBootstrap>
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  );
}
