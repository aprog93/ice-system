import { useAuthStore } from "@/store/auth-store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error: string,
    public path: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "Error desconocido",
      error: "Unknown Error",
      path: response.url,
    }));
    throw new ApiError(
      response.status,
      error.message || "Error desconocido",
      error.error || "Unknown Error",
      error.path || response.url,
    );
  }

  // Handle empty responses
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  // For blob responses (file downloads)
  if (
    contentType?.includes("application/octet-stream") ||
    contentType?.includes("application/vnd.openxmlformats") ||
    contentType?.includes("application/pdf")
  ) {
    return response.blob() as Promise<T>;
  }

  return null as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const url = `${API_BASE_URL}/api/v1${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (requireAuth) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  return handleResponse<T>(response);
}

// HTTP Methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),

  // For file uploads
  upload: async <T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<T> => {
    const { requireAuth = true } = options || {};
    const url = `${API_BASE_URL}/api/v1${endpoint}`;

    const headers: Record<string, string> = {};

    if (requireAuth) {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
    });

    return handleResponse<T>(response);
  },

  // For file downloads
  download: (endpoint: string, options?: RequestOptions) =>
    apiRequest<Blob>(endpoint, { method: "GET", ...options }),
};

export { ApiError };
