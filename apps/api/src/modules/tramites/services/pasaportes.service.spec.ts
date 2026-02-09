import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PasaportesService } from './pasaportes.service';
import { PrismaService } from '@/database/prisma.service';
import { CreatePasaporteDto, UpdatePasaporteDto, PasaporteFilterDto } from '../dto/pasaporte.dto';
import { TipoPasaporte } from '@prisma/client';
import { addDays, subDays, format } from 'date-fns';

/**
 * Unit Tests for PasaportesService
 *
 * Coverage goals:
 * - All public methods
 * - All branches (if/else)
 * - All error scenarios
 * - Edge cases (nulls, empty strings, boundaries)
 * - Business rules validation
 */
describe('PasaportesService', () => {
  let service: PasaportesService;
  let prismaService: PrismaService;

  // Mock data factories - reproducible test data
  const createMockProfesor = (overrides = {}) => ({
    id: 'profesor-uuid-1',
    ci: '12345678901',
    nombre: 'Juan',
    apellidos: 'Pérez García',
    direccion: 'Calle 123',
    telefonoMovil: '5551234567',
    email: 'juan@example.com',
    ...overrides,
  });

  const createMockPasaporte = (overrides = {}) => ({
    id: 'pasaporte-uuid-1',
    profesorId: 'profesor-uuid-1',
    tipo: TipoPasaporte.ORDINARIO,
    numero: 'A123456',
    fechaExpedicion: new Date('2023-01-15'),
    fechaVencimiento: new Date('2033-01-15'),
    lugarExpedicion: 'HABANA',
    observaciones: null,
    activo: true,
    createdAt: new Date(),
    profesor: createMockProfesor(),
    _count: { visas: 0 },
    ...overrides,
  });

  const createMockVisa = (overrides = {}) => ({
    id: 'visa-uuid-1',
    pasaporteId: 'pasaporte-uuid-1',
    tipo: 'TURISTA',
    numero: 'V123456',
    fechaEmision: new Date('2023-02-01'),
    fechaVencimiento: addDays(new Date(), 180),
    paisEmision: 'España',
    numeroEntradas: 1,
    duracionDias: 90,
    observaciones: null,
    activa: true,
    createdAt: new Date(),
    ...overrides,
  });

  // Prisma mock - complete mock of all used methods
  const mockPrismaService = {
    pasaporte: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profesor: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasaportesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PasaportesService>(PasaportesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // findAll() Tests
  // ============================================
  describe('findAll', () => {
    const mockPasaportes = [
      createMockPasaporte(),
      createMockPasaporte({ id: 'pasaporte-uuid-2', numero: 'B234567' }),
    ];

    it('should return paginated list of pasaportes without filters', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany.mockResolvedValue(mockPasaportes);
      mockPrismaService.pasaporte.count.mockResolvedValue(2);

      const filters: PasaporteFilterDto = { page: 1, limit: 10 };

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true },
          skip: 0,
          take: 10,
          orderBy: { fechaVencimiento: 'asc' },
          include: expect.any(Object),
        }),
      );
    });

    it('should filter by profesorId', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany.mockResolvedValue([mockPasaportes[0]]);
      mockPrismaService.pasaporte.count.mockResolvedValue(1);

      const filters: PasaporteFilterDto = {
        page: 1,
        limit: 10,
        profesorId: 'profesor-uuid-1',
      };

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activo: true,
            profesorId: 'profesor-uuid-1',
          }),
        }),
      );
    });

    it('should filter by numero (case insensitive)', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany.mockResolvedValue([mockPasaportes[0]]);
      mockPrismaService.pasaporte.count.mockResolvedValue(1);

      const filters: PasaporteFilterDto = {
        page: 1,
        limit: 10,
        numero: 'a123',
      };

      // Act
      await service.findAll(filters);

      // Assert
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            numero: { contains: 'A123' }, // uppercase
          }),
        }),
      );
    });

    it('should filter by estado=vencidos', async () => {
      // Arrange
      const pasaporteVencido = createMockPasaporte({
        fechaVencimiento: subDays(new Date(), 10),
      });
      mockPrismaService.pasaporte.findMany.mockResolvedValue([pasaporteVencido]);
      mockPrismaService.pasaporte.count.mockResolvedValue(1);

      const filters: PasaporteFilterDto = {
        page: 1,
        limit: 10,
        estado: 'vencidos',
      };

      // Act
      await service.findAll(filters);

      // Assert
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaVencimiento: { lt: expect.any(Date) },
          }),
        }),
      );
    });

    it('should filter by estado=proximos (next 30 days)', async () => {
      // Arrange
      const pasaporteProximo = createMockPasaporte({
        fechaVencimiento: addDays(new Date(), 15),
      });
      mockPrismaService.pasaporte.findMany.mockResolvedValue([pasaporteProximo]);
      mockPrismaService.pasaporte.count.mockResolvedValue(1);

      const filters: PasaporteFilterDto = {
        page: 1,
        limit: 10,
        estado: 'proximos',
      };

      // Act
      await service.findAll(filters);

      // Assert
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaVencimiento: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should filter by estado=vigentes', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany.mockResolvedValue(mockPasaportes);
      mockPrismaService.pasaporte.count.mockResolvedValue(2);

      const filters: PasaporteFilterDto = {
        page: 1,
        limit: 10,
        estado: 'vigentes',
      };

      // Act
      await service.findAll(filters);

      // Assert
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaVencimiento: { gt: expect.any(Date) },
          }),
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany.mockResolvedValue(mockPasaportes);
      mockPrismaService.pasaporte.count.mockResolvedValue(25);

      const filters: PasaporteFilterDto = { page: 3, limit: 10 };

      // Act
      const result = await service.findAll(filters);

      // Assert
      expect(result.meta.page).toBe(3);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(3); // ceil(25/10) = 3
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }), // (3-1) * 10 = 20
      );
    });

    it('should return empty array when no pasaportes found', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany.mockResolvedValue([]);
      mockPrismaService.pasaporte.count.mockResolvedValue(0);

      // Act
      const result = await service.findAll({});

      // Assert
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  // ============================================
  // findOne() Tests
  // ============================================
  describe('findOne', () => {
    it('should return a pasaporte by id', async () => {
      // Arrange
      const mockPasaporte = createMockPasaporte();
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(mockPasaporte);

      // Act
      const result = await service.findOne('pasaporte-uuid-1');

      // Assert
      expect(result).toEqual(mockPasaporte);
      expect(mockPrismaService.pasaporte.findUnique).toHaveBeenCalledWith({
        where: { id: 'pasaporte-uuid-1' },
        include: expect.objectContaining({
          profesor: expect.any(Object),
          visas: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when pasaporte not found', async () => {
      // Arrange
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when pasaporte is inactive', async () => {
      // Arrange
      const inactivePasaporte = createMockPasaporte({ activo: false });
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(inactivePasaporte);

      // Act & Assert
      await expect(service.findOne('pasaporte-uuid-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // create() Tests
  // ============================================
  describe('create', () => {
    const createDto: CreatePasaporteDto = {
      profesorId: 'profesor-uuid-1',
      tipo: TipoPasaporte.ORDINARIO,
      numero: 'A123456',
      fechaExpedicion: new Date('2023-01-15'),
      fechaVencimiento: new Date('2033-01-15'),
      lugarExpedicion: 'Habana',
    };

    it('should create a new pasaporte successfully', async () => {
      // Arrange
      const mockProfesor = createMockProfesor();
      const mockCreatedPasaporte = createMockPasaporte();

      mockPrismaService.profesor.findUnique.mockResolvedValue(mockProfesor);
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null); // No existe
      mockPrismaService.pasaporte.create.mockResolvedValue(mockCreatedPasaporte);

      // Act
      const result = await service.create(createDto, 'user-uuid-1');

      // Assert
      expect(result).toEqual(mockCreatedPasaporte);
      expect(mockPrismaService.pasaporte.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          profesorId: createDto.profesorId,
          tipo: createDto.tipo,
          numero: 'A123456', // Uppercase
          fechaExpedicion: createDto.fechaExpedicion,
          fechaVencimiento: createDto.fechaVencimiento,
          lugarExpedicion: 'HABANA', // Uppercase
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when profesor not found', async () => {
      // Arrange
      mockPrismaService.profesor.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto, 'user-uuid-1')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.pasaporte.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when formato de pasaporte is invalid', async () => {
      // Arrange
      const mockProfesor = createMockProfesor();
      mockPrismaService.profesor.findUnique.mockResolvedValue(mockProfesor);

      const invalidDto = { ...createDto, numero: 'invalid-format' };

      // Act & Assert
      await expect(service.create(invalidDto, 'user-uuid-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when pasaporte number already exists', async () => {
      // Arrange
      const mockProfesor = createMockProfesor();
      const existingPasaporte = createMockPasaporte();

      mockPrismaService.profesor.findUnique.mockResolvedValue(mockProfesor);
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(existingPasaporte);

      // Act & Assert
      await expect(service.create(createDto, 'user-uuid-1')).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when fechaVencimiento is before fechaExpedicion', async () => {
      // Arrange
      const mockProfesor = createMockProfesor();
      mockPrismaService.profesor.findUnique.mockResolvedValue(mockProfesor);
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null);

      const invalidDatesDto = {
        ...createDto,
        fechaExpedicion: new Date('2023-01-15'),
        fechaVencimiento: new Date('2022-01-15'), // Before expedición
      };

      // Act & Assert
      await expect(service.create(invalidDatesDto, 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create pasaporte without lugarExpedicion (optional field)', async () => {
      // Arrange
      const mockProfesor = createMockProfesor();
      const mockCreatedPasaporte = createMockPasaporte({ lugarExpedicion: null });

      mockPrismaService.profesor.findUnique.mockResolvedValue(mockProfesor);
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null);
      mockPrismaService.pasaporte.create.mockResolvedValue(mockCreatedPasaporte);

      const dtoWithoutLugar = { ...createDto, lugarExpedicion: undefined };

      // Act
      const result = await service.create(dtoWithoutLugar, 'user-uuid-1');

      // Assert
      expect(result).toEqual(mockCreatedPasaporte);
    });

    it('should uppercase lugarExpedicion when provided', async () => {
      // Arrange
      const mockProfesor = createMockProfesor();
      mockPrismaService.profesor.findUnique.mockResolvedValue(mockProfesor);
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null);
      mockPrismaService.pasaporte.create.mockResolvedValue(createMockPasaporte());

      const dtoWithLowercaseLugar = { ...createDto, lugarExpedicion: 'habana' };

      // Act
      await service.create(dtoWithLowercaseLugar, 'user-uuid-1');

      // Assert
      expect(mockPrismaService.pasaporte.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lugarExpedicion: 'HABANA',
          }),
        }),
      );
    });
  });

  // ============================================
  // update() Tests
  // ============================================
  describe('update', () => {
    const updateDto: UpdatePasaporteDto = {
      profesorId: 'profesor-uuid-1',
      tipo: TipoPasaporte.ORDINARIO,
      numero: 'A123456',
      fechaExpedicion: new Date('2023-01-15'),
      fechaVencimiento: new Date('2033-01-15'),
      lugarExpedicion: 'HABANA',
    };

    it('should update pasaporte successfully', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte();
      const updatedPasaporte = createMockPasaporte({
        tipo: TipoPasaporte.OFICIAL,
      });

      mockPrismaService.pasaporte.findUnique.mockResolvedValue(existingPasaporte);
      mockPrismaService.pasaporte.update.mockResolvedValue(updatedPasaporte);

      const dtoToUpdate = { ...updateDto, tipo: TipoPasaporte.OFICIAL };

      // Act
      const result = await service.update('pasaporte-uuid-1', dtoToUpdate, 'user-uuid-1');

      // Assert
      expect(result).toEqual(updatedPasaporte);
      expect(mockPrismaService.pasaporte.update).toHaveBeenCalledWith({
        where: { id: 'pasaporte-uuid-1' },
        data: expect.objectContaining({
          tipo: TipoPasaporte.OFICIAL,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when pasaporte not found', async () => {
      // Arrange
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('non-existent-id', updateDto, 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when pasaporte is inactive', async () => {
      // Arrange
      const inactivePasaporte = createMockPasaporte({ activo: false });
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(inactivePasaporte);

      // Act & Assert
      await expect(service.update('pasaporte-uuid-1', updateDto, 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow updating to a new valid numero', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte({ numero: 'A123456' });
      const updatedPasaporte = createMockPasaporte({ numero: 'B654321' });

      mockPrismaService.pasaporte.findUnique
        .mockResolvedValueOnce(existingPasaporte) // First call to find the pasaporte
        .mockResolvedValueOnce(null); // Second call to check if new numero exists

      mockPrismaService.pasaporte.update.mockResolvedValue(updatedPasaporte);

      const dtoWithNewNumero = { ...updateDto, numero: 'B654321' };

      // Act
      const result = await service.update('pasaporte-uuid-1', dtoWithNewNumero, 'user-uuid-1');

      // Assert
      expect(result.numero).toBe('B654321');
    });

    it('should throw ConflictException when changing to an existing numero', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte({ numero: 'A123456' });
      const otherPasaporte = createMockPasaporte({
        id: 'other-uuid',
        numero: 'B654321',
      });

      mockPrismaService.pasaporte.findUnique
        .mockResolvedValueOnce(existingPasaporte)
        .mockResolvedValueOnce(otherPasaporte);

      const dtoWithExistingNumero = { ...updateDto, numero: 'B654321' };

      // Act & Assert
      await expect(
        service.update('pasaporte-uuid-1', dtoWithExistingNumero, 'user-uuid-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow keeping the same numero without conflict', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte({ numero: 'A123456' });
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(existingPasaporte);
      mockPrismaService.pasaporte.update.mockResolvedValue(existingPasaporte);

      // Act - trying to update with same numero
      const result = await service.update('pasaporte-uuid-1', updateDto, 'user-uuid-1');

      // Assert
      expect(result).toEqual(existingPasaporte);
      // Should not check if numero exists because it's the same
      expect(mockPrismaService.pasaporte.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when fechaVencimiento is before fechaExpedicion', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte();
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(existingPasaporte);

      const invalidDatesDto = {
        ...updateDto,
        fechaExpedicion: new Date('2023-01-15'),
        fechaVencimiento: new Date('2022-01-15'),
      };

      // Act & Assert
      await expect(
        service.update('pasaporte-uuid-1', invalidDatesDto, 'user-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when numero format is invalid', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte();
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(existingPasaporte);

      const invalidDto = { ...updateDto, numero: 'invalid' };

      // Act & Assert
      await expect(service.update('pasaporte-uuid-1', invalidDto, 'user-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================
  // remove() Tests
  // ============================================
  describe('remove', () => {
    it('should soft delete pasaporte successfully', async () => {
      // Arrange
      const existingPasaporte = createMockPasaporte();
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(existingPasaporte);
      mockPrismaService.pasaporte.update.mockResolvedValue({
        ...existingPasaporte,
        activo: false,
      });

      // Act
      await service.remove('pasaporte-uuid-1');

      // Assert
      expect(mockPrismaService.pasaporte.update).toHaveBeenCalledWith({
        where: { id: 'pasaporte-uuid-1' },
        data: { activo: false },
      });
    });

    it('should throw NotFoundException when pasaporte not found', async () => {
      // Arrange
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when pasaporte is already inactive', async () => {
      // Arrange
      const inactivePasaporte = createMockPasaporte({ activo: false });
      mockPrismaService.pasaporte.findUnique.mockResolvedValue(inactivePasaporte);

      // Act & Assert
      await expect(service.remove('pasaporte-uuid-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // getAlertasVencimientos() Tests
  // ============================================
  describe('getAlertasVencimientos', () => {
    it('should return alerts for expired and upcoming passports', async () => {
      // Arrange
      const pasaporteVencido = createMockPasaporte({
        fechaVencimiento: subDays(new Date(), 10),
      });
      const pasaporteProximo30 = createMockPasaporte({
        id: 'uuid-proximo-30',
        numero: 'B234567',
        fechaVencimiento: addDays(new Date(), 15),
      });
      const pasaporteProximo90 = createMockPasaporte({
        id: 'uuid-proximo-90',
        numero: 'C345678',
        fechaVencimiento: addDays(new Date(), 60),
      });

      mockPrismaService.pasaporte.findMany
        .mockResolvedValueOnce([pasaporteVencido]) // vencidos
        .mockResolvedValueOnce([pasaporteProximo30]) // proximos30
        .mockResolvedValueOnce([pasaporteProximo90]); // proximos90

      // Act
      const result = await service.getAlertasVencimientos();

      // Assert
      expect(result.vencidos).toHaveLength(1);
      expect(result.proximos30).toHaveLength(1);
      expect(result.proximos90).toHaveLength(1);
      expect(result.resumen).toEqual({
        totalVencidos: 1,
        totalProximos30: 1,
        totalProximos90: 1,
      });
    });

    it('should return empty arrays when no alerts', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.getAlertasVencimientos();

      // Assert
      expect(result.vencidos).toEqual([]);
      expect(result.proximos30).toEqual([]);
      expect(result.proximos90).toEqual([]);
      expect(result.resumen).toEqual({
        totalVencidos: 0,
        totalProximos30: 0,
        totalProximos90: 0,
      });
    });

    it('should filter only active pasaportes', async () => {
      // Arrange
      mockPrismaService.pasaporte.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      await service.getAlertasVencimientos();

      // Assert
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activo: true,
          }),
        }),
      );
    });

    it('should include profesor data in alerts', async () => {
      // Arrange
      const pasaporteConProfesor = createMockPasaporte();
      mockPrismaService.pasaporte.findMany
        .mockResolvedValueOnce([pasaporteConProfesor])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.getAlertasVencimientos();

      // Assert
      expect(mockPrismaService.pasaporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            profesor: expect.objectContaining({
              select: expect.objectContaining({
                telefonoMovil: true,
                email: true,
              }),
            }),
          }),
        }),
      );
    });
  });
});
