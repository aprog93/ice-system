"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setIsLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = () => {
      setIsLoading(true);
      const { isAuthenticated, accessToken } = useAuthStore.getState();

      if (!isAuthenticated || !accessToken) {
        router.push("/login");
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, setIsLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="glass-card p-8 flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-slate-600 font-medium">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <Sidebar />
      <div className="flex flex-1 flex-col pl-64 relative z-10">
        <Header />
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
    </div>
  );
}
