import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Toaster } from "sonner";

import "@/app/globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Interdental | Avaliação de Atendimento",
  description: "Sistema de avaliação de atendimento da Interdental."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={sora.variable}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
