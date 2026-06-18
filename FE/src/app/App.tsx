import { Toaster } from "sonner";
import { QueryProvider, RouterProvider } from "@/app/providers";

export default function App() {
  return (
    <QueryProvider>
      <RouterProvider />
      <Toaster position="top-right" richColors closeButton />
    </QueryProvider>
  );
}
