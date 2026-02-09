import { prorrogasService } from "./prorrogas.service";
import { api } from "./api";
import { Prorroga } from "@/types";

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

describe("prorrogasService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all prorrogas without filters", async () => {
      const mockResponse = {
        data: [
          {
            id: "1",
            contratoId: "c1",
            numeroProrroga: 1,
            fechaDesde: "2025-01-01",
            fechaHasta: "2025-06-30",
            motivo: "EXTENSIÓN",
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await prorrogasService.getAll();

      expect(api.get).toHaveBeenCalledWith("/prorrogas");
      expect(result).toEqual(mockResponse);
    });

    it("should filter by contratoId", async () => {
      const mockResponse = {
        data: [{ id: "1", contratoId: "c1" }],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await prorrogasService.getAll({ contratoId: "c1" });

      expect(api.get).toHaveBeenCalledWith("/prorrogas?contratoId=c1");
    });

    it("should apply pagination", async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 2, limit: 20, totalPages: 0 },
      };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await prorrogasService.getAll({ page: 2, limit: 20 });

      expect(api.get).toHaveBeenCalledWith("/prorrogas?page=2&limit=20");
    });
  });

  describe("getById", () => {
    it("should fetch a single prorroga", async () => {
      const mockProrroga: Prorroga = {
        id: "1",
        contratoId: "c1",
        numeroProrroga: 1,
        fechaDesde: "2025-01-01",
        fechaHasta: "2025-06-30",
        motivo: "EXTENSIÓN",
        observaciones: null,
        createdAt: "2025-01-01T00:00:00Z",
      };
      (api.get as jest.Mock).mockResolvedValue(mockProrroga);

      const result = await prorrogasService.getById("1");

      expect(api.get).toHaveBeenCalledWith("/prorrogas/1");
      expect(result).toEqual(mockProrroga);
    });

    it("should handle 404 error", async () => {
      const error = new Error("Prórroga no encontrada");
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(prorrogasService.getById("999")).rejects.toThrow(
        "Prórroga no encontrada",
      );
    });
  });

  describe("create", () => {
    const createData = {
      contratoId: "c1",
      fechaDesde: "2025-01-01",
      fechaHasta: "2025-06-30",
      motivo: "Extensión",
    };

    it("should create a new prorroga", async () => {
      const mockCreatedProrroga: Prorroga = {
        id: "1",
        contratoId: "c1",
        numeroProrroga: 1,
        fechaDesde: "2025-01-01",
        fechaHasta: "2025-06-30",
        motivo: "Extensión",
        observaciones: undefined,
        createdAt: "2025-01-01T00:00:00Z",
      };
      (api.post as jest.Mock).mockResolvedValue(mockCreatedProrroga);

      const result = await prorrogasService.create(createData);

      expect(api.post).toHaveBeenCalledWith("/prorrogas", createData);
      expect(result).toEqual(mockCreatedProrroga);
    });

    it("should handle validation errors", async () => {
      const error = new Error("La fecha de fin debe ser posterior");
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(prorrogasService.create(createData)).rejects.toThrow(
        "La fecha de fin debe ser posterior",
      );
    });

    it("should handle contrato not found", async () => {
      const error = new Error("Contrato no encontrado");
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(prorrogasService.create(createData)).rejects.toThrow(
        "Contrato no encontrado",
      );
    });
  });

  describe("update", () => {
    const updateData = {
      contratoId: "c1",
      fechaDesde: "2025-02-01",
      fechaHasta: "2025-07-31",
      motivo: "Nueva extensión",
    };

    it("should update a prorroga", async () => {
      const mockUpdatedProrroga: Prorroga = {
        id: "1",
        contratoId: "c1",
        numeroProrroga: 1,
        fechaDesde: "2025-02-01",
        fechaHasta: "2025-07-31",
        motivo: "Nueva extensión",
        observaciones: undefined,
        createdAt: "2025-01-01T00:00:00Z",
      };
      (api.put as jest.Mock).mockResolvedValue(mockUpdatedProrroga);

      const result = await prorrogasService.update("1", updateData);

      expect(api.put).toHaveBeenCalledWith("/prorrogas/1", updateData);
      expect(result).toEqual(mockUpdatedProrroga);
    });

    it("should handle prorroga not found", async () => {
      const error = new Error("Prórroga no encontrada");
      (api.put as jest.Mock).mockRejectedValue(error);

      await expect(prorrogasService.update("999", updateData)).rejects.toThrow(
        "Prórroga no encontrada",
      );
    });
  });

  describe("delete", () => {
    it("should delete a prorroga", async () => {
      (api.delete as jest.Mock).mockResolvedValue(undefined);

      await prorrogasService.delete("1");

      expect(api.delete).toHaveBeenCalledWith("/prorrogas/1");
    });

    it("should handle delete error", async () => {
      const error = new Error("Solo se puede eliminar la última prórroga");
      (api.delete as jest.Mock).mockRejectedValue(error);

      await expect(prorrogasService.delete("1")).rejects.toThrow(
        "Solo se puede eliminar la última prórroga",
      );
    });
  });

  describe("generarSuplemento", () => {
    it("should download PDF", async () => {
      const mockBlob = new Blob(["PDF content"], { type: "application/pdf" });
      (api.download as jest.Mock).mockResolvedValue(mockBlob);

      const result = await prorrogasService.generarSuplemento("1");

      expect(api.download).toHaveBeenCalledWith(
        "/prorrogas/1/generar-suplemento",
        {
          method: "POST",
        },
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it("should handle PDF generation error", async () => {
      const error = new Error("Error generando PDF");
      (api.download as jest.Mock).mockRejectedValue(error);

      await expect(prorrogasService.generarSuplemento("1")).rejects.toThrow(
        "Error generando PDF",
      );
    });
  });
});
