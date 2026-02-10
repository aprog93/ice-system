"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { NotificationService } from "@/services/notification.service";
import { Loader2, Users, Shield, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "admin",
    password: "admin123",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación con SweetAlert2
    if (!credentials.username.trim() || !credentials.password.trim()) {
      await NotificationService.warningDialog(
        "Campos requeridos",
        "Por favor ingrese su usuario y contraseña.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(credentials);
      login(response.user, response.accessToken);

      // Notificación de éxito personalizada según el rol
      const welcomeMessage =
        response.user.rol === "ADMIN"
          ? `¡Bienvenido Administrador ${response.user.nombre}!`
          : response.user.rol === "OPERADOR"
            ? `¡Bienvenido ${response.user.nombre}!`
            : `¡Bienvenido ${response.user.nombre}! (Modo Consulta)`;

      NotificationService.success(welcomeMessage, 4000);
      router.push("/dashboard");
    } catch (error: any) {
      // Error con SweetAlert2 para errores graves
      if (
        error.message?.includes("401") ||
        error.message?.includes("credenciales")
      ) {
        await NotificationService.errorDialog(
          "Acceso Denegado",
          "Usuario o contraseña incorrectos. Por favor verifique sus credenciales.",
        );
      } else {
        // Toast para errores de red
        NotificationService.error(
          error.message || "Error de conexión. Intente nuevamente.",
          5000,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/wallpaper.jpg')" }}
      />

      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/70 to-blue-900/60" />

      {/* Main card */}
      <div className="glass-card-static w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg shadow-white/20 mb-4 bg-white/20 backdrop-blur-sm">
            <img
              src="/images/icelogo.jpg"
              alt="Logo ICE"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg">
            Sistema ICE
          </h1>
          <p className="text-white/80 text-center mt-2 text-sm drop-shadow-md">
            Cooperación Internacional de Educadores
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90 ml-1 drop-shadow-md">
              Usuario
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                disabled={isLoading}
                required
                className="glass-input pl-12 bg-white/90 border-white/40 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90 ml-1 drop-shadow-md">
              Contraseña
            </label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese su contraseña"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                disabled={isLoading}
                required
                className="glass-input pl-12 pr-12 bg-white/90 border-white/40 text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="glass-button w-full mt-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {/* Test Credentials */}
        <div className="mt-6 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <p className="text-xs text-white/70 text-center font-medium">
            Credenciales de prueba
          </p>
          <div className="flex justify-center gap-4 mt-1">
            <span className="text-xs text-white/90">
              <span className="text-white/60">Usuario:</span> admin
            </span>
            <span className="text-xs text-white/90">
              <span className="text-white/60">Contraseña:</span> admin123
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/50 drop-shadow-md">
            ©{" "}
            {new Date().toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            Sistema ICE. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
