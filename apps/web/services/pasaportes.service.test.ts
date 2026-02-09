import { pasaportesService, visasService } from "./pasaportes.service";
import { api } from "./api";
import { Pasaporte, Visa, TipoPasaporte } from "@/types";

/**
 * Unit Tests for pasaportesService
 *
 * Tests the service layer:
 * - API calls
 * - Data transformation
 * - Error handling
 * - Parameter construction
 */

// Mock the api module
jest.mock("./api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    download: jest.fn(),
  },
}));

describe("pasaportesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============================================
  // getAll()
  // ============================================
  describe("getAll", () => {
    const mockResponse = {
      data: [
        {
          id: "1",
          numero: "A123456",
          tipo: "ORDINARIO" as TipoPasaporte,
          fechaExpedicion: "2023-01-15",
          fechaVencimiento: "2033-01-15",
          profesor: {
            id: "p1",
            nombre: "Juan",
            apellidos: "Pérez",
            ci: "12345678901",
          },
        },
      ],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it("should fetch all pasaportes without filters", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await pasaportesService.getAll();

      // Assert
      expect(api.get).toHaveBeenCalledWith("/pasaportes");
      expect(result).toEqual(mockResponse);
    });

    it("should construct query params correctly with all filters", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      const filters = {
        page: 2,
        limit: 20,
        profesorId: "prof-123",
        numero: "A123",
        estado: "vencidos" as const,
      };

      // Act
      await pasaportesService.getAll(filters);

      // Assert
      expect(api.get).toHaveBeenCalledWith(
        "/pasaportes?page=2&limit=20&profesorId=prof-123&numero=A123&estado=vencidos",
      );
    });

    it("should construct query params with only page and limit", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      const filters = { page: 1, limit: 10 };

      // Act
      await pasaportesService.getAll(filters);

      // Assert
      expect(api.get).toHaveBeenCalledWith("/pasaportes?page=1&limit=10");
    });

    it("should ignore undefined filters", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      const filters = {
        page: 1,
        profesorId: undefined,
        numero: undefined,
      };

      // Act
      await pasaportesService.getAll(filters);

      // Assert
      expect(api.get).toHaveBeenCalledWith("/pasaportes?page=1");
    });

    it("should handle empty response", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });

      // Act
      const result = await pasaportesService.getAll();

      // Assert
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it("should propagate API errors", async () => {
      // Arrange
      const error = new Error("Network error");
      (api.get as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.getAll()).rejects.toThrow("Network error");
    });
  });

  // ============================================
  // getById()
  // ============================================
  describe("getById", () => {
    const mockPasaporte: Pasaporte = {
      id: "1",
      profesorId: "p1",
      tipo: "ORDINARIO" as TipoPasaporte,
      numero: "A123456",
      fechaExpedicion: "2023-01-15",
      fechaVencimiento: "2033-01-15",
      lugarExpedicion: "HABANA",
      observaciones: null,
      activo: true,
      createdAt: "2023-01-15T00:00:00Z",
      profesor: {
        id: "p1",
        ci: "12345678901",
        nombre: "Juan",
        apellidos: "Pérez",
        edad: 30,
        sexo: "MASCULINO",
        estadoCivil: "SOLTERO",
        cantidadHijos: 0,
        anosExperiencia: 5,
        nivelIngles: "INTERMEDIO",
        estadoPotencial: "ACTIVO",
        provinciaId: "prov-1",
        municipioId: "mun-1",
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
      visas: [],
    };

    it("should fetch a single pasaporte by id", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockPasaporte);

      // Act
      const result = await pasaportesService.getById("1");

      // Assert
      expect(api.get).toHaveBeenCalledWith("/pasaportes/1");
      expect(result).toEqual(mockPasaporte);
    });

    it("should handle 404 error", async () => {
      // Arrange
      const error = new Error("Pasaporte no encontrado");
      error.name = "NotFoundError";
      (api.get as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.getById("999")).rejects.toThrow(
        "Pasaporte no encontrado",
      );
    });
  });

  // ============================================
  // create()
  // ============================================
  describe("create", () => {
    const createData = {
      profesorId: "p1",
      tipo: "ORDINARIO" as TipoPasaporte,
      numero: "A123456",
      fechaExpedicion: "2023-01-15",
      fechaVencimiento: "2033-01-15",
      lugarExpedicion: "Habana",
    };

    const mockCreatedPasaporte: Pasaporte = {
      id: "1",
      profesorId: "p1",
      tipo: "ORDINARIO" as TipoPasaporte,
      numero: "A123456",
      fechaExpedicion: "2023-01-15",
      fechaVencimiento: "2033-01-15",
      lugarExpedicion: "Habana",
      observaciones: undefined,
      activo: true,
      createdAt: "2023-01-15T00:00:00Z",
    };

    it("should create a new pasaporte", async () => {
      // Arrange
      (api.post as jest.Mock).mockResolvedValue(mockCreatedPasaporte);

      // Act
      const result = await pasaportesService.create(createData);

      // Assert
      expect(api.post).toHaveBeenCalledWith("/pasaportes", createData);
      expect(result).toEqual(mockCreatedPasaporte);
    });

    it("should handle validation errors (400)", async () => {
      // Arrange
      const error = new Error("El número de pasaporte es inválido");
      (api.post as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.create(createData)).rejects.toThrow(
        "El número de pasaporte es inválido",
      );
    });

    it("should handle conflict errors (409)", async () => {
      // Arrange
      const error = new Error("Ya existe un pasaporte con este número");
      (api.post as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.create(createData)).rejects.toThrow(
        "Ya existe un pasaporte con este número",
      );
    });
  });

  // ============================================
  // update()
  // ============================================
  describe("update", () => {
    const updateData = {
      profesorId: "p1",
      tipo: "ORDINARIO" as TipoPasaporte,
      numero: "A123456",
      fechaExpedicion: "2023-01-15",
      fechaVencimiento: "2033-01-15",
      lugarExpedicion: "Santiago",
    };

    const mockUpdatedPasaporte: Pasaporte = {
      id: "1",
      profesorId: "p1",
      tipo: "ORDINARIO" as TipoPasaporte,
      numero: "A123456",
      fechaExpedicion: "2023-01-15",
      fechaVencimiento: "2033-01-15",
      lugarExpedicion: "Santiago",
      observaciones: undefined,
      activo: true,
      createdAt: "2023-01-15T00:00:00Z",
    };

    it("should update an existing pasaporte", async () => {
      // Arrange
      (api.put as jest.Mock).mockResolvedValue(mockUpdatedPasaporte);

      // Act
      const result = await pasaportesService.update("1", updateData);

      // Assert
      expect(api.put).toHaveBeenCalledWith("/pasaportes/1", updateData);
      expect(result).toEqual(mockUpdatedPasaporte);
    });

    it("should handle 404 when pasaporte not found", async () => {
      // Arrange
      const error = new Error("Pasaporte no encontrado");
      (api.put as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.update("999", updateData)).rejects.toThrow(
        "Pasaporte no encontrado",
      );
    });
  });

  // ============================================
  // delete()
  // ============================================
  describe("delete", () => {
    it("should delete a pasaporte", async () => {
      // Arrange
      (api.delete as jest.Mock).mockResolvedValue(undefined);

      // Act
      await pasaportesService.delete("1");

      // Assert
      expect(api.delete).toHaveBeenCalledWith("/pasaportes/1");
    });

    it("should handle 404 when pasaporte not found", async () => {
      // Arrange
      const error = new Error("Pasaporte no encontrado");
      (api.delete as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.delete("999")).rejects.toThrow(
        "Pasaporte no encontrado",
      );
    });
  });

  // ============================================
  // getAlertas()
  // ============================================
  describe("getAlertas", () => {
    const mockAlertas = {
      vencidos: [],
      proximos30: [
        {
          id: "1",
          numero: "A123456",
          fechaVencimiento: "2024-02-01",
          profesor: {
            id: "p1",
            nombre: "Juan",
            apellidos: "Pérez",
            telefonoMovil: "5551234567",
            email: "juan@example.com",
          },
        },
      ],
      proximos90: [],
      resumen: {
        totalVencidos: 0,
        totalProximos30: 1,
        totalProximos90: 0,
      },
    };

    it("should fetch alertas de vencimientos", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockAlertas);

      // Act
      const result = await pasaportesService.getAlertas();

      // Assert
      expect(api.get).toHaveBeenCalledWith("/pasaportes/alertas/vencimientos");
      expect(result).toEqual(mockAlertas);
    });

    it("should return correct summary", async () => {
      // Arrange
      (api.get as jest.Mock).mockResolvedValue(mockAlertas);

      // Act
      const result = await pasaportesService.getAlertas();

      // Assert
      expect(result.resumen.totalVencidos).toBe(0);
      expect(result.resumen.totalProximos30).toBe(1);
      expect(result.resumen.totalProximos90).toBe(0);
    });
  });

  // ============================================
  // generarSolicitud()
  // ============================================
  describe("generarSolicitud", () => {
    it("should download PDF", async () => {
      // Arrange
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
      (api.download as jest.Mock).mockResolvedValue(mockBlob);

      // Act
      const result = await pasaportesService.generarSolicitud(
        "1",
        "Director",
        "Director General",
      );

      // Assert
      expect(api.download).toHaveBeenCalledWith(
        "/pasaportes/generar-solicitud",
        {
          method: "POST",
          body: JSON.stringify({
            pasaporteId: "1",
            firmante: "Director",
            cargoFirmante: "Director General",
          }),
        },
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it("should handle PDF generation error", async () => {
      // Arrange
      const error = new Error("Error generando PDF");
      (api.download as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(pasaportesService.generarSolicitud("1")).rejects.toThrow(
        "Error generando PDF",
      );
    });
  });
});

describe("visasService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch visas with filters", async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            id: "1",
            pasaporteId: "p1",
            tipo: "TURISTA",
            numero: "V123456",
            fechaEmision: "2023-02-01",
            fechaVencimiento: "2023-05-01",
            paisEmision: "España",
            numeroEntradas: 1,
            duracionDias: 90,
            activa: true,
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await visasService.getAll({ pasaporteId: "p1" });

      // Assert
      expect(api.get).toHaveBeenCalledWith("/visas?pasaporteId=p1");
      expect(result).toEqual(mockResponse);
    });
  });

  describe("delete", () => {
    it("should delete a visa", async () => {
      // Arrange
      (api.delete as jest.Mock).mockResolvedValue(undefined);

      // Act
      await visasService.delete("1");

      // Assert
      expect(api.delete).toHaveBeenCalledWith("/visas/1");
    });
  });
});
