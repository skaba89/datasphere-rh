import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegistration } from "@/components/sw-registration";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataSphere RH Guinée — SIRH Premium SaaS",
  description: "Système d'Information Ressources Humaines premium adapté au contexte guinéen : CNSS, RTS, versement forfaitaire, paie, congés, contrats.",
  keywords: ["SIRH", "Guinée", "CNSS", "paie", "RH", "SaaS", "Conakry"],
  authors: [{ name: "DataSphere RH Guinée" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'DataSphere RH',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 min-h-screen`}
      >
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </ErrorBoundary>
      </body>
    </html>
  );
}
