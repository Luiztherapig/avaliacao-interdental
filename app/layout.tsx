import type { Metadata } from "next";
import { Toaster } from "sonner";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Interdental | Avaliação de Atendimento",
  description: "Sistema de avaliação de atendimento da Interdental."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
