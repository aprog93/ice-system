import Swal from "sweetalert2";
import { toast } from "react-hot-toast";

// Configuración base de SweetAlert2 con estilo Glass claro
const baseSwalConfig = {
  customClass: {
    popup: "swal2-glass-popup",
    title: "swal2-glass-title",
    htmlContainer: "swal2-glass-content",
    confirmButton: "swal2-glass-confirm",
    cancelButton: "swal2-glass-cancel",
    denyButton: "swal2-glass-deny",
    actions: "swal2-glass-actions",
  },
  buttonsStyling: false,
  backdrop: "rgba(0, 0, 0, 0.4)",
  showClass: {
    popup: "animate__animated animate__fadeInUp animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutDown animate__faster",
  },
};

// Configuración de Toast
const toastConfig = {
  duration: 4000,
  position: "top-right" as const,
  style: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "1rem",
    padding: "1rem 1.5rem",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    color: "#1e293b",
  },
};

export const NotificationService = {
  // ==================== TOAST NOTIFICATIONS ====================

  /**
   * Toast de éxito
   */
  success(message: string, duration?: number) {
    return toast.success(message, {
      ...toastConfig,
      duration: duration || 3000,
      iconTheme: {
        primary: "#22c55e",
        secondary: "#fff",
      },
    });
  },

  /**
   * Toast de error
   */
  error(message: string, duration?: number) {
    return toast.error(message, {
      ...toastConfig,
      duration: duration || 5000,
      iconTheme: {
        primary: "#ef4444",
        secondary: "#fff",
      },
    });
  },

  /**
   * Toast de advertencia
   */
  warning(message: string, duration?: number) {
    return toast(message, {
      ...toastConfig,
      duration: duration || 4000,
      icon: "⚠️",
    });
  },

  /**
   * Toast de información
   */
  info(message: string, duration?: number) {
    return toast(message, {
      ...toastConfig,
      duration: duration || 4000,
      icon: "ℹ️",
    });
  },

  /**
   * Toast de carga/promesa
   */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
  ) {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...toastConfig,
        loading: {
          icon: "⏳",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      },
    );
  },

  /**
   * Toast de progreso para importaciones
   */
  loading(message: string) {
    return toast.loading(message, {
      ...toastConfig,
      duration: Infinity,
    });
  },

  /**
   * Actualizar toast de carga
   */
  update(
    toastId: string,
    message: string,
    type: "success" | "error" | "loading",
  ) {
    toast.dismiss(toastId);
    if (type === "success") {
      this.success(message);
    } else if (type === "error") {
      this.error(message);
    }
  },

  // ==================== SWEETALERT2 CONFIRMATIONS ====================

  /**
   * Confirmación de eliminación
   */
  async confirmDelete(itemName: string): Promise<boolean> {
    const result = await Swal.fire({
      ...baseSwalConfig,
      title: "¿Confirmar Eliminación?",
      html: `
        <div style="text-align: center; padding: 10px 0;">
          <p style="margin-bottom: 15px; color: #64748b; font-size: 1rem;">
            ¿Está seguro que desea eliminar a:
          </p>
          <p style="font-weight: 600; font-size: 1.1rem; color: #1e293b; margin-bottom: 20px; padding: 10px; background: #f1f5f9; border-radius: 8px;">
            ${itemName}
          </p>
          <p style="color: #ef4444; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span>⚠️</span>
            <span>Esta acción no se puede deshacer</span>
          </p>
        </div>
      `,
      icon: "warning",
      iconColor: "#f59e0b",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
      width: "420px",
      padding: "24px",
    });
    return result.isConfirmed;
  },

  /**
   * Confirmación genérica
   */
  async confirm(
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      icon?: "warning" | "info" | "question";
      confirmColor?: string;
    },
  ): Promise<boolean> {
    const result = await Swal.fire({
      ...baseSwalConfig,
      title,
      html: `<div style="text-align: center; color: #64748b; padding: 10px 0;">${message}</div>`,
      icon: options?.icon || "question",
      iconColor: options?.confirmColor || "#3b82f6",
      showCancelButton: true,
      confirmButtonText: options?.confirmText || "Confirmar",
      cancelButtonText: options?.cancelText || "Cancelar",
      reverseButtons: true,
      width: "420px",
      padding: "24px",
    });
    return result.isConfirmed;
  },

  /**
   * Diálogo de éxito
   */
  async successDialog(title: string, message?: string) {
    return Swal.fire({
      ...baseSwalConfig,
      title: `<span style="color: #1e293b; font-weight: 700;">${title}</span>`,
      html: message
        ? `<div style="text-align: center; color: #64748b; padding: 10px 0;">${message}</div>`
        : "",
      icon: "success",
      iconColor: "#22c55e",
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#22c55e",
      timer: 3000,
      timerProgressBar: true,
      width: "400px",
      padding: "24px",
    });
  },

  /**
   * Diálogo de error
   */
  async errorDialog(title: string, message?: string) {
    return Swal.fire({
      ...baseSwalConfig,
      title: `<span style="color: #1e293b; font-weight: 700;">${title}</span>`,
      html: message
        ? `<div style="text-align: center; color: #64748b; padding: 10px 0;">${message}</div>`
        : "",
      icon: "error",
      iconColor: "#ef4444",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#ef4444",
      width: "400px",
      padding: "24px",
    });
  },

  /**
   * Diálogo de advertencia
   */
  async warningDialog(title: string, message?: string) {
    return Swal.fire({
      ...baseSwalConfig,
      title: `<span style="color: #1e293b; font-weight: 700;">${title}</span>`,
      html: message
        ? `<div style="text-align: center; color: #64748b; padding: 10px 0;">${message}</div>`
        : "",
      icon: "warning",
      iconColor: "#f59e0b",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#f59e0b",
      width: "400px",
      padding: "24px",
    });
  },

  /**
   * Input de texto
   */
  async input(
    title: string,
    inputLabel: string,
    inputValue?: string,
  ): Promise<string | null> {
    const result = await Swal.fire({
      ...baseSwalConfig,
      title,
      input: "text",
      inputLabel,
      inputValue: inputValue || "",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      width: "400px",
      padding: "24px",
      inputValidator: (value) => {
        if (!value) {
          return "Este campo es requerido";
        }
        return null;
      },
    });
    return result.isConfirmed ? result.value : null;
  },

  /**
   * Selector de opciones
   */
  async select(
    title: string,
    options: { value: string; label: string }[],
    selectedValue?: string,
  ): Promise<string | null> {
    const result = await Swal.fire({
      ...baseSwalConfig,
      title,
      input: "select",
      inputOptions: options.reduce(
        (acc, opt) => {
          acc[opt.value] = opt.label;
          return acc;
        },
        {} as Record<string, string>,
      ),
      inputValue: selectedValue || "",
      showCancelButton: true,
      confirmButtonText: "Seleccionar",
      cancelButtonText: "Cancelar",
      width: "400px",
      padding: "24px",
    });
    return result.isConfirmed ? result.value : null;
  },

  /**
   * Loading/Procesando
   */
  async showLoading(title: string, message?: string) {
    return Swal.fire({
      ...baseSwalConfig,
      title,
      html: message || "Procesando...",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
      width: "350px",
      padding: "24px",
    });
  },

  /**
   * Cerrar loading
   */
  closeLoading() {
    Swal.close();
  },

  /**
   * Reporte de importación
   */
  async importReport(data: {
    creados: number;
    actualizados: number;
    errores: number;
    detalles?: string[];
  }) {
    const erroresHtml =
      data.detalles && data.detalles.length > 0
        ? `<div style="margin-top: 16px; text-align: left;"><p style="font-weight: 600; margin-bottom: 8px; color: #1e293b;">Errores:</p><ul style="font-size: 0.875rem; color: #dc2626; max-height: 160px; overflow-y: auto; padding-left: 16px;">${data.detalles.map((e) => `<li style="margin-bottom: 4px;">• ${e}</li>`).join("")}</ul></div>`
        : "";

    return Swal.fire({
      ...baseSwalConfig,
      title: "Importación Completada",
      html: `
        <div style="text-align: center; padding: 10px 0;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 12px; background: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
              <div style="font-size: 1.5rem; font-weight: 700; color: #16a34a;">${data.creados}</div>
              <div style="font-size: 0.875rem; color: #166534; margin-top: 4px;">Creados</div>
            </div>
            <div style="text-align: center; padding: 12px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe;">
              <div style="font-size: 1.5rem; font-weight: 700; color: #2563eb;">${data.actualizados}</div>
              <div style="font-size: 0.875rem; color: #1e40af; margin-top: 4px;">Actualizados</div>
            </div>
            <div style="text-align: center; padding: 12px; background: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
              <div style="font-size: 1.5rem; font-weight: 700; color: #dc2626;">${data.errores}</div>
              <div style="font-size: 0.875rem; color: #991b1b; margin-top: 4px;">Errores</div>
            </div>
          </div>
          ${erroresHtml}
        </div>
      `,
      icon: data.errores > 0 ? "warning" : "success",
      confirmButtonText: "Aceptar",
      width: "450px",
      padding: "24px",
    });
  },

  /**
   * Toast para importaciones masivas con progreso
   */
  importProgress(current: number, total: number, operation: string) {
    const percentage = Math.round((current / total) * 100);
    return toast.loading(
      `${operation}: ${current} de ${total} (${percentage}%)`,
      {
        ...toastConfig,
        duration: Infinity,
        icon: "📊",
      },
    );
  },
};

export default NotificationService;
