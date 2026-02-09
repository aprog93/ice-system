import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";
import { Toaster } from "react-hot-toast";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Sistema ICE - Cooperación Internacional de Educadores",
  description: "Sistema de gestión de cooperación internacional de educadores",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <head>
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${nunito.className} antialiased bg-slate-50 text-slate-900`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "1rem",
              padding: "1rem 1.5rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              color: "#1e293b",
              fontSize: "0.875rem",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#22c55e",
                secondary: "rgba(255, 255, 255, 0.95)",
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "rgba(255, 255, 255, 0.95)",
              },
            },
            loading: {
              iconTheme: {
                primary: "#3b82f6",
                secondary: "rgba(255, 255, 255, 0.95)",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
